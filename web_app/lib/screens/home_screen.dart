import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:web_app/services/interactive_mapper.dart';
import 'package:web_app/services/mqtt_service.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:http/http.dart' as http;

class HomeScreen extends StatefulWidget {
  final MqttService mqttService;

  const HomeScreen({super.key, required this.mqttService});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

String get _uiApiUrl {
  final String host = Uri.base.host;
  final ip = (host.isNotEmpty && host != 'localhost' && host != '127.0.0.1')
      ? host
      : '127.0.0.1';
  return 'http://$ip:8100/api/config/ui';
}

class _HomeScreenState extends State<HomeScreen> {
  String _targetProjectorId = 'all';
  final Map<String, Map<String, double>> _discoveredProjectors = {};

  double _projectorWidth = 1920;
  double _projectorHeight = 1080;

  final TextEditingController _widthController = TextEditingController(
    text: '1920',
  );
  final TextEditingController _heightController = TextEditingController(
    text: '1080',
  );

  final TextEditingController _tlX = TextEditingController(text: '0');
  final TextEditingController _tlY = TextEditingController(text: '0');
  final TextEditingController _trX = TextEditingController(text: '1920');
  final TextEditingController _trY = TextEditingController(text: '0');
  final TextEditingController _brX = TextEditingController(text: '1920');
  final TextEditingController _brY = TextEditingController(text: '1080');
  final TextEditingController _blX = TextEditingController(text: '0');
  final TextEditingController _blY = TextEditingController(text: '1080');

  final GlobalKey<InteractiveMapperState> _mapperKey =
      GlobalKey<InteractiveMapperState>();

  Timer? _saveDebounceTimer;

  @override
  void initState() {
    super.initState();
    _loadLastState();

    widget.mqttService.onProjectorDiscovered = (id, width, height) {
      if (mounted) {
        setState(() {
          _discoveredProjectors[id] = {'width': width, 'height': height};
        });
      }
    };

    Future.delayed(const Duration(seconds: 1), () {
      widget.mqttService.pingProjectors();
    });
  }

  @override
  void dispose() {
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
    _saveDebounceTimer?.cancel();
    super.dispose();
  }

  void _scheduleSave() {
    _saveDebounceTimer?.cancel();
    
    _saveDebounceTimer = Timer(const Duration(milliseconds: 500), () {
      _saveLastState();
    });
  }

  Future<void> _loadLastState() async {
    try {
      final res = await http
          .get(Uri.parse(_uiApiUrl))
          .timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;

        setState(() {
          _projectorWidth =
              double.tryParse(data['mapping_width'] ?? '') ?? 1920;
          _projectorHeight =
              double.tryParse(data['mapping_height'] ?? '') ?? 1080;

          _widthController.text = _projectorWidth.round().toString();
          _heightController.text = _projectorHeight.round().toString();

          _tlX.text = data['mapping_tlX'] ?? '0';
          _tlY.text = data['mapping_tlY'] ?? '0';
          _trX.text = data['mapping_trX'] ?? _projectorWidth.toString();
          _trY.text = data['mapping_trY'] ?? '0';
          _brX.text = data['mapping_brX'] ?? _projectorWidth.toString();
          _brY.text = data['mapping_brY'] ?? _projectorHeight.toString();
          _blX.text = data['mapping_blX'] ?? '0';
          _blY.text = data['mapping_blY'] ?? _projectorHeight.toString();
        });
      }
    } catch (e) {
      debugPrint('Warning: Could not load global mapping state. ($e)');
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _onManualCoordinateChanged();
    });
  }

  Future<void> _saveLastState() async {
    try {
      await http.post(
        Uri.parse(_uiApiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mapping_width': _projectorWidth.toString(),
          'mapping_height': _projectorHeight.toString(),
          'mapping_tlX': _tlX.text,
          'mapping_tlY': _tlY.text,
          'mapping_trX': _trX.text,
          'mapping_trY': _trY.text,
          'mapping_brX': _brX.text,
          'mapping_brY': _brY.text,
          'mapping_blX': _blX.text,
          'mapping_blY': _blY.text,
        }),
      );
    } catch (e) {
      debugPrint('Warning: Could not save mapping state globally. ($e)');
    }
  }

  Future<void> _savePreset() async {
    try {
      await http.post(
        Uri.parse(_uiApiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mapping_preset_tlX': _tlX.text,
          'mapping_preset_tlY': _tlY.text,
          'mapping_preset_trX': _trX.text,
          'mapping_preset_trY': _trY.text,
          'mapping_preset_brX': _brX.text,
          'mapping_preset_brY': _brY.text,
          'mapping_preset_blX': _blX.text,
          'mapping_preset_blY': _blY.text,
        }),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Custom preset saved to global database!'),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error saving preset globally: $e');
    }
  }

  Future<void> _loadPreset() async {
    try {
      final res = await http.get(Uri.parse(_uiApiUrl));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;

        if (!data.containsKey('mapping_preset_tlX')) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('No global preset saved yet.')),
            );
          }
          return;
        }

        setState(() {
          _tlX.text = data['mapping_preset_tlX'] ?? '0';
          _tlY.text = data['mapping_preset_tlY'] ?? '0';
          _trX.text = data['mapping_preset_trX'] ?? '0';
          _trY.text = data['mapping_preset_trY'] ?? '0';
          _brX.text = data['mapping_preset_brX'] ?? '0';
          _brY.text = data['mapping_preset_brY'] ?? '0';
          _blX.text = data['mapping_preset_blX'] ?? '0';
          _blY.text = data['mapping_preset_blY'] ?? '0';
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

  void _onTargetChanged(String? newTargetId) {
    if (newTargetId == null) return;

    setState(() {
      _targetProjectorId = newTargetId;

      if (_targetProjectorId != 'all') {
        _projectorWidth = _discoveredProjectors[newTargetId]!['width']!;
        _projectorHeight = _discoveredProjectors[newTargetId]!['height']!;
        _widthController.text = _projectorWidth.round().toString();
        _heightController.text = _projectorHeight.round().toString();
        _saveLastState();
      }
    });
  }

  void _updateResolution() {
    setState(() {
      _projectorWidth = double.tryParse(_widthController.text) ?? 1920;
      _projectorHeight = double.tryParse(_heightController.text) ?? 1080;
    });
    _scheduleSave();
    FocusScope.of(context).unfocus();
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

    _scheduleSave();
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
    _scheduleSave();
  }

  Widget _buildCoordinateField(String label, TextEditingController controller) {
    return Expanded(
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          isDense: true,
        ),
        onChanged: (value) => _onManualCoordinateChanged(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    bool isManualOverride = _targetProjectorId == 'all';

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.pagePadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Home', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 32),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Projector Target',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        IconButton(
                          icon: const Icon(Icons.refresh),
                          tooltip: 'Scan for Projectors',
                          onPressed: () {
                            setState(() {
                              _discoveredProjectors.clear();
                              _targetProjectorId = 'all';
                            });
                            widget.mqttService.pingProjectors();
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                      ),
                      value: _targetProjectorId,
                      items: [
                        const DropdownMenuItem(
                          value: 'all',
                          child: Text('Manual Override (All Displays)'),
                        ),
                        ..._discoveredProjectors.entries.map((e) {
                          String shortId = e.key.replaceFirst('projector_', '');
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

                    const Divider(height: 48),

                    Text(
                      'Projector Calibration',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),

                    ElevatedButton.icon(
                      icon: const Icon(Icons.grid_on),
                      label: const Text('Toggle Projector Mapping UI'),
                      onPressed: () => widget.mqttService.toggleMappingMode(
                        targetId: _targetProjectorId,
                      ),
                    ),
                    const SizedBox(height: 16),

                    Wrap(
                      spacing: 8.0,
                      runSpacing: 8.0,
                      children: [
                        OutlinedButton.icon(
                          icon: const Icon(Icons.center_focus_strong),
                          label: const Text('Center 500x500'),
                          onPressed: () {
                            const double squareSize = 500.0;
                            final double startX =
                                (_projectorWidth - squareSize) / 2;
                            final double startY =
                                (_projectorHeight - squareSize) / 2;

                            final double pStartX = startX / _projectorWidth;
                            final double pStartY = startY / _projectorHeight;
                            final double pEndX =
                                (startX + squareSize) / _projectorWidth;
                            final double pEndY =
                                (startY + squareSize) / _projectorHeight;

                            final List<Offset> centeredCorners = [
                              Offset(pStartX, pStartY),
                              Offset(pEndX, pStartY),
                              Offset(pEndX, pEndY),
                              Offset(pStartX, pEndY),
                            ];

                            _mapperKey.currentState?.applyCorners(
                              centeredCorners,
                            );
                            _onCanvasDragged(centeredCorners);
                          },
                        ),
                        OutlinedButton.icon(
                          icon: const Icon(Icons.save),
                          label: const Text('Save Preset'),
                          onPressed: _savePreset,
                        ),
                        OutlinedButton.icon(
                          icon: const Icon(Icons.upload_file),
                          label: const Text('Load Preset'),
                          onPressed: _loadPreset,
                        ),
                      ],
                    ),

                    const Divider(height: 48),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Live Mapping Resolution',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        IconButton(
                          icon: const Icon(Icons.fullscreen),
                          tooltip: 'Open Fullscreen Editor',
                          onPressed: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => FullscreenMapperScreen(
                                  mqttService: widget.mqttService,
                                  targetId: _targetProjectorId,
                                  projectorWidth: _projectorWidth,
                                  projectorHeight: _projectorHeight,
                                  initialCorners:
                                      _getCurrentCornersAsPercentages(),
                                  onCornersChanged: _onCanvasDragged,
                                ),
                              ),
                            );

                            _onManualCoordinateChanged();
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _widthController,
                            enabled: isManualOverride,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Width (px)',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            onChanged: (_) => _updateResolution(),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextField(
                            controller: _heightController,
                            enabled: isManualOverride,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Height (px)',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            onChanged: (_) => _updateResolution(),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 400),
                      child: Center(
                        child: InteractiveMapper(
                          key: _mapperKey,
                          mqttService: widget.mqttService,
                          targetId: _targetProjectorId,
                          projectorWidth: _projectorWidth,
                          projectorHeight: _projectorHeight,
                          onCornersChanged: _onCanvasDragged,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    const Divider(height: 48),

                    Text(
                      'Manual Pixel Adjustments',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        _buildCoordinateField('TL X', _tlX),
                        const SizedBox(width: 8),
                        _buildCoordinateField('TL Y', _tlY),
                        const SizedBox(width: 24),
                        _buildCoordinateField('TR X', _trX),
                        const SizedBox(width: 8),
                        _buildCoordinateField('TR Y', _trY),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildCoordinateField('BL X', _blX),
                        const SizedBox(width: 8),
                        _buildCoordinateField('BL Y', _blY),
                        const SizedBox(width: 24),
                        _buildCoordinateField('BR X', _brX),
                        const SizedBox(width: 8),
                        _buildCoordinateField('BR Y', _brY),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class FullscreenMapperScreen extends StatelessWidget {
  final MqttService mqttService;
  final String targetId;
  final double projectorWidth;
  final double projectorHeight;
  final List<Offset> initialCorners;
  final ValueChanged<List<Offset>> onCornersChanged;

  const FullscreenMapperScreen({
    super.key,
    required this.mqttService,
    required this.targetId,
    required this.projectorWidth,
    required this.projectorHeight,
    required this.initialCorners,
    required this.onCornersChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: InteractiveMapper(
                  mqttService: mqttService,
                  targetId: targetId,
                  projectorWidth: projectorWidth,
                  projectorHeight: projectorHeight,
                  initialCorners: initialCorners,
                  onCornersChanged: onCornersChanged,
                ),
              ),
            ),

            Positioned(
              top: 16,
              left: 16,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black54,
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 28),
                  tooltip: 'Close Fullscreen',
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
