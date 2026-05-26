import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:web_app/factories/album_tracklist.dart';
import 'package:web_app/main.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:web_app/widgets/new_widgets/text_field.dart';
import 'package:web_app/widgets/new_widgets/vinyl_card.dart';
import 'register_screen.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  List<dynamic> _allAlbums = [];
  List<dynamic> _filteredAlbums = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchLibrary();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchLibrary() async {
    setState(() => _isLoading = true);
    try {
      final http.Response response = await http.get(
        Uri.parse('${systemDataSource.httpBaseUrl}/api/library/savedTags'),
      );
      if (response.statusCode == 200) {
        final dynamic decodedData = jsonDecode(response.body);
        setState(() {
          _allAlbums = decodedData as List<dynamic>;
          _filteredAlbums = _allAlbums;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (fetchError) {
      debugPrint('Failed to load library: $fetchError');
      setState(() => _isLoading = false);
    }
  }

  void _onSearchChanged() {
    final String searchQuery = _searchController.text.toLowerCase();
    setState(() {
      _filteredAlbums = _allAlbums.where((dynamic album) {
        final String title = ((album as Map)['media_title'] as String? ?? '')
            .toLowerCase();
        final String artist = (album['artist'] as String? ?? '').toLowerCase();
        return title.contains(searchQuery) || artist.contains(searchQuery);
      }).toList();
    });
  }

  void _navigateToEditScreen(Map<String, dynamic> albumRecord) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => RegisterScreen(
          uid: albumRecord['tag_uid'] as String,
          initialArtist: albumRecord['artist'] as String?,
          initialAlbum: albumRecord['media_title'] as String?,
          initialTracks: (albumRecord['track_list'] as List<dynamic>?)
              ?.map(
                (track) =>
                    AlbumTrackList.fromJson(track as Map<String, dynamic>),
              )
              .toList(),
          itemId: albumRecord['item_id'] as String?,
          provider: albumRecord['provider'] as String?,
          initialInnerRecordColor: albumRecord['label_color'] as String?,
          initialInnerRecordImage: albumRecord['label_image'] as String?,
          initialOuterDesignColor: albumRecord['outer_ring_color'] as String?,
          initialOuterDesignImage: albumRecord['outer_ring_image'] as String?,
          initialOverlayArt: albumRecord['projection_overlay'] as String?,
          initialAlbumCoverArt: albumRecord['cover_image'] as String?,
        ),
      ),
    ).then((_) => _fetchLibrary());
  }

  Color _parseHexColor(String? hexValue, Color fallbackColor) {
    if (hexValue == null || hexValue.isEmpty) return fallbackColor;
    try {
      return Color(int.parse(hexValue.replaceFirst('#', '0xFF')));
    } catch (_) {
      return fallbackColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.balticBlue,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 48.0,
              vertical: 32.0,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: PillTextField(
                controller: _searchController,
                hintText: 'Search',
                prefixIcon: Icons.search,
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.porcelain,
                    ),
                  )
                : LayoutBuilder(
                    builder:
                        (
                          BuildContext layoutContext,
                          BoxConstraints constraints,
                        ) {
                          const double cardTargetWidth = 220.0;
                          const double cardGap = 32.0;
                          final int columnCount =
                              (constraints.maxWidth /
                                      (cardTargetWidth + cardGap))
                                  .floor()
                                  .clamp(1, 6);

                          return GridView.builder(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 48.0,
                              vertical: 16.0,
                            ),
                            gridDelegate:
                                SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: columnCount,
                                  mainAxisSpacing: 32,
                                  crossAxisSpacing: 32,
                                  childAspectRatio: 1.1,
                                ),
                            itemCount: _filteredAlbums.length,
                            itemBuilder:
                                (BuildContext gridContext, int albumIndex) {
                                  final Map<String, dynamic> albumRecord =
                                      _filteredAlbums[albumIndex]
                                          as Map<String, dynamic>;
                                  return VinylCard(
                                    albumName:
                                        (albumRecord['media_title']
                                            as String?) ??
                                        'Unknown',
                                    coverArt:
                                        (albumRecord['cover_image']
                                            as String?) ??
                                        '',
                                    outerColor: _parseHexColor(
                                      albumRecord['outer_ring_color']
                                          as String?,
                                      const Color(0xFF111111),
                                    ),
                                    innerColor: _parseHexColor(
                                      albumRecord['label_color'] as String?,
                                      AppColors.porcelain,
                                    ),
                                    outerImage:
                                        (albumRecord['outer_ring_image']
                                            as String?) ??
                                        '',
                                    innerImage:
                                        (albumRecord['label_image']
                                            as String?) ??
                                        '',
                                    overlayArt:
                                        (albumRecord['projection_overlay']
                                            as String?) ??
                                        '',
                                    onTap: () =>
                                        _navigateToEditScreen(albumRecord),
                                  );
                                },
                          );
                        },
                  ),
          ),
        ],
      ),
    );
  }
}
