extension MapParsingUtils on Map<String, dynamic> {
  String? getFirstString(List<String> keys) {
    for (final key in keys) {
      final value = this[key];
      if (value == null) continue;
      
      final trimmed = value.toString().trim();
      if (trimmed.isNotEmpty) return trimmed;
    }
    return null;
  }

  Map<String, dynamic>? getMap(String key) {
    final value = this[key];
    if (value is Map<String, dynamic>) return value;
    return null;
  }

  List<dynamic>? getList(String key) {
    final value = this[key];
    if (value is List) return value;
    return null;
  }
}