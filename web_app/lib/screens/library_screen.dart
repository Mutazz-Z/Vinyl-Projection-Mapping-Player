import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:web_app/theme/app_theme.dart';
import 'register_screen.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  List<dynamic> _albums = [];
  bool _isLoading = true;

  String get _orchestratorHost {
    final host = Uri.base.host;
    return (host.isNotEmpty && host != 'localhost') ? host : '127.0.0.1';
  }

  @override
  void initState() {
    super.initState();
    _fetchLibrary();
  }

  Future<void> _fetchLibrary() async {
    setState(() => _isLoading = true);
    try {
      final response = await http.get(
        Uri.parse('http://$_orchestratorHost:8080/api/library'),
      );
      if (response.statusCode == 200) {
        setState(() {
          _albums = jsonDecode(response.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Failed to load library: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteRecord(String uid) async {
    try {
      final response = await http.delete(
        Uri.parse('http://$_orchestratorHost:8080/api/library/$uid'),
      );
      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Record deleted.')));
        }
        _fetchLibrary();
      }
    } catch (e) {
      debugPrint('Failed to delete record: $e');
    }
  }

  void _showDeleteConfirmation({
    required BuildContext context,
    required String uid,
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
              _deleteRecord(uid);
            },
            child: Text('Delete', style: AppTextStyles.destructiveLabel),
          ),
        ],
      ),
    );
  }

  void _navigateToEditScreen(BuildContext context, Map<String, dynamic> album) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (BuildContext navigationContext) => RegisterScreen(
          uid: album['uid'],
          initialArtist: album['artist'],
          initialAlbum: album['album'],
          initialTracks: album['tracks'],
          initialUri: album['media_uri'],
          initialInnerRecordColor: album['inner_record_color'],
          initialInnerRecordImage: album['inner_record_image'],
          initialOuterDesignColor: album['outer_design_color'],
          initialOuterDesignImage: album['outer_design_image'],
          initialOverlayArt: album['overlay_art'],
          initialAlbumCoverArt: album['album_cover_art'],
        ),
      ),
    ).then((_) => _fetchLibrary());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _albums.length,
              itemBuilder: (BuildContext listContext, int index) {
                final Map<String, dynamic> album = _albums[index];
                return _AlbumListTile(
                  album: album,
                  onEdit: () => _navigateToEditScreen(context, album),
                  onDelete: () => _showDeleteConfirmation(
                    context: context,
                    uid: album['uid'],
                    albumName: album['album'] ?? 'Unknown',
                  ),
                );
              },
            ),
    );
  }
}

class _AlbumListTile extends StatelessWidget {
  final Map<String, dynamic> album;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _AlbumListTile({
    required this.album,
    required this.onEdit,
    required this.onDelete,
  });

  Widget _buildCoverArt(String coverArt) {
    if (coverArt.startsWith('data:')) {
      final int commaIndex = coverArt.indexOf(',');
      if (commaIndex > 0 && commaIndex < coverArt.length - 1) {
        try {
          final String base64Section = coverArt.substring(commaIndex + 1);
          final Uint8List bytes = base64Decode(base64Section);
          return ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Image.memory(
              bytes,
              width: 48,
              height: 48,
              fit: BoxFit.cover,
            ),
          );
        } catch (_) {
          return const Icon(Icons.album);
        }
      }
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: Image.network(
        coverArt,
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
    final String coverArt = (album['album_cover_art'] ?? '').toString().trim();

    return ListTile(
      leading: coverArt.isNotEmpty
          ? _buildCoverArt(coverArt)
          : const Icon(Icons.album),
      title: Text(album['album'] ?? 'Unknown'),
      subtitle: Text(album['artist'] ?? 'Unknown'),
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
                  color: AppColors.destructive,
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
