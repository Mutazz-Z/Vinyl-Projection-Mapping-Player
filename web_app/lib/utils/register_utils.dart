import 'package:flutter/material.dart';

class RegisterUtils {
  static String normalizeColorHex(String? input) {
    final String trimmed = (input ?? '').trim();
    if (trimmed.isEmpty) {
      return '#1A1A1A';
    }

    if (trimmed.startsWith('#') &&
        (trimmed.length == 7 || trimmed.length == 9)) {
      return trimmed.toUpperCase();
    }

    final Color parsed = parseHexColor(trimmed);
    return toHexColor(parsed);
  }

  static Color parseHexColor(String input) {
    final String cleaned = input.replaceAll('#', '').trim();

    if (cleaned.length == 6) {
      try {
        return Color(int.parse('FF$cleaned', radix: 16));
      } catch (_) {
        return const Color(0xFF1A1A1A);
      }
    }
    if (cleaned.length == 8) {
      try {
        return Color(int.parse(cleaned, radix: 16));
      } catch (_) {
        return const Color(0xFF1A1A1A);
      }
    }

    return const Color(0xFF1A1A1A);
  }

  static String toHexColor(Color color) {
    final String hexValue = color
        .toARGB32()
        .toRadixString(16)
        .padLeft(8, '0')
        .toUpperCase();
    return '#${hexValue.substring(2)}';
  }

  static String displayNameForAssetUrl(String url) {
    final String trimmed = url.trim();
    if (trimmed.isEmpty) {
      return 'None';
    }

    final Uri? parsed = Uri.tryParse(trimmed);
    final String lastSegment = parsed?.pathSegments.isNotEmpty == true
        ? parsed!.pathSegments.last
        : trimmed;

    if (lastSegment.isEmpty) {
      return trimmed;
    }

    return lastSegment;
  }
}
