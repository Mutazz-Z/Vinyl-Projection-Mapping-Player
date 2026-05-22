import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

class TextLink extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final Color color;

  const TextLink({
    super.key,
    required this.text,
    required this.onPressed,
    this.color = AppColors.shadowGrey,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Text(
          text,
          style: TextStyle(
            color: color,
            decoration: TextDecoration.underline,
            decorationColor: color,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
