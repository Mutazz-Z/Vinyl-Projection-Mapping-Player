import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:web_app/theme/app_theme.dart';
import 'register_screen.dart';
import 'package:web_app/main.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  List<dynamic> _loadedAlbums = [];
  bool _isLoadingLibrary = true;

  @override
  void initState() {
    super.initState();
    _loadLibraryFromServer();
  }

  Future<void> _loadLibraryFromServer() async {
    setState(() => _isLoadingLibrary = true);
    try {
      final http.Response response = await http.get(
        Uri.parse('${systemDataSource.httpBaseUrl}/api/library'),
      );
      if (response.statusCode == 200) {
        setState(() {
          _loadedAlbums = jsonDecode(response.body) as List<dynamic>;
          _isLoadingLibrary = false;
        });
      } else {
        setState(() => _isLoadingLibrary = false);
      }
    } catch (loadError) {
      debugPrint('Failed to load library: $loadError');
      setState(() => _isLoadingLibrary = false);
    }
  }

  Future<void> _deleteAlbumRecord(String nfcUniqueIdentifier) async {
    try {
      final http.Response response = await http.delete(
        Uri.parse(
          '${systemDataSource.httpBaseUrl}/api/library/$nfcUniqueIdentifier',
        ),
      );
      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Record deleted.')));
        }
        _loadLibraryFromServer();
      }
    } catch (deleteError) {
      debugPrint('Failed to delete record: $deleteError');
    }
  }

  void _showDeleteConfirmationDialog({
    required BuildContext context,
    required String nfcUniqueIdentifier,
    required String albumName,
  }) {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete Record?'),
        content: Text(
          'Are you sure you want to delete "$albumName"?\n\nThis action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              _deleteAlbumRecord(nfcUniqueIdentifier);
            },
            child: Text('Delete', style: AppTextStyles.destructiveLabel),
          ),
        ],
      ),
    );
  }

  void _navigateToEditScreen(
    BuildContext context,
    Map<String, dynamic> albumRecord,
  ) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (BuildContext navigationContext) => RegisterScreen(
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
    ).then((_) => _loadLibraryFromServer());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoadingLibrary
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _loadedAlbums.length,
              itemBuilder: (BuildContext listContext, int albumIndex) {
                final Map<String, dynamic> albumRecord =
                    _loadedAlbums[albumIndex] as Map<String, dynamic>;
                return _AlbumListTile(
                  albumRecord: albumRecord,
                  onEdit: () => _navigateToEditScreen(context, albumRecord),
                  onDelete: () => _showDeleteConfirmationDialog(
                    context: context,
                    nfcUniqueIdentifier: albumRecord['uid'] as String,
                    albumName: (albumRecord['album'] as String?) ?? 'Unknown',
                  ),
                );
              },
            ),
    );
  }
}

class _AlbumListTile extends StatelessWidget {
  final Map<String, dynamic> albumRecord;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _AlbumListTile({
    required this.albumRecord,
    required this.onEdit,
    required this.onDelete,
  });

  Widget _buildCoverArtWidget(String coverArtValue) {
    if (coverArtValue.startsWith('data:')) {
      return _buildCoverArtFromBase64DataUri(coverArtValue);
    }
    return _buildCoverArtFromNetworkUrl(coverArtValue);
  }

  Widget _buildCoverArtFromBase64DataUri(String dataUri) {
    final int commaIndex = dataUri.indexOf(',');
    if (commaIndex <= 0 || commaIndex >= dataUri.length - 1) {
      return const Icon(Icons.album);
    }
    try {
      final Uint8List imageBytes = base64Decode(
        dataUri.substring(commaIndex + 1),
      );
      return ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: Image.memory(
          imageBytes,
          width: 48,
          height: 48,
          fit: BoxFit.cover,
        ),
      );
    } catch (_) {
      return const Icon(Icons.album);
    }
  }

  Widget _buildCoverArtFromNetworkUrl(String imageUrl) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: Image.network(
        imageUrl,
        width: 48,
        height: 48,
        fit: BoxFit.cover,
        errorBuilder:
            (BuildContext context, Object error, StackTrace? stackTrace) {
              return const Icon(Icons.album);
            },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final String coverArtValue =
        (albumRecord['album_cover_art'] as String? ?? '').trim();

    return ListTile(
      leading: coverArtValue.isNotEmpty
          ? _buildCoverArtWidget(coverArtValue)
          : const Icon(Icons.album),
      title: Text((albumRecord['album'] as String?) ?? 'Unknown'),
      subtitle: Text((albumRecord['artist'] as String?) ?? 'Unknown'),
      onTap: onEdit,
      trailing: PopupMenuButton<String>(
        onSelected: (String selectedAction) {
          if (selectedAction == 'edit') {
            onEdit();
          } else if (selectedAction == 'delete') {
            onDelete();
          }
        },
        itemBuilder: (BuildContext menuContext) => [
          const PopupMenuItem(
            value: 'edit',
            child: Row(
              children: [
                Icon(Icons.edit, size: 18),
                SizedBox(width: AppSpacing.inlineElementGap),
                Text('Edit'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'delete',
            child: Row(
              children: [
                const Icon(
                  Icons.delete,
                  size: 18,
                  color: AppColors.destructiveRed,
                ),
                const SizedBox(width: AppSpacing.inlineElementGap),
                Text('Delete', style: AppTextStyles.destructiveLabel),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
