import 'package:web_app/factories/album_tracklist.dart';

class VinylRecordTagData {
  final String tagUid;
  final String itemId;
  final String provider;
  final String mediaTitle;
  final String artist;
  final List<AlbumTrackList> trackList;
  final String coverImage;
  final String labelColor;
  final String labelImage;
  final String outerRingColor;
  final String outerRingImage;
  final String projectionOverlay;

  VinylRecordTagData({
    required this.tagUid,
    required this.itemId,
    required this.provider,
    required this.mediaTitle,
    required this.artist,
    required this.trackList,
    required this.coverImage,
    required this.labelColor,
    required this.labelImage,
    required this.outerRingColor,
    required this.outerRingImage,
    required this.projectionOverlay,
  });

  factory VinylRecordTagData.fromJson(Map<String, dynamic> json) {
    return VinylRecordTagData(
      tagUid: json['tag_uid'] as String? ?? '',
      itemId: json['item_id'] as String? ?? '',
      provider: json['provider'] as String? ?? '',
      mediaTitle: json['media_title'] as String? ?? 'Unknown Album Title',
      artist: json['artist'] as String? ?? 'Unknown Artist',
      trackList:
          (json['track_list'] as List<dynamic>?)
              ?.map((e) => AlbumTrackList.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      coverImage: json['cover_image'] as String? ?? '',
      labelColor: json['label_color'] as String? ?? '',
      labelImage: json['label_image'] as String? ?? '',
      outerRingColor: json['outer_ring_color'] as String? ?? '',
      outerRingImage: json['outer_ring_image'] as String? ?? '',
      projectionOverlay: json['projection_overlay'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tag_uid': tagUid,
      'item_id': itemId,
      'provider': provider,
      'media_title': mediaTitle,
      'artist': artist,
      'track_list': trackList.map((e) => e.toJson()).toList(),
      'cover_image': coverImage,
      'label_color': labelColor,
      'label_image': labelImage,
      'outer_ring_color': outerRingColor,
      'outer_ring_image': outerRingImage,
      'projection_overlay': projectionOverlay,
    };
  }
}
