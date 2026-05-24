import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

enum AppPageTab {
  library,
  settings,
}

class AppNavigationRail extends StatelessWidget {
  final AppPageTab selectedTab;
  final ValueChanged<int> onTabSelected;

  const AppNavigationRail({
    super.key,
    required this.selectedTab,
    required this.onTabSelected,
  });

  @override
  Widget build(BuildContext context) {
    return NavigationRail(
      backgroundColor: const Color(0xFF1B1E26),
      selectedIndex: selectedTab.index,
      onDestinationSelected: onTabSelected,
      labelType: NavigationRailLabelType.none,
      indicatorColor: Colors.transparent,
      selectedIconTheme: const IconThemeData(
        color: AppColors.brightGold,
        size: 28,
      ),
      unselectedIconTheme: const IconThemeData(color: Colors.white54, size: 28),
      groupAlignment: 0.0,
      destinations: const [
        NavigationRailDestination(
          icon: Icon(Icons.music_note),
          label: Text('Library'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.settings),
          label: Text('Settings'),
        ),
      ],
    );
  }
}
