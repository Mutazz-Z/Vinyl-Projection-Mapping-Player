import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:web_app/services/music_assistant/music_assistant_service.dart';
import 'package:web_app/widgets/updated_widgets/welcome_screen/audio_visualizer.dart';
import 'package:web_app/widgets/updated_widgets/link_text_button.dart';
import 'package:web_app/widgets/updated_widgets/pill_button.dart';
import 'package:web_app/widgets/updated_widgets/setup_container.dart';
import 'package:web_app/widgets/updated_widgets/welcome_screen/swipe_painter.dart';
import 'package:web_app/widgets/updated_widgets/text_field_input.dart';
import '../main.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<FormState> _formValidationKey = GlobalKey<FormState>();

  late final TextEditingController _musicAssistantUrlController;
  late final TextEditingController _musicAssistantTokenController;

  late final AnimationController _swipeController;
  late final Animation<double> _backgroundSwipeAnimation;
  late final Animation<double> _foregroundSwipeAnimation;

  bool _isSavingSettingsState = false;

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

    _swipeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    _backgroundSwipeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _swipeController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeInOut),
      ),
    );

    _foregroundSwipeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _swipeController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeInOut),
      ),
    );

    _swipeController.forward();
  }

  @override
  void dispose() {
    _musicAssistantUrlController.dispose();
    _musicAssistantTokenController.dispose();
    _swipeController.dispose();
    super.dispose();
  }

  Future<void> _executeSetupCompletionProcedure() async {
    if (!_formValidationKey.currentState!.validate()) return;

    setState(() => _isSavingSettingsState = true);

    await musicAssistant.applicationSettings.save(
      targetMusicAssistantUrl: _musicAssistantUrlController.text.trim(),
      targetMusicAssistantToken: _musicAssistantTokenController.text.trim(),
      targetMusicAssistantPlayerId: '',
      targetMqttHostAddress: '',
      targetMqttWebSocketPort: 9001,
    );

    final ConnectionTestResult connectionResultObject = await musicAssistant
        .testConnectionDetailed();

    if (!mounted) return;

    if (connectionResultObject.success) {
      systemDataSource.connect();
      appCoordinator.start();

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AppShellScreen()),
      );
    } else {
      setState(() => _isSavingSettingsState = false);
      _displayConnectionResultDialog(connectionResultObject);
    }
  }

  void _displayConnectionResultDialog(
    ConnectionTestResult connectionResultObject,
  ) {
    showDialog<void>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        icon: Icon(
          connectionResultObject.success ? Icons.check_circle : Icons.error,
          color: connectionResultObject.success ? Colors.green : Colors.red,
          size: 36,
        ),
        title: Text(
          connectionResultObject.success
              ? 'Connected Successfully'
              : 'Connection Failed',
        ),
        content: SelectableText(connectionResultObject.message),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Color> swipeColors = [
      AppColors.brandBlue,
      AppColors.accentOrange,
      AppColors.destructiveRed,
      AppColors.accentTeal,
    ];

    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 24, 23, 23),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final height = constraints.maxHeight;
          final width = constraints.maxWidth;
          const double startXPercentage = 0.05;

          const double angleDegrees = 34.0;
          const double angleRadians = angleDegrees * math.pi / 180.0;
          const double apexY = -250.0;

          final startPoint1 = Offset(width * startXPercentage, height + 50);
          final double dy1 = startPoint1.dy - apexY;
          final double dx1 = dy1 * math.tan(angleRadians);
          final endPoint1 = Offset(startPoint1.dx + dx1, apexY);

          final startPoint2 = endPoint1;
          final double endY2 = height + 500.0;
          final double dy2 = endY2 - apexY;
          final double dx2 = dy2 * math.tan(angleRadians);
          final endPoint2 = Offset(startPoint2.dx + dx2, endY2);

          return Stack(
            children: [
              Center(
                child: FakeAudioVisualizer(
                  height: 150.0,
                  color: AppColors.textLight.withValues(alpha: 0.05),
                ),
              ),
              AnimatedColorSwipe(
                animation: _backgroundSwipeAnimation,
                start: startPoint1,
                end: endPoint1,
                opacity: 0.2,
                strokeWidth: 45.0,
                colors: swipeColors,
              ),
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 600),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(32.0),
                    child: Form(
                      key: _formValidationKey,
                      child: VinylContainer(
                        containerColor: AppColors.brandBlue,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'Tune in!',
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textLight,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 40),
                            SystemTextInput(
                              label: 'Music Assistant Instance:',
                              hint: 'homeassistant.local:8123',
                              controller: _musicAssistantUrlController,
                              fillColor: AppColors.accentOrange,
                              prefixIcon: Icons.language,
                              prefixIconColor: AppColors.textLight,
                            ),
                            const SizedBox(height: 24),
                            SystemTextInput(
                              label: 'Long Live Access Token:',
                              controller: _musicAssistantTokenController,
                              fillColor: AppColors.accentOrange,
                              isObscured: true,
                              allowToggle: true,
                              prefixIcon: Icons.key,
                              prefixIconColor: AppColors.textLight,
                            ),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: TextLink(
                                text: 'How to get this',
                                onPressed: () {},
                              ),
                            ),
                            const SizedBox(height: 40),
                            _isSavingSettingsState
                                ? const Center(
                                    child: CircularProgressIndicator(
                                      color: AppColors.textLight,
                                    ),
                                  )
                                : PillButton(
                                    text: 'Get Connected',
                                    backgroundColor: AppColors.accentTeal,
                                    onPressed: _executeSetupCompletionProcedure,
                                  ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              IgnorePointer(
                child: AnimatedColorSwipe(
                  animation: _foregroundSwipeAnimation,
                  start: startPoint2,
                  end: endPoint2,
                  opacity: 1.0,
                  strokeWidth: 45.0,
                  colors: swipeColors.reversed.toList(),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
