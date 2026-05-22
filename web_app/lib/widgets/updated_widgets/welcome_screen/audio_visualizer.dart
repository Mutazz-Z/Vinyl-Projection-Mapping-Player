import 'package:flutter/material.dart';
import 'dart:math' as math;

class FakeAudioVisualizer extends StatefulWidget {
  final double height;
  final Color color;

  const FakeAudioVisualizer({
    super.key,
    required this.height,
    required this.color,
  });

  @override
  State<FakeAudioVisualizer> createState() => _FakeAudioVisualizerState();
}

class _FakeAudioVisualizerState extends State<FakeAudioVisualizer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return CustomPaint(
            painter: _VisualizerPainter(
              progress: _controller.value,
              color: widget.color,
            ),
          );
        },
      ),
    );
  }
}

class _VisualizerPainter extends CustomPainter {
  final double progress;
  final Color color;

  _VisualizerPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    const double barWidth = 6.0;
    const double spacing = 6.0;
    const double totalBarWidth = barWidth + spacing;

    final int barCount = (size.width / totalBarWidth).ceil();

    for (int i = 0; i < barCount; i++) {
      final double x = i * totalBarWidth;

      final double t = progress * 2 * math.pi;
      final double noise =
          math.sin(t * 3 + i * 0.5) *
          math.cos(t * 5 - i * 0.2) *
          math.sin(t * 1.5 + i * 0.8);

      final double minHeight = 4.0;
      final double maxHeight = size.height;
      final double h = minHeight + (maxHeight - minHeight) * noise.abs();

      final rect = RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(x + (barWidth / 2), size.height / 2),
          width: barWidth,
          height: h,
        ),
        const Radius.circular(barWidth / 2),
      );

      canvas.drawRRect(rect, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _VisualizerPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
