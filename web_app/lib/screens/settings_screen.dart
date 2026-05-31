import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_app/main.dart';
import 'package:web_app/widgets/new_widgets/pill_dropdown.dart';
import 'package:web_app/widgets/new_widgets/pill_button.dart';
import 'package:web_app/widgets/new_widgets/text_field.dart';
import 'package:web_app/services/interactive_mapper.dart';
import 'package:web_app/factories/state.dart';
import 'package:web_app/theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final TextEditingController _musicAssistantUrlController;
  late final TextEditingController _musicAssistantTokenController;
  late final TextEditingController _mqttHostController;
  late final TextEditingController _mqttPortController;
  late final TextEditingController _siteUrlController;

  List<AvailableMediaPlayers_t> _availablePlayers = [];
  String? _selectedPlayerId;

  bool _isLoading = true;
  bool _isSavingSettingsState = false;
  bool _isTestingConnectionState = false;
  Timer? _autoSaveDebounceTimer;

  final GlobalKey<InteractiveMapperState> _mapperKey =
      GlobalKey<InteractiveMapperState>();
  String _targetProjectorId = 'all';
  final Map<String, Map<String, double>> _discoveredProjectors = {};

  double _projectorWidth = 1920;
  double _projectorHeight = 1080;
  Timer? _mapperSaveTimer;
  StreamSubscription? _eventSub;

  late final TextEditingController _widthController;
  late final TextEditingController _heightController;

  final TextEditingController _tlX = TextEditingController(text: '0');
  final TextEditingController _tlY = TextEditingController(text: '0');
  final TextEditingController _trX = TextEditingController(text: '1920');
  final TextEditingController _trY = TextEditingController(text: '0');
  final TextEditingController _brX = TextEditingController(text: '1920');
  final TextEditingController _brY = TextEditingController(text: '1080');
  final TextEditingController _blX = TextEditingController(text: '0');
  final TextEditingController _blY = TextEditingController(text: '1080');

  @override
  void initState() {
    super.initState();
    _initializeControllers();
    _loadAllData();

    _eventSub = systemDataSource.onDataSourceChanged.listen((args) {
      if (args.variable == 'GLOBAL_ProjectorHeartbeat' && args.data != null) {
        final data = args.data;
        if (mounted && data['id'] != null) {
          setState(() {
            _discoveredProjectors[data['id']] = {
              'width': (data['width'] as num).toDouble(),
              'height': (data['height'] as num).toDouble(),
            };
          });
        }
      }
    });

    _pingProjectors();
  }

  @override
  void dispose() {
    _autoSaveDebounceTimer?.cancel();
    _mapperSaveTimer?.cancel();
    _eventSub?.cancel();

    _musicAssistantUrlController.dispose();
    _musicAssistantTokenController.dispose();
    _mqttHostController.dispose();
    _mqttPortController.dispose();
    _siteUrlController.dispose();

    _widthController.dispose();
    _heightController.dispose();

    _tlX.dispose();
    _tlY.dispose();
    _trX.dispose();
    _trY.dispose();
    _brX.dispose();
    _brY.dispose();
    _blX.dispose();
    _blY.dispose();
    super.dispose();
  }

  void _initializeControllers() {
    _musicAssistantUrlController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);
    _musicAssistantTokenController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);
    _mqttHostController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);
    _mqttPortController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);
    _siteUrlController = TextEditingController()
      ..addListener(_scheduleAutomaticSave);

    _widthController = TextEditingController()
      ..addListener(_updateResolutionFromInputs);
    _heightController = TextEditingController()
      ..addListener(_updateResolutionFromInputs);
  }

  Future<void> _loadAllData() async {
    final applicationSettings = musicAssistant.applicationSettings;

    _musicAssistantUrlController.text =
        applicationSettings.musicAssistantUrlString;
    _musicAssistantTokenController.text =
        applicationSettings.musicAssistantTokenString;
    _mqttHostController.text = applicationSettings.mqttHostAddressString;
    _mqttPortController.text = applicationSettings.mqttWebSocketPortNumber
        .toString();
    _selectedPlayerId = applicationSettings.musicAssistantPlayerIdString;
    _siteUrlController.text = '';

    final players = await orchestratorApiClient.getAvailablePlayers();

    try {
      final w = await systemDataSource.read(globalTargetDisplayWidthInPixels);
      final h = await systemDataSource.read(
        globalMusicAssistantTargetPlayerId,
      );
      _projectorWidth = double.tryParse(w?.toString() ?? '') ?? 1920;
      _projectorHeight = double.tryParse(h?.toString() ?? '') ?? 1080;

      _widthController.text = _projectorWidth.round().toString();
      _heightController.text = _projectorHeight.round().toString();

      final stored = await systemDataSource.read(
        globalCurrentMaptasticProjectorPositions,
      );
      if (stored != null && stored.toString().isNotEmpty) {
        List<dynamic> layoutData = (stored is String)
            ? jsonDecode(stored)
            : stored;
        if (layoutData.isNotEmpty && layoutData[0]['targetPoints'] != null) {
          final pts = layoutData[0]['targetPoints'];
          setState(() {
            _tlX.text = pts[0][0].toString();
            _tlY.text = pts[0][1].toString();
            _trX.text = pts[1][0].toString();
            _trY.text = pts[1][1].toString();
            _brX.text = pts[2][0].toString();
            _brY.text = pts[2][1].toString();
            _blX.text = pts[3][0].toString();
            _blY.text = pts[3][1].toString();
          });
        }
      }
    } catch (e) {
      debugPrint('Warning: Could not load global mapping state. ($e)');
    }

    if (mounted) {
      setState(() {
        _availablePlayers = players;
        if (_selectedPlayerId != null &&
            _selectedPlayerId!.isNotEmpty &&
            !_availablePlayers.any((p) => p.playerID == _selectedPlayerId)) {
          _selectedPlayerId = null;
        }
        _isLoading = false;
      });
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _onManualCoordinateChanged();
    });
  }

  void _pingProjectors() {
    setState(() {
      _discoveredProjectors.clear();
      _targetProjectorId = 'all';
    });
    systemDataSource.write(globalProjectorHeartbeatSignal, {
      'action': 'ping',
      'ts': DateTime.now().millisecondsSinceEpoch,
    });
  }

  void _toggleProjectorUI() {
    systemDataSource.write(globalProjectorHeartbeatSignal, {
      'action': 'toggle',
      'targetId': _targetProjectorId,
      'ts': DateTime.now().millisecondsSinceEpoch,
    });
  }

  void _scheduleAutomaticSave() {
    if (_isLoading) return;
    _autoSaveDebounceTimer?.cancel();
    _autoSaveDebounceTimer = Timer(
      const Duration(milliseconds: 600),
      _executeSilentSaveProcedure,
    );
  }

  Future<void> _executeSilentSaveProcedure() async {
    final int parsedMqttPortNumber =
        int.tryParse(_mqttPortController.text.trim()) ?? 9001;

    await musicAssistant.applicationSettings.save(
      targetMusicAssistantUrl: _musicAssistantUrlController.text.trim(),
      targetMusicAssistantToken: _musicAssistantTokenController.text.trim(),
      targetMusicAssistantPlayerId: _selectedPlayerId ?? '',
      targetMqttHostAddress: _mqttHostController.text.trim(),
      targetMqttWebSocketPort: parsedMqttPortNumber,
    );
  }

  Future<void> _executeManualSaveProcedure() async {
    setState(() => _isSavingSettingsState = true);
    await _executeSilentSaveProcedure();

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
    await _executeSilentSaveProcedure();

    final connectionResult = await musicAssistant.testConnectionDetailed();

    if (!mounted) return;

    setState(() => _isTestingConnectionState = false);

    showDialog<void>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        icon: Icon(
          connectionResult.success ? Icons.check_circle : Icons.error,
          color: connectionResult.success ? Colors.green : Colors.red,
          size: 36,
        ),
        title: Text(
          connectionResult.success
              ? 'Connected Successfully'
              : 'Connection Failed',
        ),
        content: SelectableText(connectionResult.message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _onTargetChanged(String? newTargetId) {
    if (newTargetId == null) return;
    setState(() {
      _targetProjectorId = newTargetId;
      if (_targetProjectorId != 'all') {
        _projectorWidth = _discoveredProjectors[newTargetId]!['width']!;
        _projectorHeight = _discoveredProjectors[newTargetId]!['height']!;

        _widthController.text = _projectorWidth.round().toString();
        _heightController.text = _projectorHeight.round().toString();
      }
    });
  }

  void _updateResolutionFromInputs() {
    final w = double.tryParse(_widthController.text);
    final h = double.tryParse(_heightController.text);

    if (w != null &&
        h != null &&
        (w != _projectorWidth || h != _projectorHeight)) {
      setState(() {
        _projectorWidth = w;
        _projectorHeight = h;
      });
      _scheduleMapperSave();
    }
  }

  void _onCanvasDragged(List<Offset> corners) {
    _tlX.text = (corners[0].dx * _projectorWidth).round().toString();
    _tlY.text = (corners[0].dy * _projectorHeight).round().toString();
    _trX.text = (corners[1].dx * _projectorWidth).round().toString();
    _trY.text = (corners[1].dy * _projectorHeight).round().toString();
    _brX.text = (corners[2].dx * _projectorWidth).round().toString();
    _brY.text = (corners[2].dy * _projectorHeight).round().toString();
    _blX.text = (corners[3].dx * _projectorWidth).round().toString();
    _blY.text = (corners[3].dy * _projectorHeight).round().toString();

    _scheduleMapperSave();
  }

  List<Offset> _getCurrentCornersAsPercentages() {
    double tlX = double.tryParse(_tlX.text) ?? 0;
    double tlY = double.tryParse(_tlY.text) ?? 0;
    double trX = double.tryParse(_trX.text) ?? _projectorWidth;
    double trY = double.tryParse(_trY.text) ?? 0;
    double brX = double.tryParse(_brX.text) ?? _projectorWidth;
    double brY = double.tryParse(_brY.text) ?? _projectorHeight;
    double blX = double.tryParse(_blX.text) ?? 0;
    double blY = double.tryParse(_blY.text) ?? _projectorHeight;

    return [
      Offset(
        (tlX / _projectorWidth).clamp(0.0, 1.0),
        (tlY / _projectorHeight).clamp(0.0, 1.0),
      ),
      Offset(
        (trX / _projectorWidth).clamp(0.0, 1.0),
        (trY / _projectorHeight).clamp(0.0, 1.0),
      ),
      Offset(
        (brX / _projectorWidth).clamp(0.0, 1.0),
        (brY / _projectorHeight).clamp(0.0, 1.0),
      ),
      Offset(
        (blX / _projectorWidth).clamp(0.0, 1.0),
        (blY / _projectorHeight).clamp(0.0, 1.0),
      ),
    ];
  }

  void _onManualCoordinateChanged() {
    _mapperKey.currentState?.applyCorners(_getCurrentCornersAsPercentages());
    _scheduleMapperSave();
  }

  void _scheduleMapperSave() {
    _mapperSaveTimer?.cancel();
    _mapperSaveTimer = Timer(const Duration(milliseconds: 500), () {
      final layout = [
        {
          "id": "projection-group",
          "sourcePoints": [
            [0, 0],
            [500, 0],
            [500, 500],
            [0, 500],
          ],
          "targetPoints": [
            [int.tryParse(_tlX.text) ?? 0, int.tryParse(_tlY.text) ?? 0],
            [
              int.tryParse(_trX.text) ?? _projectorWidth.round(),
              int.tryParse(_trY.text) ?? 0,
            ],
            [
              int.tryParse(_brX.text) ?? _projectorWidth.round(),
              int.tryParse(_brY.text) ?? _projectorHeight.round(),
            ],
            [
              int.tryParse(_blX.text) ?? 0,
              int.tryParse(_blY.text) ?? _projectorHeight.round(),
            ],
          ],
        },
      ];
      systemDataSource.write(
        globalCurrentMaptasticProjectorPositions,
        jsonEncode(layout),
      );
    });
  }

  void _centerMapping() {
    const double squareSize = 500.0;
    final double startX = (_projectorWidth - squareSize) / 2;
    final double startY = (_projectorHeight - squareSize) / 2;

    final double pStartX = startX / _projectorWidth;
    final double pStartY = startY / _projectorHeight;
    final double pEndX = (startX + squareSize) / _projectorWidth;
    final double pEndY = (startY + squareSize) / _projectorHeight;

    final List<Offset> centeredCorners = [
      Offset(pStartX, pStartY),
      Offset(pEndX, pStartY),
      Offset(pEndX, pEndY),
      Offset(pStartX, pEndY),
    ];

    _mapperKey.currentState?.applyCorners(centeredCorners);
    _onCanvasDragged(centeredCorners);
  }

  Future<void> _savePreset() async {
    final layout = [
      {
        "id": "projection-group",
        "sourcePoints": [
          [0, 0],
          [500, 0],
          [500, 500],
          [0, 500],
        ],
        "targetPoints": [
          [int.tryParse(_tlX.text) ?? 0, int.tryParse(_tlY.text) ?? 0],
          [
            int.tryParse(_trX.text) ?? _projectorWidth.round(),
            int.tryParse(_trY.text) ?? 0,
          ],
          [
            int.tryParse(_brX.text) ?? _projectorWidth.round(),
            int.tryParse(_brY.text) ?? _projectorHeight.round(),
          ],
          [
            int.tryParse(_blX.text) ?? 0,
            int.tryParse(_blY.text) ?? _projectorHeight.round(),
          ],
        ],
      },
    ];

    systemDataSource.write(
      globalSavedMaptasticProjectorPositions,
      jsonEncode(layout),
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Custom preset saved to global database!'),
        ),
      );
    }
  }

  Future<void> _loadPreset() async {
    try {
      final stored = await systemDataSource.read(
        globalSavedMaptasticProjectorPositions,
      );
      if (stored == null || stored.toString().isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No global preset saved yet.')),
          );
        }
        return;
      }

      List<dynamic> layoutData = (stored is String)
          ? jsonDecode(stored)
          : stored;
      if (layoutData.isNotEmpty && layoutData[0]['targetPoints'] != null) {
        final pts = layoutData[0]['targetPoints'];
        setState(() {
          _tlX.text = pts[0][0].toString();
          _tlY.text = pts[0][1].toString();
          _trX.text = pts[1][0].toString();
          _trY.text = pts[1][1].toString();
          _brX.text = pts[2][0].toString();
          _brY.text = pts[2][1].toString();
          _blX.text = pts[3][0].toString();
          _blY.text = pts[3][1].toString();
        });
        _onManualCoordinateChanged();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Global preset loaded!')),
          );
        }
      }
    } catch (e) {
      debugPrint('Error loading global preset: $e');
    }
  }

  Widget _buildCoordinateField(String label, TextEditingController controller) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 12.0, bottom: 4.0),
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          PillTextField(controller: controller, hintText: '0'),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF285C83),
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    final double currentAspectRatio = (_projectorHeight > 0)
        ? _projectorWidth / _projectorHeight
        : 16 / 9;

    return Scaffold(
      backgroundColor: const Color(0xFF285C83),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 4,
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: 40.0,
                vertical: 48.0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Music Assistant Settings',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 24),

                  PillTextField(
                    controller: _musicAssistantUrlController,
                    hintText: 'music assistant instance',
                    prefixIcon: Icons.language,
                  ),
                  const SizedBox(height: 16),

                  PillTextField(
                    controller: _musicAssistantTokenController,
                    hintText: 'access token',
                    prefixIcon: Icons.vpn_key_outlined,
                    isHidden: true,
                  ),
                  const SizedBox(height: 16),

                  PillDropdown<String>(
                    value: _selectedPlayerId,
                    hintText: 'media player',
                    prefixIcon: Icons.music_note,
                    items: _availablePlayers.map((player) {
                      return DropdownMenuItem<String>(
                        value: player.playerID,
                        child: Text(player.displayName),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() => _selectedPlayerId = val);
                      _scheduleAutomaticSave();
                    },
                  ),

                  const SizedBox(height: 48),

                  const Text(
                    'Advanced',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 24),

                  PillTextField(
                    controller: _mqttHostController,
                    hintText: 'MQTT Broker',
                    prefixIcon: Icons.language,
                  ),
                  const SizedBox(height: 16),

                  PillTextField(
                    controller: _mqttPortController,
                    hintText: 'MQTT Websocket Port',
                    prefixIcon: Icons.settings_ethernet,
                  ),
                  const SizedBox(height: 16),

                  PillTextField(
                    controller: _siteUrlController,
                    hintText: 'Site URL',
                    prefixIcon: Icons.web,
                  ),

                  const SizedBox(height: 48),

                  Row(
                    children: [
                      Expanded(
                        child: _isSavingSettingsState
                            ? const Center(
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                ),
                              )
                            : PillButton(
                                text: 'Save',
                                backgroundColor: AppColors.brightGold,
                                textColor: Colors.black,
                                leading: const Icon(
                                  Icons.save,
                                  color: Colors.black,
                                ),
                                onPressed: _executeManualSaveProcedure,
                              ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _isTestingConnectionState
                            ? const Center(
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                ),
                              )
                            : PillButton(
                                text: 'Test Link',
                                backgroundColor: const Color(0xFF1B1E26),
                                textColor: Colors.white,
                                leading: const Icon(
                                  Icons.wifi_tethering,
                                  color: Colors.white,
                                ),
                                onPressed: _executeConnectionTestProcedure,
                              ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          Expanded(
            flex: 6,
            child: Padding(
              padding: const EdgeInsets.only(
                top: 48.0,
                bottom: 48.0,
                right: 48.0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Projection Mapping',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      decoration: TextDecoration.underline,
                      decorationColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 24),

                  Row(
                    children: [
                      Expanded(
                        child: PillDropdown<String>(
                          value: _targetProjectorId,
                          hintText: 'Select Target Display',
                          prefixIcon: Icons.cast,
                          items: [
                            const DropdownMenuItem(
                              value: 'all',
                              child: Text('Manual Override (All Displays)'),
                            ),
                            ..._discoveredProjectors.entries.map((e) {
                              String shortId = e.key.replaceFirst(
                                'projector_',
                                '',
                              );
                              return DropdownMenuItem(
                                value: e.key,
                                child: Text(
                                  'Display $shortId (${e.value['width']!.round()}x${e.value['height']!.round()})',
                                ),
                              );
                            }),
                          ],
                          onChanged: _onTargetChanged,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Container(
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: const Icon(
                            Icons.refresh,
                            color: Color(0xFF1B4066),
                          ),
                          tooltip: 'Scan for Projectors',
                          onPressed: _pingProjectors,
                        ),
                      ),
                      const SizedBox(width: 16),
                      PillButton(
                        text: 'Toggle UI',
                        backgroundColor: AppColors.brightGold,
                        textColor: Colors.black,
                        leading: const Icon(Icons.grid_on, color: Colors.black),
                        onPressed: _toggleProjectorUI,
                      ),
                    ],
                  ),

                  if (_targetProjectorId == 'all') ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: PillTextField(
                            controller: _widthController,
                            hintText: 'Canvas Width (px)',
                            prefixIcon: Icons.straighten,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: PillTextField(
                            controller: _heightController,
                            hintText: 'Canvas Height (px)',
                            prefixIcon: Icons.height,
                          ),
                        ),
                      ],
                    ),
                  ],

                  const SizedBox(height: 24),

                  Expanded(
                    child: Center(
                      child: AspectRatio(
                        aspectRatio: currentAspectRatio,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.black,
                            borderRadius: BorderRadius.circular(16.0),
                            border: Border.all(color: Colors.white24, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.15),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: InteractiveMapper(
                            key: _mapperKey,
                            systemDataSource: systemDataSource,
                            targetId: _targetProjectorId,
                            projectorWidth: _projectorWidth,
                            projectorHeight: _projectorHeight,
                            initialCorners: _getCurrentCornersAsPercentages(),
                            onCornersChanged: _onCanvasDragged,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  Focus(
                    onFocusChange: (hasFocus) {
                      if (!hasFocus) _onManualCoordinateChanged();
                    },
                    child: Column(
                      children: [
                        Row(
                          children: [
                            _buildCoordinateField('Top Left X', _tlX),
                            const SizedBox(width: 8),
                            _buildCoordinateField('Top Left Y', _tlY),
                            const SizedBox(width: 16),
                            _buildCoordinateField('Top Right X', _trX),
                            const SizedBox(width: 8),
                            _buildCoordinateField('Top Right Y', _trY),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _buildCoordinateField('Btm Left X', _blX),
                            const SizedBox(width: 8),
                            _buildCoordinateField('Btm Left Y', _blY),
                            const SizedBox(width: 16),
                            _buildCoordinateField('Btm Right X', _brX),
                            const SizedBox(width: 8),
                            _buildCoordinateField('Btm Right Y', _brY),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  Wrap(
                    spacing: 12.0,
                    runSpacing: 12.0,
                    children: [
                      PillButton(
                        text: 'Center',
                        backgroundColor: const Color(0xFF1B1E26),
                        textColor: Colors.white,
                        leading: const Icon(
                          Icons.center_focus_strong,
                          color: Colors.white,
                          size: 18,
                        ),
                        onPressed: _centerMapping,
                      ),
                      PillButton(
                        text: 'Save Preset',
                        backgroundColor: const Color(0xFF24C0E7),
                        textColor: Colors.black,
                        leading: const Icon(
                          Icons.save,
                          color: Colors.black,
                          size: 18,
                        ),
                        onPressed: _savePreset,
                      ),
                      PillButton(
                        text: 'Load Preset',
                        backgroundColor: AppColors.brightGold,
                        textColor: Colors.black,
                        leading: const Icon(
                          Icons.upload_file,
                          color: Colors.black,
                          size: 18,
                        ),
                        onPressed: _loadPreset,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
