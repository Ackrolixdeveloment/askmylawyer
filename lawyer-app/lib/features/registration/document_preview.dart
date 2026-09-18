import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/upload_field.dart';
import 'registration_repository.dart';

/// Opens [file] full screen. Files already on the server are fetched by
/// [documentType]; a file just picked is read straight from the device.
void openDocumentPreview(
  BuildContext context, {
  required String title,
  required PickedDocument file,
  required String documentType,
}) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => DocumentPreviewScreen(
        title: title,
        fileName: file.name,
        localPath: file.path,
        documentType: documentType,
      ),
    ),
  );
}

/// Shows a document the lawyer uploaded: images open in the app, anything
/// else (a PDF certificate) hands over to the phone's own viewer.
class DocumentPreviewScreen extends StatefulWidget {
  const DocumentPreviewScreen({
    super.key,
    required this.title,
    required this.fileName,
    this.localPath,
    this.documentType,
  });

  final String title;
  final String fileName;

  /// Set for a file just picked on this device.
  final String? localPath;

  /// Set for a file already on the server: aadhaar, pan, bar_certificate…
  final String? documentType;

  @override
  State<DocumentPreviewScreen> createState() => _DocumentPreviewScreenState();
}

class _DocumentPreviewScreenState extends State<DocumentPreviewScreen> {
  Uint8List? _bytes;
  File? _file;
  String? _error;

  bool get _isImage {
    final name = widget.fileName.toLowerCase();
    return name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg');
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);

    try {
      // A file picked on this device is already on disk.
      final local = widget.localPath;
      if (local != null) {
        final file = File(
          local.startsWith('file:') ? Uri.parse(local).toFilePath() : local,
        );
        if (!mounted) return;
        setState(() {
          _file = file;
          _bytes = _isImage ? file.readAsBytesSync() : null;
        });
        if (!_isImage) await _openExternally(file);
        return;
      }

      final bytes = await RegistrationRepository.instance.documentBytes(
        widget.documentType!,
      );
      if (!mounted) return;

      if (_isImage) {
        setState(() => _bytes = bytes);
        return;
      }

      // Non-images are written out so the system viewer can take over.
      final directory = await getTemporaryDirectory();
      final file = File('${directory.path}/${widget.fileName}');
      await file.writeAsBytes(bytes);
      if (!mounted) return;

      setState(() => _file = file);
      await _openExternally(file);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'This file could not be opened.');
      }
    }
  }

  Future<void> _openExternally(File file) async {
    final result = await OpenFilex.open(file.path);
    if (!mounted || result.type == ResultType.done) return;

    setState(
      () => _error = 'No app on this phone can open ${widget.fileName}.',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink,
      appBar: AppBar(
        backgroundColor: AppColors.ink,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        title: Text(
          widget.title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      body: Center(child: _body()),
    );
  }

  Widget _body() {
    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline,
              size: 40,
              color: AppColors.negative,
            ),
            const SizedBox(height: 12),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: Colors.white70),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: _load, child: const Text('Try again')),
          ],
        ),
      );
    }

    final bytes = _bytes;
    if (_isImage && bytes != null) {
      // Pinch and pan, so small print on a scan can be read.
      return InteractiveViewer(
        maxScale: 5,
        child: Image.memory(bytes, fit: BoxFit.contain),
      );
    }

    if (!_isImage && _file != null) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.picture_as_pdf_outlined,
              size: 48,
              color: Colors.white70,
            ),
            const SizedBox(height: 12),
            Text(
              widget.fileName,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: Colors.white70),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => _openExternally(_file!),
              child: const Text('Open file'),
            ),
          ],
        ),
      );
    }

    return const CircularProgressIndicator(color: Colors.white);
  }
}
