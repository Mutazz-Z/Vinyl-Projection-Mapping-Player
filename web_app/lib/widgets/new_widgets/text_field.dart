import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

class PillTextField extends StatelessWidget {
  final String hintText;
  final bool isHidden;
  final IconData? prefixIcon;
  final TextEditingController? controller;

  const PillTextField({
    super.key,
    required this.hintText,
    this.isHidden = false,
    this.prefixIcon,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.porcelain,
        borderRadius: BorderRadius.circular(50.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            spreadRadius: 1,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        obscureText: isHidden,

        autofillHints: const [],
        keyboardType: TextInputType.text,
        enableSuggestions: !isHidden,
        autocorrect: !isHidden,

        decoration: InputDecoration(
          hintText: hintText,
          prefixIcon: prefixIcon != null
              ? Padding(
                  padding: const EdgeInsets.only(left: 12.0, right: 8.0),
                  child: Icon(prefixIcon, color: AppColors.subtleText),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 24.0,
            vertical: 16.0,
          ),
        ),
      ),
    );
  }
}
