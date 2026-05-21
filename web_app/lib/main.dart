import 'package:flutter/material.dart';
import 'screens/debug_screen.dart';
import 'screens/home_screen.dart';
import 'screens/library_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/register_screen.dart';
import 'services/app_coordinator.dart';
import 'services/music_assistant/music_assistant_service.dart';
import 'services/system_data_source.dart';
import 'theme/app_theme.dart';
import 'widgets/app_navigation_rail.dart';
import 'screens/welcome_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
final MusicAssistantService musicAssistant = MusicAssistantService();

late final SystemDataSource systemDataSource;
late final AppCoordinator appCoordinator;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  String orchestratorHost = Uri.base.host;
  if (orchestratorHost.isEmpty || orchestratorHost == 'localhost') {
    orchestratorHost = '127.0.0.1';
  }

  systemDataSource = SystemDataSource(host: orchestratorHost, port: 8080);
  systemDataSource.connect();

  await Future.delayed(const Duration(milliseconds: 100));

  await musicAssistant.initializeService();

  appCoordinator = AppCoordinator(
    dataSource: systemDataSource,
    musicAssistant: musicAssistant,
    navigatorKey: navigatorKey,
  );

  final bool isFirstBoot = !musicAssistant.applicationSettings.isConfigured;

  if (!isFirstBoot) {
    debugPrint('main: SystemDataSource online. Handing off processing stream...');
    appCoordinator.start();
  }

  runApp(VinylApp(isFirstBoot: isFirstBoot));
}

class VinylApp extends StatelessWidget {
  final bool isFirstBoot;

  const VinylApp({super.key, required this.isFirstBoot});

  @override
  Widget build(BuildContext context) {
    final String? scannedUid = Uri.base.queryParameters['uid'];
    final bool hasScannedUid = scannedUid != null && scannedUid.isNotEmpty;

    Widget initialScreen;
    if (hasScannedUid) {
      initialScreen = RegisterScreen(uid: scannedUid);
    } else if (isFirstBoot) {
      initialScreen = const WelcomeScreen();
    } else {
      initialScreen = const AppShellScreen();
    }

    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Vinyl Orchestrator',
      theme: AppTheme.darkTheme,
      home: initialScreen,
    );
  }
}

class AppShellScreen extends StatefulWidget {
  const AppShellScreen({super.key});

  @override
  State<AppShellScreen> createState() => _AppShellScreenState();
}

class _AppShellScreenState extends State<AppShellScreen> {
  AppPageTab _selectedTab = AppPageTab.home;

  @override
  void initState() {
    super.initState();
    debugPrint('AppShellScreen: Playback monitoring subsystem bound.');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_titleForTab(_selectedTab))),
      body: Row(
        children: [
          AppNavigationRail(
            selectedTab: _selectedTab,
            onTabSelected: (int index) {
              setState(() => _selectedTab = AppPageTab.values[index]);
            },
          ),
          Expanded(child: _pageForTab(_selectedTab)),
        ],
      ),
    );
  }

  Widget _pageForTab(AppPageTab selectedTab) {
    switch (selectedTab) {
      case AppPageTab.home:
        return HomeScreen(systemDataSource: systemDataSource);
      case AppPageTab.library:
        return const LibraryScreen();
      case AppPageTab.debug:
        return const DebugScreen();
      case AppPageTab.profile:
        return const ProfileScreen();
    }
  }

  String _titleForTab(AppPageTab selectedTab) {
    switch (selectedTab) {
      case AppPageTab.home:
        return 'Vinyl Orchestrator';
      case AppPageTab.library:
        return 'Library';
      case AppPageTab.debug:
        return 'Debug';
      case AppPageTab.profile:
        return 'Profile';
    }
  }
}
