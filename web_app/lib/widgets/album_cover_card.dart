import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:web_app/utils/register_utils.dart';

class AlbumCoverCard extends StatelessWidget {
  final TextEditingController controller;
  final bool isUploading;
  final VoidCallback onUploadOverride;

  const AlbumCoverCard({
    super.key,
    required this.controller,
    required this.isUploading,
    required this.onUploadOverride,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.containerPadding),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(AppSpacing.containerRadius),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'Album Cover Art',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
          Row(
            children: <Widget>[
              ElevatedButton.icon(
                onPressed: isUploading ? null : onUploadOverride,
                icon: const Icon(Icons.image_outlined),
                label: const Text('Upload Override'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  controller.text.trim().isEmpty
                      ? 'Using auto-fill when available.'
                      : RegisterUtils.displayNameForAssetUrl(
                          controller.text.trim(),
                        ),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
