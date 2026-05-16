import 'map_extensions.dart';

class MetadataExtractor {
  static Map<String, String> extractFromBrowseResponse(dynamic responseBody, String? mediaType) {
    final containers = _collectMaps(responseBody).where((m) => m.getList('children')?.isNotEmpty == true).toList();
    if (containers.isEmpty) return {};

    Map<String, dynamic>? bestContainer;
    int bestScore = -1;

    for (final container in containers) {
      final containerType = container.getFirstString(['media_class', 'media_content_type', 'type'])?.toLowerCase();
      final contentId = container.getFirstString(['media_content_id', 'uri']) ?? '';

      int score = 0;
      if (mediaType != null && containerType == mediaType) score += 8;
      if (mediaType != null && contentId.contains('://$mediaType/')) score += 6;
      if (container.getFirstString(['title', 'name']) != null) score += 2;
      
      score += (container.getList('children')?.length ?? 0) > 1 ? 3 : 1;

      if (score > bestScore) {
        bestContainer = container;
        bestScore = score;
      }
    }

    if (bestContainer == null) return {};

    final String albumTitle = bestContainer.getFirstString(['title', 'name']) ?? '';
    final String coverArt = bestContainer.getFirstString([
      'thumbnail', 
      'entity_picture', 
      'media_image_url', 
      'image_url'
    ]) ?? '';

    final List<dynamic> children = bestContainer.getList('children') ?? const [];
    final List<String> trackTitles = [];
    String fallbackArtist = '';

    for (final child in children) {
      if (child is Map<String, dynamic>) {
        final String? trackTitle = child.getFirstString(['title', 'name', 'media_title']);
        if (trackTitle != null && trackTitle.trim().isNotEmpty) {
          trackTitles.add(trackTitle.trim());
        }

        if (fallbackArtist.isEmpty) {
          fallbackArtist = child.getFirstString(['media_artist', 'artist']) ?? '';
        }
      }
    }

    final String artistName = bestContainer.getFirstString(['artist', 'media_artist']) ?? fallbackArtist;

    final String tracksText = trackTitles.join('\n');

    return {
      'artist': artistName.trim(),
      'album': albumTitle.trim(),
      'tracks': tracksText,
      'album_cover_art': coverArt.trim(),
    };
  }

  static Map<String, String> extractFromPlayerState(dynamic stateBody) {
    if (stateBody is! Map<String, dynamic>) return {};
    
    final attributes = stateBody.getMap('attributes');
    if (attributes == null) return {};

    final artist = attributes.getFirstString(['media_artist', 'artist']) ?? '';
    final album = attributes.getFirstString(['media_album_name', 'album', 'media_title']) ?? '';
    final track = attributes.getFirstString(['media_title', 'title']) ?? '';
    final coverArt = attributes.getFirstString([
      'entity_picture', 'entity_picture_local', 'media_image_url', 
      'media_image_remotely_accessible_url', 'image_url', 'thumbnail'
    ]) ?? '';

    if (artist.isEmpty && album.isEmpty && track.isEmpty && coverArt.isEmpty) return {};

    return {
      'artist': artist,
      'album': album,
      'tracks': track,
      'album_cover_art': coverArt,
    };
  }

  static Iterable<Map<String, dynamic>> _collectMaps(dynamic value) sync* {
    if (value is Map<String, dynamic>) {
      yield value;
      for (final nested in value.values) {
        yield* _collectMaps(nested);
      }
    } else if (value is List) {
      for (final nested in value) {
        yield* _collectMaps(nested);
      }
    }
  }
}