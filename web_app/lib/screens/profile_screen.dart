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
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  late final TextEditingController _homeAssistantUrlController;
  late final TextEditingController _homeAssistantTokenController;
  late final TextEditingController _homeAssistantApiPathController;
  late final TextEditingController _playerEntityIdController;

  bool _isLoadingSettings = true;
  bool _isSavingSettings = false;
  bool _isTestingConnection = false;
  bool _obscureToken = true;
  Timer? _autoSaveDebounceTimer;

  @override
  void initState() {
    super.initState();
    _initializeControllers();
    _loadSettings();
  }

  @override
  void dispose() {
    _autoSaveDebounceTimer?.cancel();
    _homeAssistantUrlController.dispose();
    _homeAssistantTokenController.dispose();
    _homeAssistantApiPathController.dispose();
    _playerEntityIdController.dispose();
    super.dispose();
  }

  void _initializeControllers() {
    _homeAssistantUrlController = TextEditingController()
      ..addListener(_scheduleAutoSave);
    _homeAssistantTokenController = TextEditingController()
      ..addListener(_scheduleAutoSave);
    _homeAssistantApiPathController = TextEditingController()
      ..addListener(_scheduleAutoSave);
    _playerEntityIdController = TextEditingController()
      ..addListener(_scheduleAutoSave);
  }

  void _loadSettings() {
    final settings = musicAssistant.settings;

    _homeAssistantUrlController.text = settings.url;
    _homeAssistantTokenController.text = settings.token;
    _homeAssistantApiPathController.text = settings.apiPath;
    _playerEntityIdController.text = settings.playerEntityId;

    setState(() {
      _isLoadingSettings = false;
    });
  }

  void _scheduleAutoSave() {
    if (_isLoadingSettings) return;

    _autoSaveDebounceTimer?.cancel();
    _autoSaveDebounceTimer = Timer(
      const Duration(milliseconds: 600),
      _saveSettingsSilently,
    );
  }

  Future<void> _commitSettingsToService() async {
    await musicAssistant.saveSettings(
      homeAssistantUrl: _homeAssistantUrlController.text.trim(),
      homeAssistantToken: _homeAssistantTokenController.text.trim(),
      homeAssistantApiPath: _homeAssistantApiPathController.text.trim(),
      musicAssistantPlayerEntityId: _playerEntityIdController.text.trim(),
    );
  }

  Future<void> _saveSettingsSilently() async {
    try {
      await _commitSettingsToService();
    } catch (_) {
      // Silent by design during background auto-saving
    }
  }

  Future<void> _saveSettings() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSavingSettings = true);
    await _commitSettingsToService();

    if (!mounted) return;
    setState(() => _isSavingSettings = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Music Assistant settings saved.')),
    );
  }

  Future<void> _testConnection() async {
    final String urlText = _homeAssistantUrlController.text.trim();
    final String tokenText = _homeAssistantTokenController.text.trim();

    if (urlText.isEmpty || tokenText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Home Assistant URL and token are required to test.'),
        ),
      );
      return;
    }

    setState(() => _isTestingConnection = true);

    await _commitSettingsToService();
    final ConnectionTestResult connectionResult = await musicAssistant
        .testConnectionDetailed();

    if (!mounted) return;
    setState(() => _isTestingConnection = false);

    _showConnectionResultDialog(connectionResult);
  }

  void _showConnectionResultDialog(ConnectionTestResult result) {
    showDialog<void>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        icon: Icon(
          result.success ? Icons.check_circle : Icons.error,
          color: result.success ? Colors.green : Colors.red,
          size: 36,
        ),
        title: Text(
          result.success ? 'Connected Successfully' : 'Connection Failed',
        ),
        content: SelectableText(result.message),
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
    if (_isLoadingSettings) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.pagePadding),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(context),
            const SizedBox(height: AppSpacing.sectionGap),
            _buildFormFields(),
            const SizedBox(height: AppSpacing.sectionGap),
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Music Assistant Settings',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: AppSpacing.inlineElementGap),
        Text(
          'Configure Home Assistant credentials used for metadata auto-fill.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }

  Widget _buildFormFields() {
    return Column(
      children: [
        TextFormField(
          controller: _homeAssistantUrlController,
          decoration: const InputDecoration(
            labelText: 'Home Assistant URL',
            hintText: 'https://homeassistant.local:8123',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.language),
          ),
          validator: (value) => (value ?? '').trim().isEmpty
              ? 'Enter your Home Assistant URL.'
              : null,
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
                _obscureToken ? Icons.visibility : Icons.visibility_off,
              ),
              onPressed: () => setState(() => _obscureToken = !_obscureToken),
            ),
          ),
          validator: (value) => (value ?? '').trim().isEmpty
              ? 'Enter your Home Assistant token.'
              : null,
        ),
        const SizedBox(height: AppSpacing.fieldGap),
        TextFormField(
          controller: _homeAssistantApiPathController,
          decoration: const InputDecoration(
            labelText: 'API Path Prefix (Optional)',
            hintText: 'homeassistant/',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.route),
            helperText:
                'Leave empty if HA is at domain root. Use a path if proxied under subpath.',
          ),
        ),
        const SizedBox(height: AppSpacing.fieldGap),
        TextFormField(
          controller: _playerEntityIdController,
          decoration: const InputDecoration(
            labelText:
                'Music Assistant Player Entity ID (Required for Playback)',
            hintText: 'media_player.living_room',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.speaker),
            helperText:
                'Required for play/stop control. Also used as fallback metadata source from player state.',
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        ElevatedButton.icon(
          onPressed: _isSavingSettings ? null : _saveSettings,
          icon: _isSavingSettings
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.save),
          label: Text(_isSavingSettings ? 'Saving...' : 'Save'),
        ),
        const SizedBox(width: AppSpacing.fieldGap),
        OutlinedButton.icon(
          onPressed: _isTestingConnection ? null : _testConnection,
          icon: _isTestingConnection
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.wifi_tethering),
          label: Text(_isTestingConnection ? 'Testing...' : 'Test Connection'),
        ),
      ],
    );
  }
}
