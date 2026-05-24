import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
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
        Uri.parse('${systemDataSource.httpBaseUrl}/api/library'),
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
        final String title = ((album as Map)['album'] as String? ?? '')
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
          uid: albumRecord['uid'] as String,
          initialArtist: albumRecord['artist'] as String?,
          initialAlbum: albumRecord['album'] as String?,
          initialTracks: albumRecord['tracks'] as String?,
          initialUri: albumRecord['media_uri'] as String?,
          initialInnerRecordColor: albumRecord['inner_record_color'] as String?,
          initialInnerRecordImage: albumRecord['inner_record_image'] as String?,
          initialOuterDesignColor: albumRecord['outer_design_color'] as String?,
          initialOuterDesignImage: albumRecord['outer_design_image'] as String?,
          initialOverlayArt: albumRecord['overlay_art'] as String?,
          initialAlbumCoverArt: albumRecord['album_cover_art'] as String?,
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
                                        (albumRecord['album'] as String?) ??
                                        'Unknown',
                                    coverArt:
                                        (albumRecord['album_cover_art']
                                            as String?) ??
                                        '',
                                    outerColor: _parseHexColor(
                                      albumRecord['outer_design_color']
                                          as String?,
                                      const Color(0xFF111111),
                                    ),
                                    innerColor: _parseHexColor(
                                      albumRecord['inner_record_color']
                                          as String?,
                                      AppColors.porcelain,
                                    ),
                                    outerImage:
                                        (albumRecord['outer_design_image']
                                            as String?) ??
                                        '',
                                    innerImage:
                                        (albumRecord['inner_record_image']
                                            as String?) ??
                                        '',
                                    overlayArt:
                                        (albumRecord['overlay_art']
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
