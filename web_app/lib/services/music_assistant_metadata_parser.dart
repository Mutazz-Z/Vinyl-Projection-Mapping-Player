class MusicAssistantMetadataParser {
  static Map<String, String> extractFromBrowseResponse({
    required dynamic responseBody,
    required String? mediaType,
  }) {
    final List<Map<String, dynamic>> containers = <Map<String, dynamic>>[];

    for (final Map<String, dynamic> map in _collectMaps(responseBody)) {
      if (map['children'] is List && (map['children'] as List).isNotEmpty) {
        containers.add(map);
      }
    }

    if (containers.isEmpty) {
      return <String, String>{};
    }

    Map<String, dynamic>? bestContainer;
    int bestScore = -1;

    for (final Map<String, dynamic> container in containers) {
      final String? containerType = _firstNonEmpty(<String?>[
        _asString(container['media_class']),
        _asString(container['media_content_type']),
        _asString(container['type']),
      ])?.toLowerCase();

      final String contentId =
          _firstNonEmpty(<String?>[
            _asString(container['media_content_id']),
            _asString(container['uri']),
          ]) ??
          '';

      int score = 0;
      if (mediaType != null && containerType == mediaType) {
        score += 8;
      }
      if (mediaType != null && contentId.contains('://$mediaType/')) {
        score += 6;
      }
      if (_firstNonEmpty(<String?>[
            _asString(container['title']),
            _asString(container['name']),
          ]) !=
          null) {
        score += 2;
      }

      final List children = container['children'] as List;
      if (children.length > 1) {
        score += 3;
      } else {
        score += 1;
      }

      if (score > bestScore) {
        bestContainer = container;
        bestScore = score;
      }
    }

    if (bestContainer == null) {
      return <String, String>{};
    }

    final List children = bestContainer['children'] as List;
    final List<String> trackNames = <String>[];
    final Map<String, int> artistCounts = <String, int>{};
    final Map<String, int> albumCounts = <String, int>{};

    for (final dynamic child in children) {
      if (child is! Map<String, dynamic>) {
        continue;
      }

      final String? trackTitle = _firstNonEmpty(<String?>[
        _asString(child['title']),
        _asString(child['name']),
        _asString(child['media_title']),
      ]);

      final String? childArtist = _firstNonEmpty(<String?>[
        _extractArtistName(child['artist']),
        _extractArtistFromList(child['artists']),
        _asString(child['artist_name']),
        _asString(child['artist_str']),
        _asString(child['media_artist']),
        _artistFromDisplayLabel(trackTitle),
      ]);
      if (childArtist != null && childArtist.isNotEmpty) {
        artistCounts.update(
          childArtist,
          (int count) => count + 1,
          ifAbsent: () => 1,
        );
      }

      if (trackTitle != null && trackTitle.isNotEmpty) {
        trackNames.add(_stripArtistPrefixFromTrack(trackTitle, childArtist));
      }

      final String? childAlbum = _firstNonEmpty(<String?>[
        _extractAlbumTitle(child['album']),
        _asString(child['album_name']),
        _asString(child['media_album_name']),
      ]);
      if (childAlbum != null && childAlbum.isNotEmpty) {
        albumCounts.update(
          childAlbum,
          (int count) => count + 1,
          ifAbsent: () => 1,
        );
      }
    }

    final String containerTitle =
        _firstNonEmpty(<String?>[
          _asString(bestContainer['title']),
          _asString(bestContainer['name']),
        ]) ??
        '';
    final String containerArtist =
        _firstNonEmpty(<String?>[
          _extractArtistName(bestContainer['artist']),
          _extractArtistFromList(bestContainer['artists']),
          _asString(bestContainer['artist_name']),
          _asString(bestContainer['artist_str']),
          _asString(bestContainer['media_artist']),
          _artistFromDisplayLabel(containerTitle),
        ]) ??
        '';

    String album =
        _firstNonEmpty(<String?>[
          _mostFrequentValue(albumCounts),
          _asString(bestContainer['media_album_name']),
          _asString(bestContainer['album_name']),
          _looksLikeTrackTitle(containerTitle) ? null : containerTitle,
        ]) ??
        '';

    final String albumCoverArt =
        _firstNonEmpty(<String?>[
          _extractCoverArt(bestContainer),
          for (final dynamic child in children)
            if (child is Map<String, dynamic>) _extractCoverArt(child),
        ]) ??
        '';

    String artist =
        _firstNonEmpty(<String?>[
          _mostFrequentValue(artistCounts),
          containerArtist,
        ]) ??
        '';

    final List<String> cleanedTrackNames = trackNames
        .map((String track) => _stripArtistPrefixFromTrack(track, artist))
        .where((String track) => track.trim().isNotEmpty)
        .toList(growable: false);

    final String tracks = cleanedTrackNames.toSet().join('\n');

    if (mediaType == 'album' &&
        album.isEmpty &&
        _looksLikeTrackTitle(containerTitle)) {
      album = '';
      if (artist.isEmpty) {
        artist = _artistFromDisplayLabel(containerTitle) ?? '';
      }
    }

    if (artist.isEmpty && album.isEmpty && tracks.isEmpty) {
      return <String, String>{};
    }

    return <String, String>{
      'artist': artist,
      'album': album,
      'tracks': tracks,
      'album_cover_art': albumCoverArt,
    };
  }

  static Map<String, String> extractFromUnknownResponse(dynamic response) {
    String bestArtist = '';
    int bestArtistScore = -1;
    String bestAlbum = '';
    int bestAlbumScore = -1;
    String bestTracks = '';
    int bestTracksScore = -1;
    String bestAlbumCoverArt = '';
    int bestAlbumCoverArtScore = -1;

    for (final Map<String, dynamic> candidateMap in _collectMaps(response)) {
      final String? artistName = _firstNonEmpty(<String?>[
        _extractArtistName(candidateMap['artist']),
        _asString(candidateMap['artist_name']),
        _asString(candidateMap['artist_str']),
        _asString(candidateMap['media_artist']),
        _extractArtistFromList(candidateMap['artists']),
      ]);

      final String? albumTitle = _firstNonEmpty(<String?>[
        _extractAlbumTitle(candidateMap['album']),
        _asString(candidateMap['album_name']),
        _asString(candidateMap['media_album_name']),
        _asString(candidateMap['album_title']),
        _asString(candidateMap['name']),
        _asString(candidateMap['title']),
      ]);

      final String tracks = _extractTracks(candidateMap);
      final String? coverArt = _extractCoverArt(candidateMap);

      final bool hasTrackLikeSignals =
          candidateMap.containsKey('tracks') ||
          candidateMap.containsKey('track') ||
          candidateMap.containsKey('media_title');
      final bool isAlbumLikeCandidate =
          candidateMap.containsKey('albums') ||
          candidateMap.containsKey('album') ||
          (candidateMap['media_type']?.toString().toLowerCase() == 'album') ||
          (candidateMap['type']?.toString().toLowerCase() == 'album');

      final int artistScore = _artistCandidateScore(candidateMap, artistName);
      if ((artistName ?? '').isNotEmpty && artistScore > bestArtistScore) {
        bestArtist = artistName!;
        bestArtistScore = artistScore;
      }

      final int albumScore = _albumCandidateScore(candidateMap, albumTitle);
      if ((albumTitle ?? '').isNotEmpty && albumScore > bestAlbumScore) {
        bestAlbum = albumTitle!;
        bestAlbumScore = albumScore;
      }

      final int tracksScore = _tracksCandidateScore(
        candidateMap,
        tracks,
        allowNameFallback: !isAlbumLikeCandidate || hasTrackLikeSignals,
      );
      if (tracks.isNotEmpty && tracksScore > bestTracksScore) {
        bestTracks = tracks;
        bestTracksScore = tracksScore;
      }

      final int coverScore = _coverCandidateScore(candidateMap, coverArt);
      if ((coverArt ?? '').isNotEmpty && coverScore > bestAlbumCoverArtScore) {
        bestAlbumCoverArt = coverArt!;
        bestAlbumCoverArtScore = coverScore;
      }
    }

    if (bestArtist.isEmpty &&
        bestAlbum.isEmpty &&
        bestTracks.isEmpty &&
        bestAlbumCoverArt.isEmpty) {
      return <String, String>{};
    }

    return <String, String>{
      'artist': bestArtist,
      'album': bestAlbum,
      'tracks': bestTracks,
      'album_cover_art': bestAlbumCoverArt,
    };
  }

  static Map<String, String> extractFromPlayerState(dynamic stateBody) {
    if (stateBody is! Map<String, dynamic>) {
      return <String, String>{};
    }

    final dynamic attributesDynamic = stateBody['attributes'];
    if (attributesDynamic is! Map<String, dynamic>) {
      return <String, String>{};
    }

    final String artist =
        _firstNonEmpty(<String?>[
          _asString(attributesDynamic['media_artist']),
          _asString(attributesDynamic['artist']),
        ]) ??
        '';

    final String album =
        _firstNonEmpty(<String?>[
          _asString(attributesDynamic['media_album_name']),
          _asString(attributesDynamic['album']),
          _asString(attributesDynamic['media_title']),
        ]) ??
        '';

    final String track =
        _firstNonEmpty(<String?>[
          _asString(attributesDynamic['media_title']),
          _asString(attributesDynamic['title']),
        ]) ??
        '';

    final String albumCoverArt =
        _firstNonEmpty(<String?>[
          _asString(attributesDynamic['entity_picture']),
          _asString(attributesDynamic['entity_picture_local']),
          _asString(attributesDynamic['media_image_url']),
          _asString(attributesDynamic['media_image_remotely_accessible_url']),
          _asString(attributesDynamic['image_url']),
          _asString(attributesDynamic['thumbnail']),
        ]) ??
        '';

    if (artist.isEmpty && album.isEmpty && track.isEmpty && albumCoverArt.isEmpty) {
      return <String, String>{};
    }

    return <String, String>{
      'artist': artist,
      'album': album,
      'tracks': track,
      'album_cover_art': albumCoverArt,
    };
  }

  static bool isCompleteAlbumMetadata(Map<String, String> metadata) {
    final String artist = (metadata['artist'] ?? '').trim();
    final String album = (metadata['album'] ?? '').trim();
    final String tracks = (metadata['tracks'] ?? '').trim();

    if (artist.isEmpty || album.isEmpty || tracks.isEmpty) {
      return false;
    }

    if (_looksLikeTrackTitle(album)) {
      return false;
    }

    return true;
  }

  static Map<String, String> mergeMetadata({
    required Map<String, String> primary,
    required Map<String, String> secondary,
  }) {
    final String primaryArtist = (primary['artist'] ?? '').trim();
    final String primaryAlbum = (primary['album'] ?? '').trim();
    final String primaryTracks = (primary['tracks'] ?? '').trim();

    final String secondaryArtist = (secondary['artist'] ?? '').trim();
    final String secondaryAlbum = (secondary['album'] ?? '').trim();
    final String secondaryTracks = (secondary['tracks'] ?? '').trim();
    final String primaryCoverArt = (primary['album_cover_art'] ?? '').trim();
    final String secondaryCoverArt = (secondary['album_cover_art'] ?? '').trim();

    final String mergedArtist = primaryArtist.isNotEmpty
        ? primaryArtist
        : secondaryArtist;

    String mergedAlbum = primaryAlbum;
    if (mergedAlbum.isEmpty || _looksLikeTrackTitle(mergedAlbum)) {
      mergedAlbum = secondaryAlbum;
    }

    String mergedTracks = primaryTracks;
    if (mergedTracks.isEmpty ||
        _lineCount(secondaryTracks) > _lineCount(mergedTracks)) {
      mergedTracks = secondaryTracks;
    }

    return <String, String>{
      'artist': mergedArtist,
      'album': mergedAlbum,
      'tracks': mergedTracks,
      'album_cover_art': primaryCoverArt.isNotEmpty
          ? primaryCoverArt
          : secondaryCoverArt,
    };
  }

  static int _coverCandidateScore(
    Map<String, dynamic> candidateMap,
    String? coverArt,
  ) {
    if ((coverArt ?? '').trim().isEmpty) {
      return -1;
    }

    int score = coverArt!.length;
    if (candidateMap.containsKey('album') ||
        candidateMap.containsKey('album_name') ||
        candidateMap.containsKey('media_album_name')) {
      score += 4;
    }
    if (candidateMap.containsKey('artist') || candidateMap.containsKey('artists')) {
      score += 2;
    }
    return score;
  }

  static String? _extractCoverArt(Map<String, dynamic> candidateMap) {
    final String? direct = _firstNonEmpty(<String?>[
      _asString(candidateMap['album_cover_art']),
      _asString(candidateMap['media_image_url']),
      _asString(candidateMap['media_image_remotely_accessible_url']),
      _asString(candidateMap['image_url']),
      _asString(candidateMap['thumbnail']),
      _asString(candidateMap['image']),
      _asString(candidateMap['artwork']),
      _asString(candidateMap['cover']),
      _asString(candidateMap['entity_picture']),
    ]);
    if (direct != null) {
      return direct;
    }

    final dynamic albumDynamic = candidateMap['album'];
    if (albumDynamic is Map<String, dynamic>) {
      final String? fromAlbum = _firstNonEmpty(<String?>[
        _asString(albumDynamic['image']),
        _asString(albumDynamic['thumbnail']),
        _asString(albumDynamic['cover']),
        _asString(albumDynamic['album_cover_art']),
        _asString(albumDynamic['media_image_url']),
      ]);
      if (fromAlbum != null) {
        return fromAlbum;
      }
    }

    final dynamic metadataDynamic = candidateMap['metadata'];
    if (metadataDynamic is Map<String, dynamic>) {
      return _firstNonEmpty(<String?>[
        _asString(metadataDynamic['image']),
        _asString(metadataDynamic['thumbnail']),
        _asString(metadataDynamic['cover']),
      ]);
    }

    return null;
  }

  static String? _mostFrequentValue(Map<String, int> counts) {
    if (counts.isEmpty) {
      return null;
    }

    String? bestValue;
    int bestCount = -1;
    counts.forEach((String value, int count) {
      if (count > bestCount) {
        bestValue = value;
        bestCount = count;
      }
    });
    return bestValue;
  }

  static String? _artistFromDisplayLabel(String? value) {
    if (value == null) {
      return null;
    }
    final List<String> split = value.split(' - ');
    if (split.length < 2) {
      return null;
    }
    final String artist = split.first.trim();
    return artist.isEmpty ? null : artist;
  }

  static String _stripArtistPrefixFromTrack(String track, String? artist) {
    final String trimmedTrack = track.trim();
    final String trimmedArtist = (artist ?? '').trim();
    if (trimmedTrack.isEmpty || trimmedArtist.isEmpty) {
      return trimmedTrack;
    }

    final List<String> separators = <String>[' - ', ' – ', ' — ', ': '];
    for (final String separator in separators) {
      final String prefix = '$trimmedArtist$separator';
      if (trimmedTrack.toLowerCase().startsWith(prefix.toLowerCase())) {
        return trimmedTrack.substring(prefix.length).trim();
      }
    }

    return trimmedTrack;
  }

  static int _lineCount(String value) {
    final String trimmed = value.trim();
    if (trimmed.isEmpty) {
      return 0;
    }
    return trimmed.split('\n').length;
  }

  static int _artistCandidateScore(
    Map<String, dynamic> candidateMap,
    String? artist,
  ) {
    if ((artist ?? '').trim().isEmpty) {
      return -1;
    }

    int score = artist!.length;
    if (candidateMap['artist'] is Map<String, dynamic>) {
      score += 6;
    }
    if (candidateMap['artists'] is List) {
      score += 5;
    }
    if (candidateMap.containsKey('album') ||
        candidateMap.containsKey('title')) {
      score += 2;
    }
    return score;
  }

  static int _albumCandidateScore(
    Map<String, dynamic> candidateMap,
    String? album,
  ) {
    if ((album ?? '').trim().isEmpty) {
      return -1;
    }

    int score = album!.length;
    if (candidateMap['album'] is Map<String, dynamic>) {
      score += 8;
    }
    if (candidateMap.containsKey('artists') ||
        candidateMap.containsKey('artist')) {
      score += 2;
    }
    if (_looksLikeTrackTitle(album)) {
      score -= 10;
    }
    return score;
  }

  static int _tracksCandidateScore(
    Map<String, dynamic> candidateMap,
    String tracks, {
    required bool allowNameFallback,
  }) {
    if (tracks.trim().isEmpty) {
      return -1;
    }

    final bool isNameOnlyTrackFallback =
        _asString(candidateMap['tracks']) == null &&
        _asString(candidateMap['track']) == null &&
        _asString(candidateMap['media_title']) == null &&
        _asString(candidateMap['title']) == null &&
        _asString(candidateMap['name']) != null;

    if (!allowNameFallback && isNameOnlyTrackFallback) {
      return -1;
    }

    int score = tracks.length;
    if (candidateMap['tracks'] is List) {
      score += 8;
    }
    if (candidateMap.containsKey('track') ||
        candidateMap.containsKey('media_title') ||
        candidateMap.containsKey('title') ||
        candidateMap.containsKey('name')) {
      score += 3;
    }
    return score;
  }

  static bool _looksLikeTrackTitle(String value) {
    final String normalized = value.trim().toLowerCase();
    if (normalized.isEmpty) {
      return false;
    }

    return normalized.contains('(') ||
        normalized.contains('feat.') ||
        normalized.contains(' ft.') ||
        normalized.contains(' remix');
  }

  static Iterable<Map<String, dynamic>> _collectMaps(dynamic value) sync* {
    if (value is Map<String, dynamic>) {
      yield value;
      for (final dynamic nestedValue in value.values) {
        yield* _collectMaps(nestedValue);
      }
    } else if (value is List) {
      for (final dynamic nestedValue in value) {
        yield* _collectMaps(nestedValue);
      }
    }
  }

  static String _extractTracks(Map<String, dynamic> candidateMap) {
    final dynamic tracksDynamic = candidateMap['tracks'];
    if (tracksDynamic is List) {
      return tracksDynamic
          .map((dynamic trackEntry) {
            if (trackEntry is Map<String, dynamic>) {
              return _firstNonEmpty(<String?>[
                    _asString(trackEntry['name']),
                    _asString(trackEntry['title']),
                  ]) ??
                  '';
            }
            return _asString(trackEntry) ?? '';
          })
          .where((String trackName) => trackName.isNotEmpty)
          .join('\n');
    }

    if (tracksDynamic is Map<String, dynamic>) {
      final dynamic items = tracksDynamic['items'] ?? tracksDynamic['results'];
      if (items is List) {
        return items
            .map((dynamic entry) {
              if (entry is Map<String, dynamic>) {
                return _firstNonEmpty(<String?>[
                      _asString(entry['name']),
                      _asString(entry['title']),
                    ]) ??
                    '';
              }
              return _asString(entry) ?? '';
            })
            .where((String trackName) => trackName.isNotEmpty)
            .join('\n');
      }
    }

    final dynamic trackItemsDynamic = candidateMap['track_items'];
    if (trackItemsDynamic is List) {
      return trackItemsDynamic
          .map((dynamic trackEntry) {
            if (trackEntry is Map<String, dynamic>) {
              return _firstNonEmpty(<String?>[
                    _asString(trackEntry['name']),
                    _asString(trackEntry['title']),
                  ]) ??
                  '';
            }
            return _asString(trackEntry) ?? '';
          })
          .where((String trackName) => trackName.isNotEmpty)
          .join('\n');
    }

    return _firstNonEmpty(<String?>[
          _asString(candidateMap['track_name']),
          _asString(candidateMap['name']),
          _asString(candidateMap['track']),
          _asString(candidateMap['media_title']),
          _asString(candidateMap['title']),
        ]) ??
        '';
  }

  static String? _extractAlbumTitle(dynamic albumDynamic) {
    if (albumDynamic is Map<String, dynamic>) {
      return _firstNonEmpty(<String?>[
        _asString(albumDynamic['name']),
        _asString(albumDynamic['title']),
        _asString(albumDynamic['album_name']),
        _asString(albumDynamic['sort_name']),
      ]);
    }
    return _asString(albumDynamic);
  }

  static String? _extractArtistName(dynamic artistDynamic) {
    if (artistDynamic is Map<String, dynamic>) {
      return _firstNonEmpty(<String?>[
        _asString(artistDynamic['name']),
        _asString(artistDynamic['artist_name']),
        _asString(artistDynamic['sort_name']),
      ]);
    }
    return _asString(artistDynamic);
  }

  static String? _extractArtistFromList(dynamic artistsDynamic) {
    if (artistsDynamic is List && artistsDynamic.isNotEmpty) {
      final dynamic firstArtist = artistsDynamic.first;
      if (firstArtist is Map<String, dynamic>) {
        return _firstNonEmpty(<String?>[
          _asString(firstArtist['name']),
          _asString(firstArtist['artist_name']),
          _asString(firstArtist['sort_name']),
        ]);
      }
      return _asString(firstArtist);
    }
    return null;
  }

  static String? _asString(dynamic value) {
    if (value == null) {
      return null;
    }
    if (value is String) {
      final String trimmedValue = value.trim();
      return trimmedValue.isEmpty ? null : trimmedValue;
    }
    final String valueAsString = value.toString().trim();
    return valueAsString.isEmpty ? null : valueAsString;
  }

  static String? _firstNonEmpty(List<String?> values) {
    for (final String? value in values) {
      if (value != null && value.isNotEmpty) {
        return value;
      }
    }
    return null;
  }
}
