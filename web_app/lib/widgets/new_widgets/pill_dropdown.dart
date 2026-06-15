import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

class PillDropdown<T> extends StatelessWidget {
  final T? value;
  final String hintText;
  final IconData? prefixIcon;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?>? onChanged;

  const PillDropdown({
    super.key,
    required this.value,
    required this.hintText,
    required this.items,
    this.prefixIcon,
    this.onChanged,
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
      child: DropdownButtonHideUnderline(
        child: DropdownButtonFormField<T>(
          value: value,
          items: items,
          onChanged: onChanged,
          icon: const Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: Icon(Icons.arrow_drop_down, color: AppColors.subtleText),
          ),
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
      ),
    );
  }
}
