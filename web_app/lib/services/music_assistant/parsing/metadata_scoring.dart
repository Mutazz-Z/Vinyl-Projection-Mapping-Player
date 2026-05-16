class MetadataScorer {
  static int scoreArtist(Map<String, dynamic> candidateMap, String? artist) {
    if ((artist ?? '').trim().isEmpty) return -1;

    int score = artist!.length;
    if (candidateMap['artist'] is Map<String, dynamic>) score += 6;
    if (candidateMap['artists'] is List) score += 5;
    if (candidateMap.containsKey('album') || candidateMap.containsKey('title')) score += 2;
    return score;
  }

  static int scoreAlbum(Map<String, dynamic> candidateMap, String? album) {
    if ((album ?? '').trim().isEmpty) return -1;

    int score = album!.length;
    if (candidateMap['album'] is Map<String, dynamic>) score += 8;
    if (candidateMap.containsKey('artists') || candidateMap.containsKey('artist')) score += 2;
    if (looksLikeTrackTitle(album)) score -= 10;
    return score;
  }

  static int scoreTracks(Map<String, dynamic> candidateMap, String tracks, {required bool allowNameFallback}) {
    if (tracks.trim().isEmpty) return -1;

    final bool isNameOnlyFallback = !candidateMap.containsKey('tracks') &&
        !candidateMap.containsKey('track') &&
        !candidateMap.containsKey('media_title') &&
        !candidateMap.containsKey('title') &&
        candidateMap.containsKey('name');

    if (!allowNameFallback && isNameOnlyFallback) return -1;

    int score = tracks.length;
    if (candidateMap['tracks'] is List) score += 8;
    if (candidateMap.containsKey('track') || candidateMap.containsKey('media_title') || candidateMap.containsKey('title') || candidateMap.containsKey('name')) {
      score += 3;
    }
    return score;
  }

  static int scoreCover(Map<String, dynamic> candidateMap, String? coverArt) {
    if ((coverArt ?? '').trim().isEmpty) return -1;

    int score = coverArt!.length;
    if (candidateMap.containsKey('album') || candidateMap.containsKey('album_name') || candidateMap.containsKey('media_album_name')) {
      score += 4;
    }
    if (candidateMap.containsKey('artist') || candidateMap.containsKey('artists')) score += 2;
    return score;
  }

  static bool looksLikeTrackTitle(String value) {
    final normalized = value.trim().toLowerCase();
    if (normalized.isEmpty) return false;
    return normalized.contains('(') || normalized.contains('feat.') || normalized.contains(' ft.') || normalized.contains(' remix');
  }
}