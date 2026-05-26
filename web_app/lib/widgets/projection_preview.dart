import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:web_app/main.dart';

class ProjectionPreview extends StatefulWidget {
  final Color outerColor;
  final Color innerColor;
  final String outerImage;
  final String innerImage;
  final String coverArt;
  final String overlayArt;

  const ProjectionPreview({
    super.key,
    required this.outerColor,
    required this.innerColor,
    required this.outerImage,
    required this.innerImage,
    required this.coverArt,
    required this.overlayArt,
  });

  @override
  State<ProjectionPreview> createState() => _ProjectionPreviewState();
}

class _ProjectionPreviewState extends State<ProjectionPreview>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ringSpinController;
  late final String _sessionCacheBuster;

  @override
  void initState() {
    super.initState();
    _sessionCacheBuster = DateTime.now().millisecondsSinceEpoch.toString();
    _ringSpinController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 18),
    )..repeat();
  }

  @override
  void dispose() {
    _ringSpinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const double sleeveSize = 176;
    const double outerRingDiameter = 170;
    const double innerRingDiameter = outerRingDiameter * 0.25;
    const double previewWidth = 360;
    const double previewHeight = 260;
    final double ringOffsetX = sleeveSize / 2;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Projection Preview',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1B4066),
            ),
          ),
          const SizedBox(height: 24),
          Center(
            child: SizedBox(
              width: previewWidth,
              height: previewHeight,
              child: Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: <Widget>[
                  AnimatedBuilder(
                    animation: _ringSpinController,
                    child: Stack(
                      alignment: Alignment.center,
                      clipBehavior: Clip.none,
                      children: <Widget>[
                        _buildRingLayer(
                          diameter: outerRingDiameter,
                          color: widget.outerColor,
                          imageUrl: widget.outerImage,
                        ),
                        _buildRingLayer(
                          diameter: innerRingDiameter,
                          color: widget.innerColor,
                          imageUrl: widget.innerImage,
                        ),
                      ],
                    ),
                    builder: (BuildContext context, Widget? child) {
                      final double spinAngle =
                          _ringSpinController.value * 2 * math.pi;
                      return Transform.translate(
                        offset: Offset(ringOffsetX, 0),
                        child: Transform.rotate(angle: spinAngle, child: child),
                      );
                    },
                  ),

                  Container(
                    width: sleeveSize,
                    height: sleeveSize,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 10,
                          offset: const Offset(2, 4),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: widget.coverArt.isEmpty
                        ? const Center(
                            child: Icon(
                              Icons.album,
                              size: 52,
                              color: Colors.grey,
                            ),
                          )
                        : _buildMediaFromSource(
                            widget.coverArt,
                            fit: BoxFit.cover,
                            fallback: const Center(
                              child: Icon(Icons.album, color: Colors.grey),
                            ),
                          ),
                  ),

                  if (widget.overlayArt.isNotEmpty)
                    SizedBox(
                      width: sleeveSize,
                      height: sleeveSize,
                      child: Opacity(
                        opacity: 0.8,
                        child: IgnorePointer(
                          child: _buildMediaFromSource(
                            widget.overlayArt,
                            fit: BoxFit.cover,
                            fallback: const SizedBox.shrink(),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRingLayer({
    required double diameter,
    required Color color,
    required String imageUrl,
  }) {
    return Container(
      width: diameter,
      height: diameter,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: imageUrl.isEmpty ? color : Colors.transparent,
      ),
      child: imageUrl.isNotEmpty
          ? ClipOval(
              child: _buildMediaFromSource(
                imageUrl,
                fit: BoxFit.cover,
                fallback: const SizedBox.shrink(),
              ),
            )
          : null,
    );
  }

  Widget _buildMediaFromSource(
    String source, {
    required BoxFit fit,
    required Widget fallback,
  }) {
    if (source.startsWith('data:')) {
      final int commaIndex = source.indexOf(',');
      if (commaIndex > 0 && commaIndex < source.length - 1) {
        try {
          final Uint8List bytes = base64Decode(
            source.substring(commaIndex + 1),
          );
          return Image.memory(
            bytes,
            fit: fit,
            width: double.infinity,
            height: double.infinity,
          );
        } catch (_) {
          return fallback;
        }
      }
      return fallback;
    }

    String normalizedSource = source;
    if (normalizedSource.startsWith('/')) {
      normalizedSource = 'http://$globalOrchestratorHostAddress:8080$normalizedSource';
    }

    if (normalizedSource.toLowerCase().endsWith('.mp4')) {
      return _LoopingVideoWidget(url: normalizedSource, fit: fit);
    }

    final String safeSource = Uri.encodeFull(
      normalizedSource.contains('?')
          ? '$normalizedSource&v=$_sessionCacheBuster'
          : '$normalizedSource?v=$_sessionCacheBuster',
    );

    return Image.network(
      safeSource,
      fit: fit,
      width: double.infinity,
      height: double.infinity,
      errorBuilder: (context, error, stackTrace) => fallback,
    );
  }
}

class _LoopingVideoWidget extends StatefulWidget {
  final String url;
  final BoxFit fit;

  const _LoopingVideoWidget({required this.url, required this.fit});

  @override
  State<_LoopingVideoWidget> createState() => _LoopingVideoWidgetState();
}

class _LoopingVideoWidgetState extends State<_LoopingVideoWidget> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        _controller.setVolume(0.0);
        _controller.setLooping(true);
        _controller.play();
        if (mounted) {
          setState(() => _isInitialized = true);
        }
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    return SizedBox.expand(
      child: FittedBox(
        fit: widget.fit,
        child: SizedBox(
          width: _controller.value.size.width,
          height: _controller.value.size.height,
          child: VideoPlayer(_controller),
        ),
      ),
    );
  }
}
