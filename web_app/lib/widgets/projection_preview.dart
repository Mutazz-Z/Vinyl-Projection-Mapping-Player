import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

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
      padding: const EdgeInsets.all(AppSpacing.containerPadding),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(AppSpacing.containerRadius),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'Projection Preview',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
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
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.outlineVariant,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: widget.coverArt.isEmpty
                        ? const Center(child: Icon(Icons.album, size: 52))
                        : _buildImageFromSource(
                            widget.coverArt,
                            fit: BoxFit.cover,
                            fallback: const Center(child: Icon(Icons.album)),
                          ),
                  ),
                  if (widget.overlayArt.isNotEmpty)
                    SizedBox(
                      width: sleeveSize,
                      height: sleeveSize,
                      child: Opacity(
                        opacity: 0.8,
                        child: _buildImageFromSource(
                          widget.overlayArt,
                          fit: BoxFit.cover,
                          fallback: const SizedBox.shrink(),
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
        color: imageUrl.isEmpty ? color : Colors.black,
      ),
      child: imageUrl.isNotEmpty
          ? ClipOval(
              child: _buildImageFromSource(
                imageUrl,
                fit: BoxFit.cover,
                fallback: const SizedBox.shrink(),
              ),
            )
          : null,
    );
  }

  Widget _buildImageFromSource(
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

    final String urlWithBuster = source.contains('?')
        ? '$source&v=$_sessionCacheBuster'
        : '$source?v=$_sessionCacheBuster';

    final String safeSource = Uri.encodeFull(urlWithBuster);

    return Image.network(
      safeSource,
      fit: fit,
      width: double.infinity,
      height: double.infinity,
      errorBuilder:
          (BuildContext context, Object error, StackTrace? stackTrace) {
            return fallback;
          },
    );
  }
}
