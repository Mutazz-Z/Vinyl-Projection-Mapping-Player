import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:file_picker/file_picker.dart';
import 'package:web_app/main.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:web_app/services/media_asset_service.dart';
import 'package:web_app/widgets/new_widgets/pill_button.dart';
import 'package:web_app/widgets/projection_preview.dart';
import 'package:web_app/utils/register_utils.dart';
import 'package:web_app/widgets/color_picker_dialog.dart';

class RegisterScreen extends StatefulWidget {
  final String uid;
  final String? initialArtist;
  final String? initialAlbum;
  final String? initialTracks;
  final String? initialUri;
  final String? initialInnerRecordColor;
  final String? initialInnerRecordImage;
  final String? initialOuterDesignColor;
  final String? initialOuterDesignImage;
  final String? initialOverlayArt;
  final String? initialAlbumCoverArt;

  const RegisterScreen({
    super.key,
    required this.uid,
    this.initialArtist,
    this.initialAlbum,
    this.initialTracks,
    this.initialUri,
    this.initialInnerRecordColor,
    this.initialInnerRecordImage,
    this.initialOuterDesignColor,
    this.initialOuterDesignImage,
    this.initialOverlayArt,
    this.initialAlbumCoverArt,
  });

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

enum DesignMode { color, image }

class _RegisterScreenState extends State<RegisterScreen> {
  late final bool _isEditing;
  bool _isSaving = false;

  String _albumName = '';
  String _artistName = '';
  String _trackList = '';
  String _coverArtUrl = '';
  String _mediaUri = '';

  DesignMode _innerMode = DesignMode.color;
  DesignMode _outerMode = DesignMode.color;

  Color _innerColor = AppColors.porcelain;
  Color _outerColor = const Color(0xFF111111);
  String _innerImage = '';
  String _outerImage = '';
  String _overlayArt = '';

  late final TextEditingController _innerColorController;
  late final TextEditingController _outerColorController;

  List<Map<String, dynamic>> _maAlbums = [];

  static const double _columnBreakpoint = 800.0;

  @override
  void initState() {
    super.initState();
    _isEditing =
        widget.initialArtist != null && widget.initialArtist!.isNotEmpty;

    _albumName = widget.initialAlbum ?? '';
    _artistName = widget.initialArtist ?? '';
    _trackList = widget.initialTracks ?? '';
    _mediaUri = widget.initialUri ?? '';
    _coverArtUrl = widget.initialAlbumCoverArt ?? '';

    _innerColor = RegisterUtils.parseHexColor(
      widget.initialInnerRecordColor ?? '#FFFFFF',
    );
    _outerColor = RegisterUtils.parseHexColor(
      widget.initialOuterDesignColor ?? '#111111',
    );
    _innerImage = widget.initialInnerRecordImage ?? '';
    _outerImage = widget.initialOuterDesignImage ?? '';
    _overlayArt = widget.initialOverlayArt ?? '';

    _innerMode = _innerImage.isNotEmpty ? DesignMode.image : DesignMode.color;
    _outerMode = _outerImage.isNotEmpty ? DesignMode.image : DesignMode.color;

    _innerColorController = TextEditingController(
      text: RegisterUtils.toHexColor(_innerColor),
    );
    _outerColorController = TextEditingController(
      text: RegisterUtils.toHexColor(_outerColor),
    );

    _fetchMusicAssistantAlbums();
  }

  @override
  void dispose() {
    _innerColorController.dispose();
    _outerColorController.dispose();
    super.dispose();
  }

  Future<void> _fetchMusicAssistantAlbums() async {
    try {
      final http.Response response = await http.get(
        Uri.parse('${systemDataSource.httpBaseUrl}/api/albums'),
      );
      if (response.statusCode == 200) {
        final dynamic decodedData = jsonDecode(response.body);
        List<dynamic> albumItems = [];
        if (decodedData is Map<String, dynamic> &&
            decodedData.containsKey('items')) {
          albumItems = decodedData['items'] as List<dynamic>;
        } else if (decodedData is List) {
          albumItems = decodedData;
        }
        setState(() {
          _maAlbums = albumItems.whereType<Map<String, dynamic>>().toList();
        });
      }
    } catch (fetchError) {
      debugPrint('Error fetching MA albums: $fetchError');
    }
  }

  void _onAlbumSelected(Map<String, dynamic> selectedAlbum) {
    setState(() {
      _albumName = (selectedAlbum['name'] as String?) ?? '';
      _mediaUri = (selectedAlbum['uri'] as String?) ?? '';
      _artistName = 'Unknown Artist';

      final dynamic artistsList = selectedAlbum['artists'];
      if (artistsList is List && artistsList.isNotEmpty) {
        _artistName = (artistsList[0]['name'] as String?) ?? 'Unknown Artist';
      }

      try {
        final List<dynamic>? imagesList =
            selectedAlbum['metadata']?['images'] as List<dynamic>?;
        if (imagesList != null && imagesList.isNotEmpty) {
          final dynamic firstImage = imagesList[0];
          _coverArtUrl =
              (firstImage['url'] as String?) ??
              (firstImage['path'] as String?) ??
              '';
        }
      } catch (_) {}

      _trackList = '';
      try {
        final dynamic tracksData =
            selectedAlbum['tracks'] ?? selectedAlbum['items'];
        if (tracksData is List && tracksData.isNotEmpty) {
          final List<String> parsedTracks = [];
          for (int i = 0; i < tracksData.length; i++) {
            final track = tracksData[i];
            final String trackName = track is Map
                ? (track['name'] as String? ?? 'Track ${i + 1}')
                : track.toString();
            parsedTracks.add('${i + 1}. $trackName');
          }
          _trackList = parsedTracks.join('\n');
        }
      } catch (e) {
        debugPrint('Could not parse tracks: $e');
      }
    });
  }

  Future<void> _showAssetPickerPopup({
    required String category,
    required void Function(String) onSelect,
  }) async {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: _AssetPickerWidget(category: category, onSelect: onSelect),
      ),
    );
  }

  void _pickInnerColor() {
    showColorPickerDialog(
      context: context,
      title: 'Pick Inner Color',
      controller: _innerColorController,
      onColorApplied: () {
        setState(() {
          _innerMode = DesignMode.color;
          _innerColor = RegisterUtils.parseHexColor(_innerColorController.text);
          _innerImage = '';
        });
      },
    );
  }

  void _pickOuterColor() {
    showColorPickerDialog(
      context: context,
      title: 'Pick Outer Color',
      controller: _outerColorController,
      onColorApplied: () {
        setState(() {
          _outerMode = DesignMode.color;
          _outerColor = RegisterUtils.parseHexColor(_outerColorController.text);
          _outerImage = '';
        });
      },
    );
  }

  Future<void> _saveRecord() async {
    setState(() => _isSaving = true);

    final Map<String, dynamic> recordPayload = {
      'uid': widget.uid,
      'artist': _artistName,
      'album': _albumName,
      'tracks': _trackList,
      'media_uri': _mediaUri,
      'inner_record_color': _innerMode == DesignMode.color
          ? RegisterUtils.toHexColor(_innerColor)
          : '',
      'inner_record_image': _innerMode == DesignMode.image ? _innerImage : '',
      'outer_design_color': _outerMode == DesignMode.color
          ? RegisterUtils.toHexColor(_outerColor)
          : '',
      'outer_design_image': _outerMode == DesignMode.image ? _outerImage : '',
      'overlay_art': _overlayArt,
      'album_cover_art': _coverArtUrl,
    };

    try {
      await http.post(
        Uri.parse('${systemDataSource.httpBaseUrl}/api/library'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(recordPayload),
      );
      if (mounted) Navigator.pop(context);
    } catch (saveError) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $saveError')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF285C83),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (BuildContext layoutContext, BoxConstraints constraints) {
            final bool isWide = constraints.maxWidth >= _columnBreakpoint;
            return isWide ? _buildWideLayout() : _buildNarrowLayout();
          },
        ),
      ),
    );
  }

  Widget _buildWideLayout() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          flex: 4,
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: _buildSettingsCard(),
          ),
        ),
        Expanded(
          flex: 6,
          child: Padding(
            padding: const EdgeInsets.only(
              right: 32.0,
              top: 32.0,
              bottom: 32.0,
            ),
            child: Center(child: _buildPreview()),
          ),
        ),
      ],
    );
  }

  Widget _buildNarrowLayout() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            _buildSettingsCard(),
            const SizedBox(height: 32),
            _buildPreview(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildPreview() {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 600, maxHeight: 600),
      child: AspectRatio(
        aspectRatio: 1.0,
        child: ProjectionPreview(
          outerColor: _outerColor,
          innerColor: _innerColor,
          outerImage: _outerImage,
          innerImage: _innerImage,
          coverArt: _coverArtUrl,
          overlayArt: _overlayArt,
        ),
      ),
    );
  }

  Widget _buildSettingsCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.porcelain,
        borderRadius: BorderRadius.circular(24.0),
      ),
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios,
                  color: AppColors.shadowGrey,
                ),
                onPressed: () => Navigator.pop(context),
              ),
              Flexible(
                child: Text(
                  'UID: ${widget.uid}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.shadowGrey,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          Autocomplete<Map<String, dynamic>>(
            displayStringForOption: (Map<String, dynamic> option) {
              final String title =
                  (option['name'] as String?) ?? 'Unknown Album';
              String artist = 'Unknown Artist';
              final dynamic artistsList = option['artists'];
              if (artistsList is List && artistsList.isNotEmpty) {
                artist =
                    (artistsList[0]['name'] as String?) ?? 'Unknown Artist';
              }
              return '$title — $artist';
            },
            optionsBuilder: (TextEditingValue textEditingValue) {
              if (textEditingValue.text.isEmpty) {
                return const Iterable<Map<String, dynamic>>.empty();
              }
              final String query = textEditingValue.text.toLowerCase();
              return _maAlbums
                  .where((Map<String, dynamic> album) {
                    final String title = ((album['name'] as String?) ?? '')
                        .toLowerCase();
                    String artist = '';
                    final dynamic artistsList = album['artists'];
                    if (artistsList is List && artistsList.isNotEmpty) {
                      artist = ((artistsList[0]['name'] as String?) ?? '')
                          .toLowerCase();
                    }
                    return title.contains(query) || artist.contains(query);
                  })
                  .take(10);
            },
            onSelected: _onAlbumSelected,
            fieldViewBuilder:
                (
                  BuildContext fieldContext,
                  TextEditingController fieldController,
                  FocusNode focusNode,
                  VoidCallback onEditingComplete,
                ) {
                  return TextField(
                    controller: fieldController,
                    focusNode: focusNode,
                    decoration: InputDecoration(
                      hintText: 'Search Music Assistant Library...',
                      prefixIcon: const Icon(Icons.search),
                      filled: true,
                      fillColor: AppColors.subtleText,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  );
                },
          ),
          const SizedBox(height: 16),

          if (_albumName.isNotEmpty) ...[
            Text(
              _albumName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.shadowGrey,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              _artistName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            ),

            if (_trackList.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text(
                'Tracklist',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.shadowGrey,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                constraints: const BoxConstraints(maxHeight: 120),
                width: double.infinity,
                padding: const EdgeInsets.all(12.0),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12.0),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Scrollbar(
                  thumbVisibility: true,
                  child: SingleChildScrollView(
                    child: Text(
                      _trackList,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade700,
                        height: 1.5,
                      ),
                    ),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 20),
          ],

          const Text(
            'Vinyl Design',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.shadowGrey,
            ),
          ),
          const SizedBox(height: 12),

          _buildDesignRow(
            label: 'Inner Label',
            onColor: _pickInnerColor,
            onImage: () => _showAssetPickerPopup(
              category: 'labels',
              onSelect: (String url) => setState(() {
                _innerMode = DesignMode.image;
                _innerImage = url;
              }),
            ),
          ),
          const SizedBox(height: 10),

          _buildDesignRow(
            label: 'Outer Sleeve',
            onColor: _pickOuterColor,
            onImage: () => _showAssetPickerPopup(
              category: 'outer-rings',
              onSelect: (String url) => setState(() {
                _outerMode = DesignMode.image;
                _outerImage = url;
              }),
            ),
          ),
          const SizedBox(height: 10),

          Row(
            children: [
              const SizedBox(
                width: 100,
                child: Text(
                  'Overlay FX',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.shadowGrey,
                  ),
                ),
              ),
              Expanded(
                child: PillButton(
                  text: 'Choose',
                  backgroundColor: AppColors.shadowGrey,
                  onPressed: () => _showAssetPickerPopup(
                    category: 'overlays',
                    onSelect: (String url) => setState(() => _overlayArt = url),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: PillButton(
                  text: 'Clear',
                  backgroundColor: AppColors.flagRed,
                  onPressed: () => setState(() => _overlayArt = ''),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          _isSaving
              ? const Center(child: CircularProgressIndicator())
              : PillButton(
                  text: _isEditing ? 'Update Record' : 'Save Record',
                  backgroundColor: AppColors.green,
                  onPressed: _saveRecord,
                ),
        ],
      ),
    );
  }

  Widget _buildDesignRow({
    required String label,
    required VoidCallback onColor,
    required VoidCallback onImage,
  }) {
    return Row(
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppColors.shadowGrey,
            ),
          ),
        ),
        Expanded(
          child: PillButton(
            text: 'Color',
            backgroundColor: AppColors.shadowGrey,
            onPressed: onColor,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: PillButton(
            text: 'Image',
            backgroundColor: AppColors.shadowGrey,
            onPressed: onImage,
          ),
        ),
      ],
    );
  }
}

class _AssetPickerWidget extends StatefulWidget {
  final String category;
  final void Function(String) onSelect;

  const _AssetPickerWidget({required this.category, required this.onSelect});

  @override
  State<_AssetPickerWidget> createState() => _AssetPickerWidgetState();
}

class _AssetPickerWidgetState extends State<_AssetPickerWidget> {
  List<String> _availableAssets = [];
  bool _isLoading = true;
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    _loadAvailableAssets();
  }

  Future<void> _loadAvailableAssets() async {
    try {
      final List<String> assets = await MediaAssetService.listAssets(
        category: widget.category,
      );
      if (mounted) {
        setState(() {
          _availableAssets = assets;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _uploadNewAsset() async {
    final FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4'],
      withData: true,
    );

    if (result == null ||
        result.files.isEmpty ||
        result.files.first.bytes == null) {
      return;
    }

    setState(() => _isUploading = true);
    try {
      final String uploadedUrl = await MediaAssetService.uploadAsset(
        fileBytes: result.files.first.bytes!,
        fileName: result.files.first.name.isEmpty
            ? 'asset.png'
            : result.files.first.name,
        category: widget.category,
      );
      widget.onSelect(uploadedUrl);
      if (mounted) Navigator.pop(context);
    } catch (uploadError) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Upload failed: $uploadError')));
        setState(() => _isUploading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 600,
      height: 700,
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select or Upload Media',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.shadowGrey,
            ),
          ),
          const SizedBox(height: 24),

          _isUploading
              ? const Center(child: CircularProgressIndicator())
              : PillButton(
                  text: 'Upload New Media',
                  backgroundColor: AppColors.brightGold,
                  textColor: Colors.black,
                  leading: const Icon(Icons.upload_file, color: Colors.black),
                  onPressed: _uploadNewAsset,
                ),

          const SizedBox(height: 32),
          const Text(
            'Previously Uploaded',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.shadowGrey,
            ),
          ),
          const SizedBox(height: 16),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _availableAssets.isEmpty
                ? const Center(
                    child: Text(
                      'No existing media found.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                : GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                    itemCount: _availableAssets.length,
                    itemBuilder: (BuildContext gridContext, int assetIndex) {
                      final String assetUrl = _availableAssets[assetIndex];

                      final String displayUrl = assetUrl.startsWith('/')
                          ? 'http://$globalOrchestratorHost:8080$assetUrl'
                          : assetUrl;

                      final bool isVideoAsset = displayUrl
                          .toLowerCase()
                          .endsWith('.mp4');

                      return GestureDetector(
                        onTap: () {
                          widget.onSelect(assetUrl);
                          Navigator.pop(context);
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade300),
                            color: isVideoAsset ? Colors.black87 : Colors.white,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 8,
                                offset: const Offset(2, 4),
                              ),
                            ],
                            image: isVideoAsset
                                ? null
                                : DecorationImage(
                                    image: NetworkImage(displayUrl),
                                    fit: BoxFit.cover,
                                  ),
                          ),
                          child: isVideoAsset
                              ? const Center(
                                  child: Icon(
                                    Icons.play_circle_fill,
                                    color: Colors.white,
                                    size: 48,
                                  ),
                                )
                              : null,
                        ),
                      );
                    },
                  ),
          ),
          const SizedBox(height: 24),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancel',
                style: TextStyle(fontSize: 16, color: AppColors.subtleText),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
