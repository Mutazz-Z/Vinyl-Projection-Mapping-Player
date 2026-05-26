class AlbumsInLibrary {
  final String itemId;
  final String provider;
  final String mediaTitle;
  final String artist;
  final String coverImage;

  AlbumsInLibrary({
    required this.itemId,
    required this.provider,
    required this.mediaTitle,
    required this.artist,
    required this.coverImage,
  });

  factory AlbumsInLibrary.fromJson(Map<String, dynamic> json) {
    return AlbumsInLibrary(
      itemId: json['item_id'] as String? ?? '',
      provider: json['provider'] as String? ?? '',
      mediaTitle: json['media_title'] as String? ?? 'Unknown Title',
      artist: json['artist'] as String? ?? 'Unknown Artist',
      coverImage: json['cover_image'] as String? ?? '',
    );
  }
}
