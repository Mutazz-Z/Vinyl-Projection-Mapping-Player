import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

class SystemTextInput extends StatefulWidget {
  final String label;
  final String? hint;
  final TextEditingController controller;
  final Color fillColor;
  final bool isObscured;
  final bool allowToggle;
  final IconData? prefixIcon;
  final Color? prefixIconColor;

  const SystemTextInput({
    super.key,
    required this.label,
    required this.controller,
    required this.fillColor,
    this.hint,
    this.isObscured = false,
    this.allowToggle = false,
    this.prefixIcon,
    this.prefixIconColor,
  });

  @override
  State<SystemTextInput> createState() => _SystemTextInputState();
}

class _SystemTextInputState extends State<SystemTextInput> {
  late bool _isHidden;

  @override
  void initState() {
    super.initState();
    _isHidden = widget.isObscured;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(color: AppColors.textLight, fontSize: 16),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: widget.controller,
          obscureText: _isHidden,
          keyboardType: TextInputType.visiblePassword,
          style: const TextStyle(color: AppColors.textLight),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: TextStyle(
              color: AppColors.textLight.withValues(alpha: 0.5),
            ),
            filled: true,
            fillColor: widget.fillColor,

            // The new prefix icon logic
            prefixIcon: widget.prefixIcon != null
                ? Icon(
                    widget.prefixIcon,
                    color: widget.prefixIconColor ?? AppColors.textLight,
                  )
                : null,

            // The visibility toggle on the right
            suffixIcon: widget.allowToggle
                ? IconButton(
                    icon: Icon(
                      _isHidden ? Icons.visibility_off : Icons.visibility,
                      color: AppColors.textLight.withValues(alpha: 0.7),
                    ),
                    onPressed: () => setState(() => _isHidden = !_isHidden),
                  )
                : null,

            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),

            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: AppColors.textLight,
                width: 2.0,
              ),
            ),

            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
        ),
      ],
    );
  }
}
