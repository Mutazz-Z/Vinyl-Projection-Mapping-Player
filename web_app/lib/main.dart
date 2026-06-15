import 'package:flutter/material.dart';
import 'package:web_app/screens/debug_screen.dart';
import 'package:web_app/screens/settings_screen.dart';
import 'package:web_app/services/orchestrator_api_client.dart';
import 'screens/library_screen.dart';
import 'screens/register_screen.dart';
import 'services/app_coordinator.dart';
import 'services/music_assistant/music_assistant_service.dart';
import 'services/system_data_source.dart';
import 'theme/app_theme.dart';
import 'widgets/app_navigation_rail.dart';
import 'screens/welcome_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
final OrchestratorApiClient orchestratorApiClient = OrchestratorApiClient();
final MusicAssistantService musicAssistant = MusicAssistantService();

late final SystemDataSource systemDataSource;
late final AppCoordinator appCoordinator;

String get globalOrchestratorHostAddress {
  final String host = Uri.base.host;
  return (host.isNotEmpty && host != 'localhost') ? host : '127.0.0.1';
}

bool _isAppInitialized = false;

Future<void> initializeAppEnvironment() async {
  if (_isAppInitialized) return;

  systemDataSource = SystemDataSource(
    host: globalOrchestratorHostAddress,
    port: 8099,
  );
  systemDataSource.connect();

  await musicAssistant.initializeService();

  appCoordinator = AppCoordinator(
    dataSource: systemDataSource,
    navigatorKey: navigatorKey,
  );

  if (musicAssistant.isSystemConfigured) {
    debugPrint(
      'main: SystemDataSource online. Handing off processing stream...',
    );
    appCoordinator.start();
  }

  _isAppInitialized = true;
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const VinylApp());
}

class VinylApp extends StatefulWidget {
  const VinylApp({super.key});

  @override
  State<VinylApp> createState() => _VinylAppState();
}

class _VinylAppState extends State<VinylApp> {
  late Future<void> _initFuture;

  @override
  void initState() {
    super.initState();
    _initFuture = initializeAppEnvironment();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Vinyl Orchestrator',
      theme: AppTheme.darkTheme,
      home: FutureBuilder(
        future: _initFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              backgroundColor: AppColors.balticBlue,
              body: Center(
                child: CircularProgressIndicator(color: AppColors.porcelain),
              ),
            );
          }

          final String? scannedUid = Uri.base.queryParameters['uid'];
          final bool hasScannedUid =
              scannedUid != null && scannedUid.isNotEmpty;

          if (hasScannedUid) {
            return RegisterScreen(uid: scannedUid);
          }

          if (!musicAssistant.isSystemConfigured) {
            return const WelcomeScreen();
          } else {
            return const AppShellScreen();
          }
        },
      ),
    );
  }
}

class AppShellScreen extends StatefulWidget {
  const AppShellScreen({super.key});

  @override
  State<AppShellScreen> createState() => _AppShellScreenState();
}

class _AppShellScreenState extends State<AppShellScreen> {
  AppPageTab _selectedTab = AppPageTab.library;

  @override
  void initState() {
    super.initState();
    debugPrint('AppShellScreen: Playback monitoring subsystem bound.');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
      case AppPageTab.library:
        return const LibraryScreen();
      case AppPageTab.settings:
        return const SettingsScreen();
      case AppPageTab.debug:
        return const DebugScreen();
    }
  }
}
