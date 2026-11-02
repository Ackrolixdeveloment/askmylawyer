import 'dart:math';
import 'dart:typed_data';

import '../../core/network/api_client.dart';

String supportStatus(String value) => switch (value) {
  'new' => 'New',
  'in_progress' => 'In progress',
  'escalated' => 'Escalated',
  'resolved' => 'Resolved',
  'closed' => 'Closed',
  _ => value,
};
String supportDate(String value) {
  final d = DateTime.tryParse(value)
      ?.add(const Duration(hours: 5, minutes: 30));
  if (d == null) return 'Not recorded';
  String two(int v) => v.toString().padLeft(2, '0');
  return '${two(d.day)}-${two(d.month)}-${d.year} ${two(d.hour)}:${two(d.minute)} IST';
}

class SupportReply {
  SupportReply.fromJson(Map<String, dynamic> j)
    : id = j['id'] as String,
      author = j['authorName'] as String,
      body = j['body'] as String,
      date = j['createdAt'] as String,
      fromSupport = j['authorKind'] == 'admin';
  final String id, author, body, date;
  final bool fromSupport;
}

class SupportFile {
  SupportFile.fromJson(Map<String, dynamic> j)
    : id = j['id'] as String,
      name = j['name'] as String,
      mime = j['mimeType'] as String,
      size = (j['sizeBytes'] as num).toInt();
  final String id, name, mime;
  final int size;
}

class LiveSupportTicket {
  LiveSupportTicket.fromJson(Map<String, dynamic> j)
    : id = j['id'] as String,
      code = j['code'] as String,
      subject = j['subject'] as String,
      description = j['description'] as String? ?? '',
      category = j['categoryName'] as String,
      status = j['status'] as String,
      priority = j['priority'] as String,
      createdAt = j['createdAt'] as String,
      updatedAt = j['updatedAt'] as String,
      resolution = j['resolution'] as String?,
      hasMoreMessages = j['hasMoreMessages'] == true,
      messages = ((j['messages'] as List?) ?? [])
          .map(
            (v) => SupportReply.fromJson(Map<String, dynamic>.from(v as Map)),
          )
          .toList(),
      files = ((j['attachments'] as List?) ?? [])
          .map((v) => SupportFile.fromJson(Map<String, dynamic>.from(v as Map)))
          .toList();
  final String id,
      code,
      subject,
      description,
      category,
      status,
      priority,
      createdAt,
      updatedAt;
  final String? resolution;
  final bool hasMoreMessages;
  final List<SupportReply> messages;
  final List<SupportFile> files;
}

class SupportOption {
  SupportOption({required this.id, required this.label});
  final String id, label;
}

class SupportResult {
  SupportResult(this.rows, this.total, this.totalRecords);
  final List<LiveSupportTicket> rows;
  final int total, totalRecords;
}

class SupportRepository {
  SupportRepository._();
  static final instance = SupportRepository._();
  final _api = ApiClient.instance;
  static const prefix = '/api/v1/customer/support';
  String newKey() => List.generate(
    16,
    (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, '0'),
  ).join();
  Future<SupportResult> list({
    String search = '',
    String status = '',
    int page = 1,
  }) async {
    final q = {
      'page': '$page',
      'perPage': '20',
      if (search.trim().isNotEmpty) 'search': search.trim(),
      if (status.isNotEmpty) 'status': status,
    };
    final j = await _api.get('$prefix?${Uri(queryParameters: q).query}');
    return SupportResult(
      (j['data'] as List)
          .map(
            (v) =>
                LiveSupportTicket.fromJson(Map<String, dynamic>.from(v as Map)),
          )
          .toList(),
      (j['total'] as num).toInt(),
      (j['totalRecords'] as num).toInt(),
    );
  }

  Future<LiveSupportTicket> detail(String id) async =>
      LiveSupportTicket.fromJson(await _api.get('$prefix/$id'));
  Future<List<SupportOption>> categories() async {
    final j = await _api.get('$prefix/categories');
    return (j['data'] as List).map((v) {
      final r = Map<String, dynamic>.from(v as Map);
      return SupportOption(id: r['id'] as String, label: r['name'] as String);
    }).toList();
  }

  Future<List<SupportOption>> consultations([String q = '']) async {
    final j = await _api.get(
      '$prefix/consultations${q.trim().length >= 2 ? '?${Uri(queryParameters: {'q': q.trim()}).query}' : ''}',
    );
    return (j['data'] as List).map((v) {
      final r = Map<String, dynamic>.from(v as Map);
      return SupportOption(
        id: r['id'] as String,
        label: '${r['code']} · ${r['participant']}',
      );
    }).toList();
  }

  Future<LiveSupportTicket> create({
    required String subject,
    required String description,
    required String clientKey,
    String? categoryId,
    String? requestId,
  }) async => LiveSupportTicket.fromJson(
    await _api.post(
      prefix,
      auth: true,
      body: {
        'subject': subject.trim(),
        'description': description.trim(),
        'clientKey': clientKey,
        if (categoryId != null && categoryId.isNotEmpty)
          'categoryId': categoryId,
        if (requestId != null && requestId.isNotEmpty) 'requestId': requestId,
      },
    ),
  );
  Future<void> reply(String id, String body) async {
    await _api.post(
      '$prefix/$id/messages',
      auth: true,
      body: {'body': body.trim()},
    );
  }

  Future<({List<SupportReply> rows, bool hasMore})> older(
    String id,
    String before,
  ) async {
    final j = await _api.get(
      '$prefix/$id/messages?${Uri(queryParameters: {'before': before}).query}',
    );
    return (
      rows: (j['data'] as List)
          .map(
            (v) => SupportReply.fromJson(Map<String, dynamic>.from(v as Map)),
          )
          .toList(),
      hasMore: j['hasMore'] == true,
    );
  }

  Future<void> upload(String id, Uint8List bytes, String fileName) async {
    await _api.multipartBytes(
      '$prefix/$id/attachments',
      bytes: bytes,
      fileName: fileName,
    );
  }

  String fileUrl(String id, String fileId) => '$prefix/$id/attachments/$fileId';
}
