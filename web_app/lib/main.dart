import 'package:flutter/material.dart';
import 'screens/debug_screen.dart';
import 'screens/home_screen.dart';
import 'screens/library_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/register_screen.dart';
import 'services/app_coordinator.dart';
import 'services/music_assistant_service.dart';
import 'services/mqtt_service.dart';
import 'services/playback_monitoring_service.dart';
import 'theme/app_theme.dart';
import 'widgets/app_navigation_rail.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
final MqttService mqttService = MqttService();
final MusicAssistantService musicAssistant = MusicAssistantService();

final AppCoordinator appCoordinator = AppCoordinator(
  mqttService: mqttService,
  musicAssistant: musicAssistant,
  navigatorKey: navigatorKey,
);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await musicAssistant.init();

  _initializeBackgroundNetworkStack();

  runApp(const VinylApp());
}

void _initializeBackgroundNetworkStack() async {
  try {
    final bool didConnect = await mqttService.connect();
    if (didConnect) {
      debugPrint(
        'main: Core MQTT link online. Handing off processing stream...',
      );
      appCoordinator.start();
    }
  } catch (error) {
    debugPrint('main: Handshaking sequence failed unexpectedly: $error');
  }
}

class VinylApp extends StatelessWidget {
  const VinylApp({super.key});

  @override
  Widget build(BuildContext context) {
    final String? scannedUid = Uri.base.queryParameters['uid'];
    final bool hasScannedUid = scannedUid != null && scannedUid.isNotEmpty;

    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Vinyl Orchestrator',
      theme: AppTheme.darkTheme,
      home: hasScannedUid
          ? RegisterScreen(uid: scannedUid)
          : const AppShellScreen(),
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
  late final PlaybackMonitoringService _playbackMonitoring;

  @override
  void initState() {
    super.initState();
    _playbackMonitoring = PlaybackMonitoringService(mqttService: mqttService);
    _playbackMonitoring.startMonitoring();
    debugPrint('AppShellScreen: Playback monitoring subsystem bound.');
  }

  @override
  void dispose() {
    _playbackMonitoring.stopMonitoring();
    super.dispose();
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
        return const HomeScreen();
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
