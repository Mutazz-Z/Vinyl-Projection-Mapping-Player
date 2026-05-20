import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_theme.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final GlobalKey<FormState> _formValidationKey = GlobalKey<FormState>();

  late final TextEditingController _musicAssistantUrlController;
  late final TextEditingController _musicAssistantTokenController;
  late final TextEditingController _musicAssistantPlayerIdController;
  late final TextEditingController _mqttHostController;
  late final TextEditingController _mqttPortController;

  bool _isSavingSettingsState = false;
  bool _obscureTokenFieldState = true;

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
    _musicAssistantPlayerIdController = TextEditingController(
      text: applicationSettings.musicAssistantPlayerIdString,
    );
    _mqttHostController = TextEditingController(
      text: applicationSettings.mqttHostAddressString,
    );
    _mqttPortController = TextEditingController(
      text: applicationSettings.mqttWebSocketPortNumber.toString(),
    );
  }

  @override
  void dispose() {
    _musicAssistantUrlController.dispose();
    _musicAssistantTokenController.dispose();
    _musicAssistantPlayerIdController.dispose();
    _mqttHostController.dispose();
    _mqttPortController.dispose();
    super.dispose();
  }

  Future<void> _executeSetupCompletionProcedure() async {
    if (!_formValidationKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSavingSettingsState = true);

    final int parsedMqttPortNumber =
        int.tryParse(_mqttPortController.text.trim()) ?? 9001;

    await musicAssistant.applicationSettings.save(
      targetMusicAssistantUrl: _musicAssistantUrlController.text.trim(),
      targetMusicAssistantToken: _musicAssistantTokenController.text.trim(),
      targetMusicAssistantPlayerId: _musicAssistantPlayerIdController.text
          .trim(),
      targetMqttHostAddress: _mqttHostController.text.trim(),
      targetMqttWebSocketPort: parsedMqttPortNumber,
    );

    final String currentHostAddressString = _mqttHostController.text.trim();
    final bool didEstablishConnection = await mqttService.connect(
      currentHostAddressString,
      parsedMqttPortNumber,
    );

    if (didEstablishConnection) {
      appCoordinator.start();
    }

    if (!mounted) {
      return;
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const AppShellScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.pagePadding * 2),
            child: Form(
              key: _formValidationKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.album_outlined,
                    size: 80,
                    color: AppColors.autoFillAccent,
                  ),
                  const SizedBox(height: AppSpacing.sectionGap),
                  Text(
                    'Welcome to Vinyl Orchestrator',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.inlineElementGap),
                  Text(
                    'Let\'s get your physical and digital shelves talking. Configure your Music Assistant and MQTT connections below to begin.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyLarge?.copyWith(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.sectionGap * 1.5),

                  const Text(
                    'Music Assistant Integration',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: AppSpacing.fieldGap),
                  TextFormField(
                    controller: _musicAssistantUrlController,
                    decoration: const InputDecoration(
                      labelText: 'Music Assistant URL',
                      hintText: 'http://192.168.1.100:8095',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.language),
                    ),
                    validator: (valueString) =>
                        (valueString ?? '').trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: AppSpacing.fieldGap),
                  TextFormField(
                    controller: _musicAssistantTokenController,
                    obscureText: _obscureTokenFieldState,
                    decoration: InputDecoration(
                      labelText: 'Long-Lived Access Token',
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.key),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureTokenFieldState
                              ? Icons.visibility
                              : Icons.visibility_off,
                        ),
                        onPressed: () => setState(
                          () => _obscureTokenFieldState =
                              !_obscureTokenFieldState,
                        ),
                      ),
                    ),
                    validator: (valueString) =>
                        (valueString ?? '').trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: AppSpacing.fieldGap),
                  TextFormField(
                    controller: _musicAssistantPlayerIdController,
                    decoration: const InputDecoration(
                      labelText: 'Target Player Entity ID',
                      hintText: 'media_player.living_room_speaker',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.speaker),
                    ),
                  ),

                  const SizedBox(height: AppSpacing.sectionGap),

                  const Text(
                    'Core Network Stack',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: AppSpacing.fieldGap),
                  TextFormField(
                    controller: _mqttHostController,
                    decoration: const InputDecoration(
                      labelText: 'MQTT Broker IP',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.router),
                    ),
                    validator: (valueString) =>
                        (valueString ?? '').trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: AppSpacing.fieldGap),
                  TextFormField(
                    controller: _mqttPortController,
                    decoration: const InputDecoration(
                      labelText: 'MQTT WebSocket Port',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.settings_ethernet),
                    ),
                    keyboardType: TextInputType.number,
                  ),

                  const SizedBox(height: AppSpacing.sectionGap * 1.5),

                  FilledButton(
                    onPressed: _isSavingSettingsState
                        ? null
                        : _executeSetupCompletionProcedure,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                    ),
                    child: _isSavingSettingsState
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Connect & Continue',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
