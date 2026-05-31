import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:file_picker/file_picker.dart';
import 'package:web_app/factories/state.dart';
import 'package:web_app/main.dart';
import 'package:web_app/services/orchestrator_api_client.dart';
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
  final List<AlbumTrackList_t>? initialTracks;
  final String? itemId;
  final String? provider;
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
    this.itemId,
    this.provider,
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
  List<AlbumTrackList_t> _trackList = [];
  String _coverArtUrl = '';
  String _tagUid = '';
  String _itemId = '';
  String _provider = '';

  DesignMode _innerMode = DesignMode.color;
  DesignMode _outerMode = DesignMode.color;

  Color _innerColor = AppColors.porcelain;
  Color _outerColor = const Color(0xFF111111);
  String _innerImage = '';
  String _outerImage = '';
  String _overlayArt = '';

  late final TextEditingController _innerColorController;
  late final TextEditingController _outerColorController;

  final OrchestratorApiClient _apiClient = OrchestratorApiClient();

  List<AlbumsInLibrary_t> _maAlbums = [];
  bool _isLoadingDetails = false;

  static const double _columnBreakpoint = 800.0;

  @override
  void initState() {
    super.initState();
    _isEditing =
        widget.initialArtist != null && widget.initialArtist!.isNotEmpty;

    _albumName = widget.initialAlbum ?? '';
    _artistName = widget.initialArtist ?? '';
    _trackList = widget.initialTracks ?? [];
    _tagUid = widget.uid;
    _itemId = widget.itemId ?? '';
    _provider = widget.provider ?? '';
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
    final albums = await _apiClient.getAllAlbumsFromMusicAssistantLibrary();

    if (mounted) {
      setState(() {
        _maAlbums = albums;
      });
    }
  }

  Future<void> _onAlbumSelected(AlbumsInLibrary_t selectedAlbum) async {
    setState(() {
      _albumName = selectedAlbum.mediaTitle;
      _artistName = selectedAlbum.artist;
      _coverArtUrl = selectedAlbum.coverImage;
      _trackList = [];
      _isLoadingDetails = true;
      _itemId = selectedAlbum.itemId;
      _provider = selectedAlbum.provider;
    });

    final trackList = await _apiClient.fetchAlbumTrackList(
      selectedAlbum.itemId,
      selectedAlbum.provider,
    );

    if (mounted) {
      setState(() {
        _isLoadingDetails = false;
        if (trackList.isNotEmpty) {
          _trackList = trackList;
        }
      });
    }
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

    final VinylRecordTagData_t recordPayload = VinylRecordTagData_t(
      tagUid: widget.uid,
      artist: _artistName,
      mediaTitle: _albumName,
      trackList: _trackList,
      itemId: _itemId,
      provider: _provider,
      labelColor: _innerMode == DesignMode.color
          ? RegisterUtils.toHexColor(_innerColor)
          : '',
      labelImage: _innerMode == DesignMode.image ? _innerImage : '',
      outerRingColor: _outerMode == DesignMode.color
          ? RegisterUtils.toHexColor(_outerColor)
          : '',
      outerRingImage: _outerMode == DesignMode.image ? _outerImage : '',
      projectionOverlay: _overlayArt,
      coverImage: _coverArtUrl,
    );

    try {
      await http.post(
        Uri.parse('${systemDataSource.httpBaseUrl}/api/library/saveAlbum'),
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

  String _formatDuration(int totalSeconds) {
    final int minutes = totalSeconds ~/ 60;
    final int seconds = totalSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  Widget _buildFallbackCover() {
    return Container(
      width: 40,
      height: 40,
      color: Colors.grey.shade300,
      child: const Icon(Icons.music_note, color: Colors.white, size: 20),
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

          Autocomplete<AlbumsInLibrary_t>(
            displayStringForOption: (AlbumsInLibrary_t option) =>
                option.mediaTitle,

            optionsBuilder: (TextEditingValue textEditingValue) {
              if (textEditingValue.text.isEmpty) {
                return const Iterable<AlbumsInLibrary_t>.empty();
              }
              final String query = textEditingValue.text.toLowerCase();

              return _maAlbums
                  .where(
                    (AlbumsInLibrary_t album) =>
                        album.mediaTitle.toLowerCase().contains(query),
                  )
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
                constraints: const BoxConstraints(maxHeight: 250),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12.0),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: ListView.separated(
                  padding: const EdgeInsets.all(8.0),
                  shrinkWrap: true,
                  itemCount: _trackList.length,
                  separatorBuilder: (context, index) =>
                      const Divider(height: 1, color: Colors.black12),
                  itemBuilder: (context, index) {
                    final trackInfo = _trackList[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: 8.0,
                        horizontal: 4.0,
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8.0),
                            child: trackInfo.coverImage.isNotEmpty
                                ? Image.network(
                                    trackInfo.coverImage,
                                    width: 40,
                                    height: 40,
                                    fit: BoxFit.cover,
                                    errorBuilder: (c, e, s) =>
                                        _buildFallbackCover(),
                                  )
                                : _buildFallbackCover(),
                          ),
                          const SizedBox(width: 12),

                          Expanded(
                            child: Text(
                              trackInfo.track,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.shadowGrey,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),

                          Text(
                            _formatDuration(trackInfo.duration),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: AppColors
                                  .subtleText,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
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
                          ? 'http://$globalOrchestratorHostAddress:8099$assetUrl'
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
