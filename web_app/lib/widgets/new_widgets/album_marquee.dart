import 'package:flutter/material.dart';

class InfiniteAlbumMarquee extends StatelessWidget {
  final List<String> imageUrls;

  const InfiniteAlbumMarquee({super.key, required this.imageUrls});

  @override
  Widget build(BuildContext context) {
    final validImages = imageUrls.where((url) => url.isNotEmpty).toList();

    List<String> baseList = List.from(validImages);
    if (baseList.isEmpty) {
      baseList = List.filled(20, '');
    } else {
      while (baseList.length < 20) {
        baseList.addAll(validImages);
      }
    }
    baseList = baseList.take(20).toList();

    return Column(
      children: [
        Expanded(
          child: _MarqueeRow(
            images: baseList,
            direction: -1,
            durationSeconds: 40,
          ),
        ),
        Expanded(
          child: _MarqueeRow(
            images: baseList.reversed.toList(),
            direction: 1,
            durationSeconds: 45,
          ),
        ),
        Expanded(
          child: _MarqueeRow(
            images: baseList,
            direction: -1,
            durationSeconds: 35,
          ),
        ),
        Expanded(
          child: _MarqueeRow(
            images: baseList.reversed.toList(),
            direction: 1,
            durationSeconds: 50,
          ),
        ),
      ],
    );
  }
}

class _MarqueeRow extends StatefulWidget {
  final List<String> images;
  final int direction;
  final int durationSeconds;

  const _MarqueeRow({
    required this.images,
    required this.direction,
    required this.durationSeconds,
  });

  @override
  State<_MarqueeRow> createState() => _MarqueeRowState();
}

class _MarqueeRowState extends State<_MarqueeRow>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(seconds: widget.durationSeconds),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const double itemSize = 140.0;
    const double horizontalMargin = 8.0;
    const double totalItemWidth = itemSize + (horizontalMargin * 2);

    final double singleSetWidth = widget.images.length * totalItemWidth;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final double offset = _controller.value * singleSetWidth;

        final double translationX = widget.direction == 1
            ? -singleSetWidth + offset
            : -offset;

        return Transform.translate(
          offset: Offset(translationX, 0),
          child: child,
        );
      },
      child: OverflowBox(
        maxWidth: double.maxFinite,
        alignment: Alignment.centerLeft,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [...widget.images, ...widget.images].map((url) {
            return Container(
              width: itemSize,
              height: itemSize,
              margin: const EdgeInsets.symmetric(
                horizontal: horizontalMargin,
                vertical: 12.0,
              ),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(24.0),
                image: url.isNotEmpty
                    ? DecorationImage(
                        image: NetworkImage(url),
                        fit: BoxFit.cover,
                      )
                    : null,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(2, 4),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
