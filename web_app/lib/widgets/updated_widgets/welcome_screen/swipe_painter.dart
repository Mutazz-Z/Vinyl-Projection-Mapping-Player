import 'package:flutter/material.dart';
import 'dart:math' as math;

class AnimatedColorSwipe extends StatelessWidget {
  final Animation<double> animation;
  final Offset start;
  final Offset end;
  final double opacity;
  final double strokeWidth;
  final List<Color> colors;

  const AnimatedColorSwipe({
    super.key,
    required this.animation,
    required this.start,
    required this.end,
    required this.colors,
    this.opacity = 1.0,
    this.strokeWidth = 40.0,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return CustomPaint(
          painter: _SwipePainter(
            progress: animation.value,
            start: start,
            end: end,
            opacity: opacity,
            strokeWidth: strokeWidth,
            colors: colors,
          ),
        );
      },
    );
  }
}

class _SwipePainter extends CustomPainter {
  final double progress;
  final Offset start;
  final Offset end;
  final double opacity;
  final double strokeWidth;
  final List<Color> colors;

  _SwipePainter({
    required this.progress,
    required this.start,
    required this.end,
    required this.opacity,
    required this.strokeWidth,
    required this.colors,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0) return;

    final currentEnd = Offset(
      start.dx + (end.dx - start.dx) * progress,
      start.dy + (end.dy - start.dy) * progress,
    );

    final dx = end.dx - start.dx;
    final dy = end.dy - start.dy;
    final length = math.sqrt(dx * dx + dy * dy);

    final nx = -dy / length;
    final ny = dx / length;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.square;

    for (int i = 0; i < colors.length; i++) {
      paint.color = colors[i].withValues(alpha: opacity);

      final shiftAmount = i * strokeWidth;
      final shiftOffset = Offset(nx * shiftAmount, ny * shiftAmount);

      canvas.drawLine(start + shiftOffset, currentEnd + shiftOffset, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SwipePainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
