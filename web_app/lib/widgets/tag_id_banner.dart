import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

class TagIdBanner extends StatelessWidget {
  final String uid;

  const TagIdBanner({super.key, required this.uid});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.containerPadding),
      decoration: BoxDecoration(
        color: AppColors.tagBannerBackground,
        borderRadius: BorderRadius.circular(AppSpacing.containerRadius),
      ),
      child: Row(
        children: <Widget>[
          const Icon(Icons.nfc, color: AppColors.tagBannerIcon),
          const SizedBox(width: AppSpacing.bannerIconGap),
          Text('Tag ID: $uid', style: AppTextStyles.tagIdentifier),
        ],
      ),
    );
  }
}
