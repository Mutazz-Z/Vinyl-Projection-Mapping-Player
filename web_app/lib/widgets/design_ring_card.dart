import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:web_app/utils/register_utils.dart';

enum DesignMode { color, image }

class DesignRingCard extends StatelessWidget {
  final String title;
  final DesignMode mode;
  final String colorText;
  final String imageText;
  final bool isUploading;
  final VoidCallback onSelectColorMode;
  final Future<void> Function() onSelectImageMode;
  final Future<void> Function() onPickColor;

  const DesignRingCard({
    super.key,
    required this.title,
    required this.mode,
    required this.colorText,
    required this.imageText,
    required this.isUploading,
    required this.onSelectColorMode,
    required this.onSelectImageMode,
    required this.onPickColor,
  });

  @override
  Widget build(BuildContext context) {
    final Color swatchColor = RegisterUtils.parseHexColor(colorText.trim());

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
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: <Widget>[
              OutlinedButton.icon(
                onPressed: isUploading
                    ? null
                    : () async {
                        onSelectColorMode();
                        await onPickColor();
                      },
                icon: const Icon(Icons.palette_outlined),
                label: const Text('Color Wheel'),
              ),
              ElevatedButton.icon(
                onPressed: isUploading ? null : onSelectImageMode,
                icon: const Icon(Icons.upload_file),
                label: const Text('Upload Image'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (mode == DesignMode.color)
            Row(
              children: <Widget>[
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: swatchColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.black26),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  colorText.trim().isEmpty
                      ? '#1A1A1A'
                      : colorText.trim().toUpperCase(),
                ),
              ],
            )
          else
            Text(
              imageText.trim().isEmpty
                  ? 'No image selected.'
                  : RegisterUtils.displayNameForAssetUrl(imageText.trim()),
              style: Theme.of(context).textTheme.bodySmall,
            ),
        ],
      ),
    );
  }
}
