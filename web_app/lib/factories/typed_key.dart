class TypedKey<T> {
  final String keyName;
  final T Function(dynamic)? fromJson;
  final dynamic Function(T)? toJson;

  const TypedKey(this.keyName, {this.fromJson, this.toJson});
}
