import 'dart:async';
import 'package:flutter/material.dart';
import 'package:web_app/main.dart';
import 'package:web_app/services/music_assistant_service.dart';
import 'package:web_app/theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final GlobalKey<FormState> _formValidationKey = GlobalKey<FormState>();

  late final TextEditingController _musicAssistantUrlController;
  late final TextEditingController _musicAssistantTokenController;
  late final TextEditingController _musicAssistantPlayerIdController;
  late final TextEditingController _mqttHostController;
  late final TextEditingController _mqttPortController;

  bool _isLoadingSettingsState = true;
  bool _isSavingSettingsState = false;
  bool _isTestingConnectionState = false;
  bool _obscureTokenFieldState = true;
  Timer? _autoSaveDebounceTimer;

  @override
  void initState() {
    super.initState();
    _initializeTextControllers();
    _loadConfigurationSettings();
  }

  @override
  void dispose() {
    _autoSaveDebounceTimer?.cancel();
    _musicAssistantUrlController.dispose();
    _musicAssistantTokenController.dispose();
    _musicAssistantPlayerIdController.dispose();
    _mqttHostController.dispose();
    _mqttPortController.dispose();
    super.dispose();
  }

  void _initializeTextControllers() {
    _musicAssistantUrlController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);
    _musicAssistantTokenController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);
    _musicAssistantPlayerIdController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);
    _mqttHostController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);
    _mqttPortController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);
  }

  void _loadConfigurationSettings() {
    final applicationSettings = musicAssistant.applicationSettings;

    _musicAssistantUrlController.text =
        applicationSettings.musicAssistantUrlString;
    _musicAssistantTokenController.text =
        applicationSettings.musicAssistantTokenString;
    _musicAssistantPlayerIdController.text =
        applicationSettings.musicAssistantPlayerIdString;
    _mqttHostController.text = applicationSettings.mqttHostAddressString;
    _mqttPortController.text = applicationSettings.mqttWebSocketPortNumber
        .toString();

    setState(() {
      _isLoadingSettingsState = false;
    });
  }

  void _scheduleAutomaticSave() {
    if (_isLoadingSettingsState) {
      return;
    }

    _autoSaveDebounceTimer?.cancel();
    _autoSaveDebounceTimer = Timer(
      const Duration(milliseconds: 600),
      _executeSilentSaveProcedure,
    );
  }

  Future<void> _commitSettingsToBackendService() async {
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
  }

  Future<void> _executeSilentSaveProcedure() async {
    try {
      await _commitSettingsToBackendService();
    } catch (saveException) {
      return;
    }
  }

  Future<void> _executeManualSaveProcedure() async {
    if (!_formValidationKey.currentState!.validate()) return;

    setState(() => _isSavingSettingsState = true);
    await _commitSettingsToBackendService();

    systemDataSource.disconnect();
    systemDataSource.connect();

    if (!mounted) return;

    setState(() => _isSavingSettingsState = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Settings saved & System Link updated.')),
    );
  }

  Future<void> _executeConnectionTestProcedure() async {
    final String urlTextString = _musicAssistantUrlController.text.trim();
    final String tokenTextString = _musicAssistantTokenController.text.trim();

    if (urlTextString.isEmpty || tokenTextString.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Music Assistant URL and token are required to test.'),
        ),
      );
      return;
    }

    setState(() => _isTestingConnectionState = true);

    await _commitSettingsToBackendService();
    final ConnectionTestResult connectionResultObject = await musicAssistant
        .testConnectionDetailed();

    if (!mounted) {
      return;
    }

    setState(() => _isTestingConnectionState = false);
    _displayConnectionResultDialog(connectionResultObject);
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
    if (_isLoadingSettingsState) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.pagePadding),
      child: Form(
        key: _formValidationKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildScreenHeaderConfiguration(context),
            const SizedBox(height: AppSpacing.sectionGap),
            _buildConfigurationFormFields(),
            const SizedBox(height: AppSpacing.sectionGap),
            _buildActionButtonsConfiguration(),
          ],
        ),
      ),
    );
  }

  Widget _buildScreenHeaderConfiguration(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Music Assistant Settings',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: AppSpacing.inlineElementGap),
        Text(
          'Configure Music Assistant credentials used for metadata auto-fill and playback.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }

  Widget _buildConfigurationFormFields() {
    return Column(
      children: [
        TextFormField(
          controller: _musicAssistantUrlController,
          decoration: const InputDecoration(
            labelText: 'Music Assistant URL',
            hintText: 'http://192.168.1.100:8095',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.language),
          ),
          validator: (valueString) => (valueString ?? '').trim().isEmpty
              ? 'Enter your Music Assistant URL.'
              : null,
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
                () => _obscureTokenFieldState = !_obscureTokenFieldState,
              ),
            ),
          ),
          validator: (valueString) => (valueString ?? '').trim().isEmpty
              ? 'Enter your Music Assistant token.'
              : null,
        ),
        const SizedBox(height: AppSpacing.fieldGap),
        TextFormField(
          controller: _musicAssistantPlayerIdController,
          decoration: const InputDecoration(
            labelText: 'Target Player Entity ID (Required)',
            hintText: 'media_player.living_room_speaker',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.speaker),
            helperText:
                'The explicit ID Music Assistant will command for physical vinyl playback.',
          ),
        ),
        const SizedBox(height: AppSpacing.sectionGap),
        TextFormField(
          controller: _mqttHostController,
          decoration: const InputDecoration(
            labelText: 'MQTT Broker IP',
            hintText: '192.168.1.100',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.router),
          ),
        ),
        const SizedBox(height: AppSpacing.fieldGap),
        TextFormField(
          controller: _mqttPortController,
          decoration: const InputDecoration(
            labelText: 'MQTT WebSocket Port',
            hintText: '9001',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.settings_ethernet),
          ),
          keyboardType: TextInputType.number,
        ),
      ],
    );
  }

  Widget _buildActionButtonsConfiguration() {
    return Row(
      children: [
        ElevatedButton.icon(
          onPressed: _isSavingSettingsState
              ? null
              : _executeManualSaveProcedure,
          icon: _isSavingSettingsState
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.save),
          label: Text(_isSavingSettingsState ? 'Saving...' : 'Save'),
        ),
        const SizedBox(width: AppSpacing.fieldGap),
        OutlinedButton.icon(
          onPressed: _isTestingConnectionState
              ? null
              : _executeConnectionTestProcedure,
          icon: _isTestingConnectionState
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.wifi_tethering),
          label: Text(
            _isTestingConnectionState ? 'Testing...' : 'Test Connection',
          ),
        ),
      ],
    );
  }
}
