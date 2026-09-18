import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'token_storage.dart';

/// An error from the backend, carrying its stable `code` and a message that
/// is safe to show the lawyer.
class ApiException implements Exception {
  const ApiException(this.statusCode, this.code, this.message);

  final int statusCode;
  final String code;
  final String message;

  @override
  String toString() => 'ApiException($statusCode, $code): $message';
}

/// JSON client for the backend. Authorised calls attach the access token and,
/// when it has expired, refresh once and retry.
class ApiClient {
  ApiClient._();

  static final instance = ApiClient._();

  static const _refreshPath = '/api/v1/lawyer/auth/refresh';

  /// Uploads carry documents, so they get longer than plain JSON calls.
  static const _uploadTimeout = Duration(seconds: 90);

  final _http = http.Client();
  final _tokens = TokenStorage.instance;

  /// Shared so parallel 401s wait on a single refresh.
  Future<bool>? _refreshing;

  /// Called when the backend reports the account is suspended. Set once at
  /// startup; see `installSuspensionHandler`.
  void Function(String message)? onAccountSuspended;

  Future<Map<String, dynamic>> get(String path, {bool auth = true}) =>
      _send(() async => _json('GET', path, null), auth: auth);

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    bool auth = false,
  }) => _send(() async => _json('POST', path, body), auth: auth);

  Future<Map<String, dynamic>> put(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
    String method = 'PUT',
  }) => _send(() async => _json(method, path, body), auth: auth);

  /// Multipart form with text [fields] and [files] (field name → local path).
  Future<Map<String, dynamic>> multipart(
    String method,
    String path, {
    required Map<String, String> fields,
    Map<String, String> files = const {},
    bool auth = true,
  }) => _send(
    () async {
      final request = http.MultipartRequest(method, _uri(path))
        ..fields.addAll(fields);
      for (final entry in files.entries) {
        try {
          request.files.add(
            await http.MultipartFile.fromPath(entry.key, entry.value),
          );
        } catch (_) {
          throw const ApiException(
            0,
            'FILE_UNREADABLE',
            'One of the selected files could not be read. Please choose it again.',
          );
        }
      }
      return request;
    },
    auth: auth,
    timeout: _uploadTimeout,
  );

  /// Downloads a file (an uploaded document, say) rather than JSON.
  Future<Uint8List> bytes(String path) async {
    final token = await _tokens.accessToken;
    final response = await _http
        .get(
          _uri(path),
          headers: {if (token != null) 'Authorization': 'Bearer $token'},
        )
        .timeout(_uploadTimeout)
        .catchError((_) {
          throw const ApiException(
            0,
            'NETWORK_ERROR',
            "Can't reach the server. Check your internet connection.",
          );
        });

    if (response.statusCode == 401 && await _refresh()) return bytes(path);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const ApiException(
        0,
        'DOCUMENT_UNAVAILABLE',
        'This file could not be opened. Please try again.',
      );
    }
    return response.bodyBytes;
  }

  Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}$path');

  http.Request _json(String method, String path, Map<String, dynamic>? body) {
    final request = http.Request(method, _uri(path));
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }
    return request;
  }

  /// [build] creates a fresh request each time, so a retry after refreshing
  /// the token never reuses a consumed body.
  Future<Map<String, dynamic>> _send(
    Future<http.BaseRequest> Function() build, {
    required bool auth,
    bool retry = true,
    Duration timeout = ApiConfig.timeout,
  }) async {
    final request = await build();
    request.headers['Accept'] = 'application/json';
    if (auth) {
      final token = await _tokens.accessToken;
      if (token != null) request.headers['Authorization'] = 'Bearer $token';
    }

    final http.Response response;
    try {
      response = await http.Response.fromStream(
        await _http.send(request).timeout(timeout),
      );
    } on TimeoutException {
      throw const ApiException(
        0,
        'TIMEOUT',
        'The server is taking too long. Please try again.',
      );
    } catch (_) {
      throw const ApiException(
        0,
        'NETWORK_ERROR',
        "Can't reach the server. Check your internet connection.",
      );
    }

    if (response.statusCode == 401 && auth && retry && await _refresh()) {
      return _send(build, auth: auth, retry: false, timeout: timeout);
    }

    Map<String, dynamic> data;
    try {
      final decoded = jsonDecode(response.body);
      data = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
    } catch (_) {
      data = <String, dynamic>{};
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      // Validation errors list every problem; the first is the most useful.
      final details = data['details'];
      final message = details is List && details.isNotEmpty
          ? details.first.toString()
          : data['message'] as String?;
      final code = data['code'] as String? ?? 'UNKNOWN_ERROR';
      final text = message ?? 'Something went wrong. Please try again.';

      // An admin suspended the account: end the session here, so no screen
      // is left holding a token that no longer works.
      if (code == 'ACCOUNT_SUSPENDED') {
        await _tokens.clear();
        onAccountSuspended?.call(text);
      }

      throw ApiException(response.statusCode, code, text);
    }
    return data;
  }

  Future<bool> _refresh() {
    return _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);
  }

  Future<bool> _doRefresh() async {
    final refreshToken = await _tokens.refreshToken;
    if (refreshToken == null) return false;

    try {
      final data = await post(
        _refreshPath,
        body: {'refreshToken': refreshToken},
      );
      await _tokens.save(
        access: data['accessToken'] as String,
        refresh: data['refreshToken'] as String,
      );
      return true;
    } on ApiException {
      await _tokens.clear();
      return false;
    }
  }
}
