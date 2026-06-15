import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

class PlayerSelectionTile extends StatelessWidget {
  final String playerName;
  final bool isSelected;
  final VoidCallback onTap;

  const PlayerSelectionTile({
    super.key,
    required this.playerName,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    const activeColor = AppColors.green;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16.0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withValues(alpha: 0.08) : AppColors.porcelain,
          borderRadius: BorderRadius.circular(16.0),
          border: Border.all(
            color: isSelected ? activeColor : AppColors.subtleText,
            width: 2.0,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.speaker,
              color: isSelected ? activeColor : AppColors.subtleText,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                playerName,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? activeColor : AppColors.subtleText,
                ),
              ),
            ),
            if (isSelected) const Icon(Icons.check_circle, color: activeColor),
          ],
        ),
      ),
    );
  }
}
