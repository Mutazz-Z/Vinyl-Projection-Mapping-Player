import 'package:flutter/material.dart';
import 'package:web_app/factories/state.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:web_app/utils/generate_yaml.dart';
import 'package:web_app/widgets/new_widgets/album_marquee.dart';
import 'package:web_app/widgets/new_widgets/animated_waveform.dart';
import 'package:web_app/widgets/new_widgets/pill_button.dart';
import 'package:web_app/widgets/new_widgets/text_button.dart';
import 'package:web_app/widgets/new_widgets/text_field.dart';
import 'package:url_launcher/url_launcher.dart';
import '../main.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final PageController _pageController = PageController();
  int _currentPageIndex = 0;

  late final TextEditingController _musicAssistantUrlController;
  late final TextEditingController _musicAssistantTokenController;

  late final TextEditingController _mediaPlayerController;
  List<AvailableMediaPlayers_t> _availablePlayers = [];
  String? _selectedPlayerId;
  List<String> _albumCovers = [];

  bool _isTestingConnectionState = false;
  bool _isFetchingAlbumsState = false;
  bool _isSavingFinalState = false;
  bool _isVerifyingReaderState = false;

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

    _pageController.addListener(() {
      final index = _pageController.page?.round() ?? 0;
      if (index != _currentPageIndex) {
        setState(() => _currentPageIndex = index);
      }
    });
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
      final players = await orchestratorApiClient.getAvailablePlayers();

      setState(() {
        _isTestingConnectionState = false;
        _availablePlayers = players;

        if (_availablePlayers.length == 1) {
          _selectedPlayerId = _availablePlayers.first.playerID;
          _mediaPlayerController.text = _selectedPlayerId!;
        } else if (_availablePlayers.any(
          (p) => p.playerID == _mediaPlayerController.text,
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

  Future<void> _verifyReaderConnection() async {
    setState(() => _isVerifyingReaderState = true);

    final bool isOnline = await musicAssistant.verifyReaderConnection();

    if (!mounted) return;
    setState(() => _isVerifyingReaderState = false);

    if (isOnline) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _showErrorDialog(
        'Could not reach the reader. Ensure it is powered on, flashed with the correct YAML, and connected to your Wi-Fi.',
      );
    }
  }

  Future<void> _handlePlayerSelection() async {
    if (_selectedPlayerId == null || _selectedPlayerId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a media player.')),
      );
      return;
    }

    setState(() => _isFetchingAlbumsState = true);

    final albumsInMusicAssistantLibrary = await orchestratorApiClient
        .getAllAlbumsFromMusicAssistantLibrary();
    final covers = albumsInMusicAssistantLibrary
        .map((album) => album.coverImage)
        .toList();
    covers.shuffle();

    if (!mounted) return;

    setState(() {
      _albumCovers = covers.take(20).toList();
      _isFetchingAlbumsState = false;
    });

    _pageController.nextPage(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
    );
  }

  Future<void> _executeFinalSetupProcedure() async {
    setState(() => _isSavingFinalState = true);

    await musicAssistant.applicationSettings.save(
      targetMusicAssistantUrl: _musicAssistantUrlController.text.trim(),
      targetMusicAssistantToken: _musicAssistantTokenController.text.trim(),
      targetMusicAssistantPlayerId: _mediaPlayerController.text.trim(),
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

  Future<void> _handleYamlGeneration() async {
    final String hostIp = await musicAssistant.fetchHostIp();
    generateAndDownloadEspReaderYaml(hostIp);
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
              Positioned.fill(child: Container(color: AppColors.balticBlue)),

              Positioned.fill(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    AnimatedOpacity(
                      opacity: _currentPageIndex < 2 ? 1.0 : 0.0,
                      duration: const Duration(milliseconds: 600),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: SizedBox(
                          width: seamX,
                          child: const AnimatedWaveform(),
                        ),
                      ),
                    ),
                    AnimatedOpacity(
                      opacity: _currentPageIndex >= 2 ? 1.0 : 0.0,
                      duration: const Duration(milliseconds: 600),
                      child: InfiniteAlbumMarquee(imageUrls: _albumCovers),
                    ),
                  ],
                ),
              ),

              Positioned(
                left: seamX,
                top: 0,
                bottom: 0,
                right: 0,
                child: Container(color: AppColors.shadowGrey),
              ),

              Positioned(
                left: seamX - (cardWidth / 2),
                top: 0,
                bottom: 0,
                width: cardWidth,
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 520),
                    child: PageView(
                      controller: _pageController,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        _buildStep1Card(),
                        _buildStep2Card(),
                        _buildStep3Card(),
                        _buildStep4Card(),
                        _buildStep5Card(),
                      ],
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
              color: AppColors.shadowGrey,
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
              color: AppColors.shadowGrey,
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
                      final isSelected = _selectedPlayerId == player.playerID;
                      return PlayerSelectionTile(
                        playerName: player.displayName,
                        isSelected: isSelected,
                        onTap: () {
                          setState(() {
                            _selectedPlayerId = player.playerID;
                            _mediaPlayerController.text = player.playerID;
                          });
                        },
                      );
                    },
                  ),
          ),
          const SizedBox(height: 32),
          _isFetchingAlbumsState
              ? const Center(child: CircularProgressIndicator())
              : PillButton(
                  text: 'Next →',
                  backgroundColor: AppColors.balticBlue,
                  onPressed: _handlePlayerSelection,
                ),
        ],
      ),
    );
  }

  Widget _buildStep3Card() {
    return WizardCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios,
                  size: 20,
                  color: AppColors.subtleText,
                ),
                onPressed: () {
                  _pageController.previousPage(
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.easeInOutCubic,
                  );
                },
              ),
              const Expanded(
                child: Text(
                  'Reader Set up',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.shadowGrey,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'This project takes advantage of the home assistant tag reader by Adonno. '
            'Follow their steps on wiring. For our purposes, we can ignore the buzzer and neopixel.',
            style: TextStyle(
              color: AppColors.shadowGrey,
              fontSize: 15,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 32),
          PillButton(
            text: "Adonno's Tag Reader",
            backgroundColor: AppColors.shadowGrey,
            leading: const Icon(Icons.code, color: AppColors.porcelain),
            onPressed: () {
              launchUrl(Uri.parse('https://github.com/adonno/tagreader'));
            },
          ),
          const SizedBox(height: 16),
          _isSavingFinalState
              ? const Center(child: CircularProgressIndicator())
              : PillButton(
                  text: 'Next →',
                  backgroundColor: AppColors.balticBlue,
                  onPressed: () {
                    _pageController.nextPage(
                      duration: const Duration(milliseconds: 400),
                      curve: Curves.easeInOutCubic,
                    );
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildStep4Card() {
    return WizardCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios,
                  size: 20,
                  color: AppColors.subtleText,
                ),
                onPressed: () {
                  _pageController.previousPage(
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.easeInOutCubic,
                  );
                },
              ),
              const Expanded(
                child: Text(
                  'Reader Set up',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.shadowGrey,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Once wired up correctly, generate your yaml to take to either the web version of esp home below or your own if you host it and flash your ESP device.',
            style: TextStyle(
              color: AppColors.shadowGrey,
              fontSize: 15,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 32),

          PillButton(
            text: "Generate my YAML",
            backgroundColor: AppColors.brightGold,
            textColor: Colors.black,
            onPressed: _handleYamlGeneration,
          ),
          const SizedBox(height: 16),

          PillButton(
            text: 'ESPHOME',
            backgroundColor: const Color(0xFF5AB6DF),
            leading: const Icon(Icons.home_filled, color: Colors.white70),
            onPressed: () {
              launchUrl(Uri.parse('https://web.esphome.io/'));
            },
          ),
          const SizedBox(height: 16),

          _isVerifyingReaderState
              ? const Center(child: CircularProgressIndicator())
              : PillButton(
                  text: 'Verify Connection',
                  backgroundColor: AppColors.green,
                  onPressed: _verifyReaderConnection,
                ),
        ],
      ),
    );
  }

  Widget _buildStep5Card() {
    return WizardCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios,
                  size: 20,
                  color: AppColors.subtleText,
                ),
                onPressed: () {
                  _pageController.previousPage(
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.easeInOutCubic,
                  );
                },
              ),
              const Expanded(
                child: Text(
                  'Projector set up',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.shadowGrey,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Once your reader is configured and inside of your shelf, you can move on to setting up your projector mapping.',
            style: TextStyle(
              color: AppColors.shadowGrey,
              fontSize: 15,
              height: 1.4,
            ),
          ),

          const SizedBox(height: 32),

          PillButton(
            text: 'Map Projector',
            backgroundColor: AppColors.green,
            onPressed: _executeFinalSetupProcedure,
          ),

          const SizedBox(height: 16),

          _isSavingFinalState
              ? const Center(child: CircularProgressIndicator())
              : PillButton(
                  text: 'Skip for now',
                  backgroundColor: AppColors.flagRed,
                  onPressed: _executeFinalSetupProcedure,
                ),
        ],
      ),
    );
  }

  Widget _buildEmptyPlayerState() {
    return Container(
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: AppColors.shadowGrey,
        borderRadius: BorderRadius.circular(16.0),
        border: Border.all(color: AppColors.subtleText),
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
              color: AppColors.shadowGrey,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Set up a new media player source through Music Assistant and try again.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.shadowGrey),
          ),
        ],
      ),
    );
  }
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
          color: isSelected
              ? activeColor.withValues(alpha: 0.08)
              : AppColors.porcelain,
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
                  color: isSelected ? activeColor : AppColors.shadowGrey,
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
