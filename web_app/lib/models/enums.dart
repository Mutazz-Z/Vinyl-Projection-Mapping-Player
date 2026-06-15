enum VisualEffect {
  unknown,
  play,
  stop;

  String toJson() => name;

  static VisualEffect fromJson(String json) {
    return VisualEffect.values.firstWhere(
      (e) => e.name == json,
      orElse: () => VisualEffect.unknown,
    );
  }
}