import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:web_app/utils/register_utils.dart';

class OverlaySectionCard extends StatelessWidget {
  final String selectedOverlayArt;
  final List<String> overlayOptions;
  final bool isLoading;
  final bool isUploading;
  final ValueChanged<String?> onChanged;
  final VoidCallback onUploadCustom;
  final VoidCallback onClear;

  const OverlaySectionCard({
    super.key,
    required this.selectedOverlayArt,
    required this.overlayOptions,
    required this.isLoading,
    required this.isUploading,
    required this.onChanged,
    required this.onUploadCustom,
    required this.onClear,
  });

  List<String> _normalizedOptions() {
    final Set<String> deduped = <String>{''};

    for (final String option in overlayOptions) {
      final String normalized = option.trim();
      if (normalized.isNotEmpty) deduped.add(normalized);
    }

    final String selected = selectedOverlayArt.trim();
    if (selected.isNotEmpty) deduped.add(selected);

    return deduped.toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final List<String> options = _normalizedOptions();
    final String dropdownValue = options.contains(selectedOverlayArt)
        ? selectedOverlayArt
        : '';

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
            'Overlay Effect',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            value: dropdownValue,
            items: options
                .where((String option) => option.isNotEmpty || option == '')
                .map(
                  (String option) => DropdownMenuItem<String>(
                    value: option,
                    child: Text(
                      option.isEmpty
                          ? 'None'
                          : RegisterUtils.displayNameForAssetUrl(option),
                    ),
                  ),
                )
                .toList(growable: false),
            onChanged: isUploading || isLoading ? null : onChanged,
            decoration: InputDecoration(
              border: const OutlineInputBorder(),
              filled: true,
              fillColor: Theme.of(context).colorScheme.surface,
              suffixIcon: isLoading
                  ? const Padding(
                      padding: EdgeInsets.all(10),
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: <Widget>[
              ElevatedButton.icon(
                onPressed: isUploading ? null : onUploadCustom,
                icon: const Icon(Icons.upload_file),
                label: const Text('Upload Custom Overlay'),
              ),
              const SizedBox(width: 10),
              TextButton(onPressed: onClear, child: const Text('Clear')),
            ],
          ),
        ],
      ),
    );
  }
}
