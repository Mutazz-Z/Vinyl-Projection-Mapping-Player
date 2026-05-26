class AlbumTrackList {
  final String track;
  final int duration;
  final String coverImage;

  AlbumTrackList({
    required this.track,
    required this.duration,
    required this.coverImage,
  });

  factory AlbumTrackList.fromJson(Map<String, dynamic> json) {
    return AlbumTrackList(
      track: json['track'] as String? ?? 'Unknown Track',
      duration: json['duration'] as int? ?? 0,
      coverImage: json['cover_image'] as String? ?? '',
    );
  }

  static List<AlbumTrackList> fromJsonList(List<dynamic> jsonList) {
    return jsonList
        .map((item) => AlbumTrackList.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Map<String, dynamic> toJson() {
    return {'track': track, 'duration': duration, 'cover_image': coverImage};
  }
}
