import 'package:flutter/material.dart';

enum AppPageTab { home, library, debug, profile }

class AppNavigationRail extends StatefulWidget {
  final AppPageTab selectedTab;

  final ValueChanged<int> onTabSelected;

  const AppNavigationRail({
    super.key,
    required this.selectedTab,
    required this.onTabSelected,
  });

  @override
  State<AppNavigationRail> createState() => _AppNavigationRailState();
}

class _AppNavigationRailState extends State<AppNavigationRail> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return NavigationRail(
      extended: _isExpanded,
      selectedIndex: widget.selectedTab.index,
      onDestinationSelected: widget.onTabSelected,
      leading: _buildToggleButton(),
      destinations: const [
        NavigationRailDestination(icon: Icon(Icons.home), label: Text('Home')),
        NavigationRailDestination(
          icon: Icon(Icons.album),
          label: Text('Library'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.bug_report),
          label: Text('Debug'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.person),
          label: Text('Profile'),
        ),
      ],
    );
  }

  Widget _buildToggleButton() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: IconButton(
        icon: Icon(_isExpanded ? Icons.menu_open : Icons.menu),
        onPressed: () {
          setState(() => _isExpanded = !_isExpanded);
        },
        tooltip: _isExpanded ? 'Collapse sidebar' : 'Expand sidebar',
      ),
    );
  }
}
