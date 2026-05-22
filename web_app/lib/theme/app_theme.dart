import 'package:flutter/material.dart';

abstract final class AppColors {
  /// Very dark background color
  static const Color backgroundDark = Color(0xFF0C0D08);

  /// Off-white for text and light elements
  static const Color textLight = Color(0xFFF1FAEE);

  /// Dark blue for cards and main containers
  static const Color brandBlue = Color(0xFF0A2463);

  /// Orange for text inputs and accents
  static const Color accentOrange = Color(0xFFD58936);

  /// Teal for primary buttons and success states
  static const Color accentTeal = Color(0xFF136F63);

  /// Dark red for destructive actions
  static const Color destructiveRed = Color(0xFFA52422);
}

// ---------------------------------------------------------------------------
// Text Styles
// ---------------------------------------------------------------------------

abstract final class AppTextStyles {
  // Using San Francisco as the default font family for these styles
  static const String _fontFamily = 'San Francisco';

  static const TextStyle homeStatusHeadline = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.textLight,
  );

  static const TextStyle homeStatusConnected = TextStyle(
    fontFamily: _fontFamily,
    color: AppColors.accentTeal,
    fontWeight: FontWeight.w500,
  );

  static const TextStyle homeStatusCaption = TextStyle(
    fontFamily: _fontFamily,
    color: Colors.grey, // Fallback subtle color
    fontSize: 12,
  );

  static const TextStyle tagIdentifier = TextStyle(
    fontFamily: 'monospace', // Keep monospace for IDs
    fontWeight: FontWeight.bold,
  );

  static const TextStyle submitButton = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 16,
    color: AppColors.textLight,
  );

  static const TextStyle destructiveLabel = TextStyle(
    fontFamily: _fontFamily,
    color: AppColors.destructiveRed,
  );
}

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

abstract final class AppSpacing {
  static const double pagePadding = 24.0;
  static const double sectionGap = 32.0;
  static const double fieldGap = 20.0;
  static const double inlineElementGap = 8.0;
  static const double bannerIconGap = 12.0;
  static const double containerPadding = 12.0;
  static const double containerRadius = 8.0;
  static const double submitButtonHeight = 54.0;
  static const double heroIconSize = 80.0;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

abstract final class AppTheme {
  static ThemeData get darkTheme => ThemeData(
    fontFamily: 'San Francisco',
    scaffoldBackgroundColor: AppColors.backgroundDark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brandBlue,
      brightness: Brightness.dark,
      error: AppColors.destructiveRed,
    ),
    useMaterial3: true,
  );
}
