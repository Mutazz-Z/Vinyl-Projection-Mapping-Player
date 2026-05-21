import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:web_app/services/system_data_source.dart';

class InteractiveMapper extends StatefulWidget {
  final SystemDataSource systemDataSource;
  final String targetId;
  final double projectorWidth;
  final double projectorHeight;

  final List<Offset>? initialCorners;
  final ValueChanged<List<Offset>>? onCornersChanged;

  const InteractiveMapper({
    super.key,
    required this.systemDataSource,
    this.targetId = 'all',
    this.projectorWidth = 1920,
    this.projectorHeight = 1080,
    this.initialCorners,
    this.onCornersChanged,
  });

  @override
  State<InteractiveMapper> createState() => InteractiveMapperState();
}

class InteractiveMapperState extends State<InteractiveMapper> {
  late List<Offset> corners;

  Timer? _throttleTimer;

  @override
  void initState() {
    super.initState();
    corners =
        widget.initialCorners ??
        [
          const Offset(0.0, 0.0),
          const Offset(1.0, 0.0),
          const Offset(1.0, 1.0),
          const Offset(0.0, 1.0),
        ];
  }

  void applyCorners(List<Offset> newCorners) {
    setState(() {
      corners = newCorners;
    });
    _publishLayout();
  }

  void _publishLayout() {
    if (_throttleTimer?.isActive ?? false) return;

    _throttleTimer = Timer(const Duration(milliseconds: 100), () {
      final layout = [
        {
          "id": "projection-group",
          "sourcePoints": [
            [0, 0],
            [500, 0],
            [500, 500],
            [0, 500],
          ],
          "targetPoints": corners
              .map(
                (c) => [
                  (c.dx * widget.projectorWidth).round(),
                  (c.dy * widget.projectorHeight).round(),
                ],
              )
              .toList(),
        },
      ];

      widget.systemDataSource.write('GLOBAL_ProjectorHeartbeatSignal', {
        'action': 'layout',
        'targetId': widget.targetId,
        'data': layout,
        'ts': DateTime.now().millisecondsSinceEpoch,
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final double currentAspectRatio = (widget.projectorHeight > 0)
        ? widget.projectorWidth / widget.projectorHeight
        : 16 / 9;

    return AspectRatio(
      aspectRatio: currentAspectRatio,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black87,
          border: Border.all(color: Colors.grey.shade800, width: 2),
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final double w = constraints.maxWidth;
            final double h = constraints.maxHeight;

            return Stack(
              clipBehavior: Clip.none,
              children: [
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onPanUpdate: (details) {
                    setState(() {
                      double dx = details.delta.dx / w;
                      double dy = details.delta.dy / h;

                      double minX = corners.map((c) => c.dx).reduce(min);
                      double maxX = corners.map((c) => c.dx).reduce(max);
                      double minY = corners.map((c) => c.dy).reduce(min);
                      double maxY = corners.map((c) => c.dy).reduce(max);

                      if (minX + dx < 0.0) dx = -minX;
                      if (maxX + dx > 1.0) dx = 1.0 - maxX;
                      if (minY + dy < 0.0) dy = -minY;
                      if (maxY + dy > 1.0) dy = 1.0 - maxY;

                      for (int i = 0; i < 4; i++) {
                        corners[i] = Offset(
                          corners[i].dx + dx,
                          corners[i].dy + dy,
                        );
                      }
                    });
                    widget.onCornersChanged?.call(corners);
                    _publishLayout();
                  },
                  child: CustomPaint(
                    size: Size(w, h),
                    painter: _QuadPainter(corners: corners),
                  ),
                ),

                ...List.generate(4, (index) {
                  return Positioned(
                    left: (corners[index].dx * w) - 20,
                    top: (corners[index].dy * h) - 20,
                    child: GestureDetector(
                      onPanUpdate: (details) {
                        setState(() {
                          double newX =
                              (corners[index].dx + (details.delta.dx / w))
                                  .clamp(0.0, 1.0);
                          double newY =
                              (corners[index].dy + (details.delta.dy / h))
                                  .clamp(0.0, 1.0);
                          corners[index] = Offset(newX, newY);
                        });
                        widget.onCornersChanged?.call(corners);
                        _publishLayout();
                      },
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.redAccent.withValues(alpha: 0.8),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(
                          Icons.open_with,
                          size: 20,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  );
                }),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _QuadPainter extends CustomPainter {
  final List<Offset> corners;
  _QuadPainter({required this.corners});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.blueAccent.withValues(alpha: 0.3)
      ..style = PaintingStyle.fill;

    final outlinePaint = Paint()
      ..color = Colors.blueAccent
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(corners[0].dx * size.width, corners[0].dy * size.height)
      ..lineTo(corners[1].dx * size.width, corners[1].dy * size.height)
      ..lineTo(corners[2].dx * size.width, corners[2].dy * size.height)
      ..lineTo(corners[3].dx * size.width, corners[3].dy * size.height)
      ..close();

    canvas.drawPath(path, paint);
    canvas.drawPath(path, outlinePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
