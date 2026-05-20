class VinylAlbumRecord {
  final String uid;
  final String artistName;
  final String albumTitle;
  final String trackList;
  final String mediaResourceUri;
  final String innerRecordColor;
  final String innerRecordImage;
  final String outerDesignColor;
  final String outerDesignImage;
  final String overlayArt;
  final String albumCoverArt;

  VinylAlbumRecord({
    this.uid = '',
    this.artistName = '',
    this.albumTitle = '',
    this.trackList = '',
    this.mediaResourceUri = '',
    this.innerRecordColor = '',
    this.innerRecordImage = '',
    this.outerDesignColor = '',
    this.outerDesignImage = '',
    this.overlayArt = '',
    this.albumCoverArt = '',
  });

  factory VinylAlbumRecord.fromJson(Map<String, dynamic> json) {
    return VinylAlbumRecord(
      uid: json['uid']?.toString() ?? '',
      artistName: json['artist']?.toString() ?? '',
      albumTitle: json['album']?.toString() ?? '',
      trackList: json['tracks']?.toString() ?? '',
      mediaResourceUri: json['media_uri']?.toString() ?? '',
      innerRecordColor: json['inner_record_color']?.toString() ?? '',
      innerRecordImage: json['inner_record_image']?.toString() ?? '',
      outerDesignColor: json['outer_design_color']?.toString() ?? '',
      outerDesignImage: json['outer_design_image']?.toString() ?? '',
      overlayArt: json['overlay_art']?.toString() ?? '',
      albumCoverArt: json['album_cover_art']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'artist': artistName,
      'album': albumTitle,
      'tracks': trackList,
      'media_uri': mediaResourceUri,
      'inner_record_color': innerRecordColor,
      'inner_record_image': innerRecordImage,
      'outer_design_color': outerDesignColor,
      'outer_design_image': outerDesignImage,
      'overlay_art': overlayArt,
      'album_cover_art': albumCoverArt,
    };
  }
}
