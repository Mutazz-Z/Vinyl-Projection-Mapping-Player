import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:web_app/main.dart';

class VinylCard extends StatefulWidget {
  final String albumName;
  final String coverArt;
  final Color outerColor;
  final Color innerColor;
  final String outerImage;
  final String innerImage;
  final String overlayArt;
  final VoidCallback? onTap;

  const VinylCard({
    super.key,
    required this.albumName,
    required this.coverArt,
    this.outerColor = const Color(0xFF111111),
    this.innerColor = Colors.white,
    this.outerImage = '',
    this.innerImage = '',
    this.overlayArt = '',
    this.onTap,
  });

  @override
  State<VinylCard> createState() => _VinylCardState();
}

class _VinylCardState extends State<VinylCard>
    with SingleTickerProviderStateMixin {
  bool _isHovered = false;
  late final AnimationController _spinController;

  @override
  void initState() {
    super.initState();
    _spinController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );
  }

  @override
  void dispose() {
    _spinController.dispose();
    super.dispose();
  }

  void _onHoverChanged(bool hovered) {
    setState(() => _isHovered = hovered);
    if (hovered) {
      _spinController.repeat();
    } else {
      _spinController.stop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => _onHoverChanged(true),
      onExit: (_) => _onHoverChanged(false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 160,
              width: 220,
              child: Stack(
                alignment: Alignment.centerLeft,
                children: [
                  Positioned(
                    left: 60,
                    child: RotationTransition(
                      turns: _spinController,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF111111),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(4, 4),
                            ),
                          ],
                        ),
                        child: Center(child: _buildInnerLabel()),
                      ),
                    ),
                  ),
                  _buildAlbumSleeve(),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: 160,
              child: Text(
                widget.albumName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInnerLabel() {
    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: widget.innerImage.isEmpty
            ? widget.innerColor
            : Colors.transparent,
      ),
      child: widget.innerImage.isNotEmpty
          ? ClipOval(
              child: _buildMediaFromUrl(widget.innerImage, fit: BoxFit.cover),
            )
          : null,
    );
  }

  Widget _buildAlbumSleeve() {
    return Container(
      width: 160,
      height: 160,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 10,
            offset: const Offset(-2, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          _buildSleeveBackground(),
          if (widget.coverArt.isNotEmpty)
            _buildMediaFromUrl(widget.coverArt, fit: BoxFit.cover),
          if (widget.overlayArt.isNotEmpty && _isHovered)
            AnimatedOpacity(
              opacity: _isHovered ? 0.8 : 0.0,
              duration: const Duration(milliseconds: 200),
              child: IgnorePointer(
                child: _buildMediaFromUrl(widget.overlayArt, fit: BoxFit.cover),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSleeveBackground() {
    if (widget.outerImage.isNotEmpty) {
      return _buildMediaFromUrl(widget.outerImage, fit: BoxFit.cover);
    }
    return ColoredBox(color: widget.outerColor);
  }

  Widget _buildMediaFromUrl(String source, {required BoxFit fit}) {
    if (source.startsWith('data:')) {
      return _buildMediaFromBase64DataUri(source, fit: fit);
    }

    String resolvedUrl = source;
    if (resolvedUrl.startsWith('/')) {
      resolvedUrl = '${systemDataSource.httpBaseUrl}$resolvedUrl';
    }

    if (resolvedUrl.toLowerCase().endsWith('.mp4')) {
      return _LoopingVideoWidget(url: resolvedUrl, fit: fit);
    }

    return Image.network(
      resolvedUrl,
      fit: fit,
      errorBuilder: (_, __, ___) => const SizedBox(),
    );
  }

  Widget _buildMediaFromBase64DataUri(String dataUri, {required BoxFit fit}) {
    final int commaIndex = dataUri.indexOf(',');
    if (commaIndex <= 0) return const SizedBox();
    try {
      final Uint8List imageBytes = base64Decode(
        dataUri.substring(commaIndex + 1),
      );
      return Image.memory(imageBytes, fit: fit);
    } catch (_) {
      return const SizedBox();
    }
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
        if (mounted) setState(() => _isInitialized = true);
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) return const SizedBox();
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
