import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:web_app/theme/app_theme.dart';

class AnimatedWaveform extends StatefulWidget {
  const AnimatedWaveform({super.key});

  @override
  State<AnimatedWaveform> createState() => _AnimatedWaveformState();
}

class _AnimatedWaveformState extends State<AnimatedWaveform>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const double barWidth = 8.0;
        const double barSpacing = 6.0;
        const double totalBarWidth = barWidth + barSpacing;

        final int barCount = (constraints.maxWidth / totalBarWidth).floor();

        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: List.generate(barCount, (index) {
                final double normalizedIndex = (index / barCount) * 2 - 1;
                final double bellCurve = math.max(
                  0.1,
                  math.exp(-(normalizedIndex * normalizedIndex) * 4),
                );

                final double baseHeight =
                    (constraints.maxHeight * 0.4) * bellCurve;

                final double animationValue = _controller.value * 2 * math.pi;

                final double wave1 = math.sin(animationValue + (index * 0.4));
                final double wave2 = math.cos(
                  (animationValue * 2) + (index * 0.7),
                );

                final double modifier = (wave1 + wave2) / 2;

                final double currentHeight =
                    baseHeight + (baseHeight * 0.4 * modifier);

                return Container(
                  width: barWidth,
                  height: currentHeight,
                  decoration: BoxDecoration(
                    color: AppColors.porcelain,
                    borderRadius: BorderRadius.circular(10.0),
                  ),
                );
              }),
            );
          },
        );
      },
    );
  }
}
