import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_theme.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  late final TextEditingController _homeAssistantUrlController;
  late final TextEditingController _homeAssistantTokenController;
  late final TextEditingController _homeAssistantApiPathController;
  late final TextEditingController _playerEntityIdController;
  late final TextEditingController _mqttHostController;
  late final TextEditingController _mqttPortController;

  bool _isSavingSettings = false;
  bool _obscureToken = true;

  @override
  void initState() {
    super.initState();
    final settings = musicAssistant.settings;

    _homeAssistantUrlController = TextEditingController(text: settings.url);
    _homeAssistantTokenController = TextEditingController(text: settings.token);
    _homeAssistantApiPathController = TextEditingController(
      text: settings.apiPath,
    );
    _playerEntityIdController = TextEditingController(
      text: settings.playerEntityId,
    );

    _mqttHostController = TextEditingController(text: settings.mqttHost);
    _mqttPortController = TextEditingController(
      text: settings.mqttPort.toString(),
    );
  }

  @override
  void dispose() {
    _homeAssistantUrlController.dispose();
    _homeAssistantTokenController.dispose();
    _homeAssistantApiPathController.dispose();
    _playerEntityIdController.dispose();
    _mqttHostController.dispose();
    _mqttPortController.dispose();
    super.dispose();
  }

  Future<void> _completeSetup() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSavingSettings = true);

    await musicAssistant.settings.save(
      newUrl: _homeAssistantUrlController.text.trim(),
      newToken: _homeAssistantTokenController.text.trim(),
      newApiPath: _homeAssistantApiPathController.text.trim(),
      newEntityId: _playerEntityIdController.text.trim(),
      newMqttHost: _mqttHostController.text.trim(),
      newMqttPort: int.tryParse(_mqttPortController.text.trim()) ?? 9001,
    );

    final currentHost = _mqttHostController.text.trim();
    final parsedPort = int.tryParse(_mqttPortController.text.trim()) ?? 9001;

    final didConnect = await mqttService.connect(currentHost, parsedPort);

    if (didConnect) {
      debugPrint(
        'WelcomeScreen: Core MQTT link online. Starting coordinator...',
      );
      appCoordinator.start();
    } else {
      debugPrint(
        'WelcomeScreen: Warning - MQTT failed to connect on first boot.',
      );
    }

    if (!mounted) return;

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
              key: _formKey,
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
                    'Let\'s get your physical and digital shelves talking. Configure your Home Assistant and MQTT connections below to begin.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyLarge?.copyWith(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.sectionGap * 1.5),

                  const Text(
                    'Home Assistant Integration',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: AppSpacing.fieldGap),
                  TextFormField(
                    controller: _homeAssistantUrlController,
                    decoration: const InputDecoration(
                      labelText: 'Home Assistant URL',
                      hintText: 'https://homeassistant.local:8123',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.language),
                    ),
                    validator: (value) =>
                        (value ?? '').trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: AppSpacing.fieldGap),
                  TextFormField(
                    controller: _homeAssistantTokenController,
                    obscureText: _obscureToken,
                    decoration: InputDecoration(
                      labelText: 'Long-Lived Access Token',
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.key),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureToken
                              ? Icons.visibility
                              : Icons.visibility_off,
                        ),
                        onPressed: () =>
                            setState(() => _obscureToken = !_obscureToken),
                      ),
                    ),
                    validator: (value) =>
                        (value ?? '').trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: AppSpacing.fieldGap),
                  TextFormField(
                    controller: _playerEntityIdController,
                    decoration: const InputDecoration(
                      labelText: 'Music Assistant Player Entity ID',
                      hintText: 'media_player.living_room',
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
                    validator: (value) =>
                        (value ?? '').trim().isEmpty ? 'Required' : null,
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
                    onPressed: _isSavingSettings ? null : _completeSetup,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                    ),
                    child: _isSavingSettings
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
