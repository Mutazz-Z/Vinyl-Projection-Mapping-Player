import 'package:flutter/material.dart';

class TextLink extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final Color color;

  const TextLink({
    super.key,
    required this.text,
    required this.onPressed,
    this.color = Colors.white,
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
