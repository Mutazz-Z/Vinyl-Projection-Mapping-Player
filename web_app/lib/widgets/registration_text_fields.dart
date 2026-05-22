import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

InputDecoration _fieldDecoration(
  BuildContext context, {
  required String labelText,
  Widget? prefixIcon,
  Widget? suffixIcon,
  String? helperText,
  bool alignLabelWithHint = false,
}) {
  return InputDecoration(
    labelText: labelText,
    helperText: helperText,
    prefixIcon: prefixIcon,
    suffixIcon: suffixIcon,
    alignLabelWithHint: alignLabelWithHint,
    border: const OutlineInputBorder(),
    filled: true,
    fillColor: Theme.of(context).colorScheme.surface,
  );
}

class MediaUriField extends StatelessWidget {
  final TextEditingController controller;
  final bool isScrapingMetadata;

  const MediaUriField({
    super.key,
    required this.controller,
    required this.isScrapingMetadata,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: _fieldDecoration(
        context,
        labelText: 'Media URI',
        prefixIcon: const Icon(Icons.link),
        helperText:
            'Use a Music Assistant provider URI. Metadata and album cover auto-fill when available.',
        suffixIcon: isScrapingMetadata
            ? const Padding(
                padding: EdgeInsets.all(14),
                child: CircularProgressIndicator(strokeWidth: 2.5),
              )
            : const Icon(Icons.auto_fix_high, color: AppColors.textLight),
      ),
      validator: (String? value) =>
          value == null || value.trim().isEmpty ? 'Enter a media URI.' : null,
    );
  }
}

class ArtistField extends StatelessWidget {
  final TextEditingController controller;

  const ArtistField({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: _fieldDecoration(
        context,
        labelText: 'Artist Name',
        prefixIcon: const Icon(Icons.person),
      ),
      validator: (String? value) =>
          value == null || value.trim().isEmpty ? 'Enter an artist name.' : null,
    );
  }
}

class AlbumField extends StatelessWidget {
  final TextEditingController controller;

  const AlbumField({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: _fieldDecoration(
        context,
        labelText: 'Album Title',
        prefixIcon: const Icon(Icons.album),
      ),
      validator: (String? value) =>
          value == null || value.trim().isEmpty ? 'Enter an album title.' : null,
    );
  }
}

class TracksField extends StatelessWidget {
  final TextEditingController controller;

  const TracksField({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      minLines: 3,
      maxLines: 8,
      decoration: _fieldDecoration(
        context,
        labelText: 'Tracklist',
        prefixIcon: const Padding(
          padding: EdgeInsets.only(bottom: 40),
          child: Icon(Icons.format_list_bulleted),
        ),
        alignLabelWithHint: true,
        helperText: 'One track per line.',
      ),
    );
  }
}