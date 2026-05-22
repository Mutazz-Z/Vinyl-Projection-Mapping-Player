import 'package:flutter/material.dart';
import 'package:web_app/models/music_assistant_models.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:web_app/widgets/new_widgets/animated_waveform.dart';
import 'package:web_app/widgets/new_widgets/pill_button.dart';
import 'package:web_app/widgets/new_widgets/player_selection_tile.dart';
import 'package:web_app/widgets/new_widgets/text_button.dart';
import 'package:web_app/widgets/new_widgets/text_field.dart';
import '../main.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final PageController _pageController = PageController();
  late final TextEditingController _musicAssistantUrlController;
  late final TextEditingController _musicAssistantTokenController;
  late final TextEditingController _mediaPlayerController;
  bool _isTestingConnectionState = false;
  bool _isSavingFinalState = false;
  List<MediaPlayerInfo> _availablePlayers = [];
  String? _selectedPlayerId;

  @override
  void initState() {
    super.initState();
    final applicationSettings = musicAssistant.applicationSettings;

    _musicAssistantUrlController = TextEditingController(
      text: applicationSettings.musicAssistantUrlString,
    );
    _musicAssistantTokenController = TextEditingController(
      text: applicationSettings.musicAssistantTokenString,
    );
    _mediaPlayerController = TextEditingController(
      text: applicationSettings.musicAssistantPlayerIdString,
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _musicAssistantUrlController.dispose();
    _musicAssistantTokenController.dispose();
    _mediaPlayerController.dispose();
    super.dispose();
  }

  Future<void> _handleConnectionTest() async {
    final url = _musicAssistantUrlController.text.trim();
    final token = _musicAssistantTokenController.text.trim();

    if (url.isEmpty || token.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields.')),
      );
      return;
    }

    setState(() => _isTestingConnectionState = true);

    await musicAssistant.applicationSettings.save(
      targetMusicAssistantUrl: url,
      targetMusicAssistantToken: token,
      targetMusicAssistantPlayerId: _mediaPlayerController.text.trim(),
      targetMqttHostAddress: '',
      targetMqttWebSocketPort: 9001,
    );

    final connectionResult = await musicAssistant.testConnectionDetailed();

    if (!mounted) return;

    if (connectionResult.success) {
      final players = await musicAssistant.fetchAvailablePlayers();

      setState(() {
        _isTestingConnectionState = false;
        _availablePlayers = players;

        if (_availablePlayers.length == 1) {
          _selectedPlayerId = _availablePlayers.first.playerId;
        } else if (_availablePlayers.any(
          (p) => p.playerId == _mediaPlayerController.text,
        )) {
          _selectedPlayerId = _mediaPlayerController.text;
        } else {
          _selectedPlayerId = null;
        }
      });

      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    } else {
      setState(() => _isTestingConnectionState = false);
      _showErrorDialog(connectionResult.message);
    }
  }

  Future<void> _executeFinalSetupProcedure() async {
    final mediaPlayer = _mediaPlayerController.text.trim();

    if (mediaPlayer.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a media player.')),
      );
      return;
    }

    setState(() => _isSavingFinalState = true);

    await musicAssistant.applicationSettings.save(
      targetMusicAssistantUrl: _musicAssistantUrlController.text.trim(),
      targetMusicAssistantToken: _musicAssistantTokenController.text.trim(),
      targetMusicAssistantPlayerId: mediaPlayer,
      targetMqttHostAddress: '',
      targetMqttWebSocketPort: 9001,
    );

    systemDataSource.connect();
    appCoordinator.start();

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const AppShellScreen()),
    );
  }

  void _showErrorDialog(String message) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.error, color: AppColors.flagRed, size: 36),
        title: const Text('Connection Failed'),
        content: SelectableText(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final seamX = constraints.maxWidth * (2 / 3);
          final cardWidth = constraints.maxWidth > 500
              ? 450.0
              : constraints.maxWidth * 0.9;

          return Stack(
            children: [
              // 1. Solid Background Colors
              Positioned.fill(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      flex: 2,
                      child: Container(color: AppColors.shadowGrey),
                    ),
                    Expanded(
                      flex: 1,
                      child: Container(color: AppColors.balticBlue),
                    ),
                  ],
                ),
              ),

              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                width: seamX,
                child: const AnimatedWaveform(),
              ),

              Positioned(
                left: seamX - (cardWidth / 2),
                top: 0,
                bottom: 0,
                width: cardWidth,
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 500),
                    child: PageView(
                      controller: _pageController,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [_buildStep1Card(), _buildStep2Card()],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStep1Card() {
    return WizardCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Tune in!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.balticBlue,
            ),
          ),

          const SizedBox(height: 32),

          PillTextField(
            controller: _musicAssistantUrlController,
            hintText: 'music assistant instance',
            prefixIcon: Icons.language,
            isHidden: false,
          ),

          const SizedBox(height: 16),

          PillTextField(
            controller: _musicAssistantTokenController,
            hintText: 'access token',
            prefixIcon: Icons.vpn_key_outlined,
            isHidden: true,
          ),

          const SizedBox(height: 8),

          Align(
            alignment: Alignment.centerLeft,
            child: Padding(
              padding: const EdgeInsets.only(left: 12.0),
              // TODO: Implement the actual help link
              child: TextLink(text: 'How to get this', onPressed: () {}),
            ),
          ),

          const SizedBox(height: 32),

          _isTestingConnectionState
              ? const Center(child: CircularProgressIndicator())
              : PillButton(
                  text: 'Get Connected',
                  backgroundColor: AppColors.green,
                  onPressed: _handleConnectionTest,
                ),
        ],
      ),
    );
  }

  Widget _buildStep2Card() {
    return WizardCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Select your media\nplayer',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.balticBlue,
              height: 1.2,
            ),
          ),

          const SizedBox(height: 32),

          Flexible(
            child: _availablePlayers.isEmpty
                ? _buildEmptyPlayerState()
                : ListView.separated(
                    shrinkWrap: true,
                    padding: EdgeInsets.zero,
                    itemCount: _availablePlayers.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final player = _availablePlayers[index];
                      final isSelected = _selectedPlayerId == player.playerId;

                      return PlayerSelectionTile(
                        playerName: player.displayName,
                        isSelected: isSelected,
                        onTap: () {
                          setState(() {
                            _selectedPlayerId = player.playerId;
                            _mediaPlayerController.text = player.playerId;
                          });
                        },
                      );
                    },
                  ),
          ),

          const SizedBox(height: 32),

          _isSavingFinalState
              ? const Center(child: CircularProgressIndicator())
              : PillButton(
                  text: 'Finish Setup',
                  backgroundColor: AppColors.balticBlue,
                  onPressed: _executeFinalSetupProcedure,
                ),
        ],
      ),
    );
  }
}

Widget _buildEmptyPlayerState() {
  return Container(
    padding: const EdgeInsets.all(24.0),
    decoration: BoxDecoration(
      color: AppColors.porcelain,
      borderRadius: BorderRadius.circular(16.0),
      border: Border.all(color: AppColors.porcelain, width: 2),
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.speaker_notes_off, size: 48, color: AppColors.subtleText),
        const SizedBox(height: 16),
        const Text(
          'No players found.',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppColors.balticBlue,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Set up a new media player source through Music Assistant and try again.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.subtleText),
        ),
      ],
    ),
  );
}

class WizardCard extends StatelessWidget {
  final Widget child;

  const WizardCard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.center,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12.0),
        padding: const EdgeInsets.symmetric(horizontal: 48.0, vertical: 40.0),
        decoration: BoxDecoration(
          color: AppColors.porcelain,
          borderRadius: BorderRadius.circular(24.0),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}
