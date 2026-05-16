import 'package:flutter/material.dart';

abstract final class AppColors {
  /// The primary brand seed color used to generate the full Material color scheme.
  static const Color brandSeed = Color(0xFF607D8B); // Blue Grey 500

  /// Background tint for the NFC tag ID banner on the register screen.
  /// Blue Grey at 20% opacity.
  static const Color tagBannerBackground = Color(0x33607D8B);

  /// Icon and label color inside the NFC tag banner.
  static const Color tagBannerIcon = Color(0xFF607D8B); // Blue Grey 500

  /// Color used to indicate a live or connected status.
  static const Color statusActive = Color(0xFF4CAF50); // Green 500

  /// Color used for destructive actions such as delete buttons and labels.
  static const Color destructive = Color(0xFFF44336); // Red 500

  /// Accent color for the metadata auto-fill wand button.
  static const Color autoFillAccent = Color(0xFF7C4DFF); // Deep Purple Accent 400

  /// Muted text color for secondary or helper labels.
  static const Color subtleText = Color(0xFF9E9E9E); // Grey 400
}

// ---------------------------------------------------------------------------
// Text Styles
// ---------------------------------------------------------------------------

/// All reusable text styles used across the application.
abstract final class AppTextStyles {
  /// Large headline on the home screen when the system is active.
  static const TextStyle homeStatusHeadline = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
  );

  /// Secondary label on the home screen showing MQTT connection status.
  static const TextStyle homeStatusConnected = TextStyle(
    color: AppColors.statusActive,
    fontWeight: FontWeight.w500,
  );

  /// Small descriptive caption on the home screen.
  static const TextStyle homeStatusCaption = TextStyle(
    color: AppColors.subtleText,
    fontSize: 12,
  );

  /// Monospace style used when displaying raw NFC tag UIDs.
  static const TextStyle tagIdentifier = TextStyle(
    fontFamily: 'monospace',
    fontWeight: FontWeight.bold,
  );

  /// Style applied to text inside the primary submit button.
  static const TextStyle submitButton = TextStyle(fontSize: 16);

  /// Style for text labels that represent a destructive action (e.g. delete).
  static const TextStyle destructiveLabel = TextStyle(
    color: AppColors.destructive,
  );
}

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

/// All layout spacing constants used across the application.
abstract final class AppSpacing {
  /// Standard horizontal and vertical padding applied to full-page content areas.
  static const double pagePadding = 24.0;

  /// Vertical gap between major sections within a screen.
  static const double sectionGap = 32.0;

  /// Vertical gap between adjacent form fields.
  static const double fieldGap = 20.0;

  /// Small gap used for inline elements such as an icon next to a label.
  static const double inlineElementGap = 8.0;

  /// Gap between an icon and its adjacent text inside a banner row.
  static const double bannerIconGap = 12.0;

  /// Inner padding applied inside banner or card containers.
  static const double containerPadding = 12.0;

  /// Border radius for rounded containers such as the tag ID banner.
  static const double containerRadius = 8.0;

  /// Height of the primary submit button.
  static const double submitButtonHeight = 54.0;

  /// Size of the hero icon displayed on the home screen.
  static const double heroIconSize = 80.0;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/// Constructs and provides the application's ThemeData objects.
abstract final class AppTheme {
  /// The default dark theme used by the application.
  static ThemeData get darkTheme => ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brandSeed,
      brightness: Brightness.dark,
    ),
    useMaterial3: true,
  );
}
