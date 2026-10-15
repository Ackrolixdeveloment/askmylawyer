import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../core/theme/app_colors.dart';

/// Version and licences. The licence page is Flutter's own, which is what
/// both stores expect an app to show.
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: AppColors.surface,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'About',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
      ),
      body: FutureBuilder<PackageInfo>(
        future: PackageInfo.fromPlatform(),
        builder: (context, snapshot) {
          final info = snapshot.data;

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
            children: [
              Center(
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 72,
                  filterQuality: FilterQuality.high,
                ),
              ),
              const SizedBox(height: 14),
              const Center(
                child: Text(
                  'Ask My Lawyer',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Center(
                child: Text(
                  info == null
                      ? 'Loading version…'
                      : 'Version ${info.version} (${info.buildNumber})',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.inkSubtle,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Material(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  onTap: () => showLicensePage(
                    context: context,
                    applicationName: 'Ask My Lawyer',
                    applicationVersion: info?.version,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Open-source licences',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.ink,
                            ),
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          size: 20,
                          color: AppColors.inkSubtle,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
