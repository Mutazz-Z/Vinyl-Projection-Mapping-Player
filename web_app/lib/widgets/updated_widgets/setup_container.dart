import 'package:flutter/material.dart';
import 'package:web_app/widgets/updated_widgets/vinyl_record.dart';

class RightNotchClipper extends CustomClipper<Path> {
  final double notchRadius;

  RightNotchClipper({required this.notchRadius});

  @override
  Path getClip(Size size) {
    final path = Path();
    path.lineTo(size.width, 0);

    final notchTop = (size.height / 2) - notchRadius;
    final notchBottom = (size.height / 2) + notchRadius;

    path.lineTo(size.width, notchTop);

    path.arcToPoint(
      Offset(size.width, notchBottom),
      radius: Radius.circular(notchRadius),
      clockwise: false,
    );

    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => true;
}

class VinylContainer extends StatelessWidget {
  final Widget child;
  final Color containerColor;
  final double notchRadius;

  const VinylContainer({
    super.key,
    required this.child,
    required this.containerColor,
    this.notchRadius = 40.0,
  });

  @override
  Widget build(BuildContext context) {
    const double recordSize = 450.0;

    return SizedBox(
      height: 500,
      width: double.infinity,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.centerLeft,
        children: [
          Positioned(right: -130, child: VinylRecord(size: recordSize)),

          Positioned(
            left: 0,
            right: 80,
            top: 0,
            bottom: 0,
            child: ClipPath(
              clipper: RightNotchClipper(notchRadius: notchRadius),
              child: Container(
                decoration: BoxDecoration(
                  color: containerColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: EdgeInsets.only(
                  left: 32.0 + notchRadius,
                  top: 32.0,
                  bottom: 32.0,
                  right: 32.0 + notchRadius,
                ),
                child: child,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
