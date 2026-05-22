import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

class VinylRecord extends StatelessWidget {
  final double size;
  final Color outerColor;
  final ImageProvider? outerImage;
  final Color labelColor;
  final ImageProvider? labelImage;

  const VinylRecord({
    super.key,
    required this.size,
    this.outerColor = AppColors.backgroundDark,
    this.outerImage,
    this.labelColor = AppColors.textLight,
    this.labelImage,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: outerColor,
        image: outerImage != null
            ? DecorationImage(image: outerImage!, fit: BoxFit.cover)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(4, 4),
          ),
        ],
      ),
      child: Center(
        child: Container(
          width: size * 0.35,
          height: size * 0.35,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: labelColor,
            image: labelImage != null
                ? DecorationImage(image: labelImage!, fit: BoxFit.cover)
                : null,
          ),
          child: Center(
            child: Container(
              width: size * 0.05,
              height: size * 0.05,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.backgroundDark,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
