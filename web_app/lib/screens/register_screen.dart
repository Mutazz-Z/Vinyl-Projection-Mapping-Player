import 'dart:async';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:web_app/services/media_asset_service.dart';
import 'package:web_app/theme/app_theme.dart';
import 'package:web_app/utils/register_utils.dart';
import 'package:web_app/widgets/album_cover_card.dart';
import 'package:web_app/widgets/color_picker_dialog.dart';
import 'package:web_app/widgets/design_ring_card.dart';
import 'package:web_app/widgets/overlay_section_card.dart';
import 'package:web_app/widgets/projection_preview.dart';
import 'package:web_app/widgets/registration_text_fields.dart';
import 'package:web_app/widgets/tag_id_banner.dart';

import '../main.dart';

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

class _RegisterScreenState extends State<RegisterScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  late final TextEditingController _artistController;
  late final TextEditingController _albumController;
  late final TextEditingController _tracksController;
  late final TextEditingController _uriController;
  late final TextEditingController _innerRecordColorController;
  late final TextEditingController _innerRecordImageController;
  late final TextEditingController _outerDesignColorController;
  late final TextEditingController _outerDesignImageController;
  late final TextEditingController _albumCoverArtController;

  late DesignMode _innerMode;
  late DesignMode _outerMode;
  final List<String> _overlayOptions = <String>[];
  String _selectedOverlayArt = '';

  bool _isLoadingOverlayOptions = false;
  bool _isSendingData = false;
  bool _isScrapingMetadata = false;
  bool _isUploadingAsset = false;

  Timer? _uriDebounceTimer;
  bool _isApplyingResolvedUri = false;
  int _uriResolutionRequestId = 0;
  String? _uriResolutionStatus;
  late final bool _isEditing;

  @override
  void initState() {
    super.initState();
    _initTextControllers();
    _determineInitialDesignModes();

    _isEditing =
        widget.initialArtist != null && widget.initialArtist!.trim().isNotEmpty;
    _uriController.addListener(_onUriChanged);

    if (!_isEditing && _uriController.text.trim().isNotEmpty) {
      _scheduleUriResolution(immediate: true, showManualFallbackMessage: false);
    }

    unawaited(_loadOverlayOptions());
  }

  @override
  void dispose() {
    _uriDebounceTimer?.cancel();
    _disposeTextControllers();
    super.dispose();
  }

  void _initTextControllers() {
    _artistController = TextEditingController(text: widget.initialArtist ?? '');
    _albumController = TextEditingController(text: widget.initialAlbum ?? '');
    _tracksController = TextEditingController(text: widget.initialTracks ?? '');
    _uriController = TextEditingController(text: widget.initialUri ?? '');
    _innerRecordColorController = TextEditingController(
      text: RegisterUtils.normalizeColorHex(widget.initialInnerRecordColor),
    );
    _innerRecordImageController = TextEditingController(
      text: widget.initialInnerRecordImage ?? '',
    );
    _outerDesignColorController = TextEditingController(
      text: RegisterUtils.normalizeColorHex(widget.initialOuterDesignColor),
    );
    _outerDesignImageController = TextEditingController(
      text: widget.initialOuterDesignImage ?? '',
    );
    _albumCoverArtController = TextEditingController(
      text: widget.initialAlbumCoverArt ?? '',
    );
  }

  void _disposeTextControllers() {
    _artistController.dispose();
    _albumController.dispose();
    _tracksController.dispose();
    _uriController.dispose();
    _innerRecordColorController.dispose();
    _innerRecordImageController.dispose();
    _outerDesignColorController.dispose();
    _outerDesignImageController.dispose();
    _albumCoverArtController.dispose();
  }

  void _determineInitialDesignModes() {
    _innerMode = _innerRecordImageController.text.trim().isNotEmpty
        ? DesignMode.image
        : DesignMode.color;
    _outerMode = _outerDesignImageController.text.trim().isNotEmpty
        ? DesignMode.image
        : DesignMode.color;
    _selectedOverlayArt = (widget.initialOverlayArt ?? '').trim();
  }

  Future<void> _loadOverlayOptions() async {
    setState(() => _isLoadingOverlayOptions = true);
    try {
      final remoteOptions = await MediaAssetService.listAssets(
        category: 'overlays',
      );
      if (!mounted) return;

      setState(() {
        _overlayOptions
          ..clear()
          ..add('')
          ..addAll(remoteOptions);
        if (_selectedOverlayArt.isNotEmpty &&
            !_overlayOptions.contains(_selectedOverlayArt)) {
          _overlayOptions.add(_selectedOverlayArt);
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(
        () => _overlayOptions
          ..clear()
          ..add(''),
      );
    } finally {
      if (mounted) setState(() => _isLoadingOverlayOptions = false);
    }
  }

  Future<void> _pickAndUploadAsset({
    required String category,
    required List<String> extensions,
    required void Function(String url) onUploaded,
  }) async {
    final FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: extensions,
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;

    final PlatformFile pickedFile = result.files.first;
    final Uint8List? bytes = pickedFile.bytes;
    if (bytes == null || bytes.isEmpty) return;

    final String uploadName = pickedFile.name.trim().isEmpty
        ? 'asset.bin'
        : pickedFile.name.trim();
    setState(() => _isUploadingAsset = true);

    try {
      final String url = await MediaAssetService.uploadAsset(
        bytes: bytes,
        fileName: uploadName,
        category: category,
      );

      if (!mounted) return;
      setState(() => onUploaded(url));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Upload failed: $error')));
    }
    {
      if (mounted) setState(() => _isUploadingAsset = false);
    }
  }

  void _onUriChanged() {
    if (_isApplyingResolvedUri) return;
    _scheduleUriResolution(immediate: false, showManualFallbackMessage: false);
  }

  void _scheduleUriResolution({
    required bool immediate,
    required bool showManualFallbackMessage,
  }) {
    _uriDebounceTimer?.cancel();
    Future<void> action() => _resolveUriAndAutoFill(
      showManualFallbackMessage: showManualFallbackMessage,
    );

    if (immediate) {
      unawaited(action());
    } else {
      _uriDebounceTimer = Timer(
        const Duration(milliseconds: 700),
        () => unawaited(action()),
      );
    }
  }

  Future<void> _resolveUriAndAutoFill({
    required bool showManualFallbackMessage,
  }) async {
    final String enteredInput = _uriController.text.trim();
    if (enteredInput.isEmpty) {
      if (mounted) setState(() => _uriResolutionStatus = null);
      return;
    }

    final int requestId = ++_uriResolutionRequestId;
    setState(() {
      _isScrapingMetadata = true;
      _uriResolutionStatus = 'Resolving link and fetching metadata...';
    });

    final resolution = await musicAssistant.resolveRegistrationInput(
      enteredInput,
    );
    if (!mounted || requestId != _uriResolutionRequestId) return;

    setState(() {
      _isScrapingMetadata = false;

      if (resolution.resolvedUri != enteredInput) {
        _isApplyingResolvedUri = true;
        _uriController.text = resolution.resolvedUri;
        _uriController.selection = TextSelection.fromPosition(
          TextPosition(offset: _uriController.text.length),
        );
        _isApplyingResolvedUri = false;
      }

      final Map<String, String> scrapedData = resolution.metadata;
      if (scrapedData.isNotEmpty) {
        _applyScrapedFields(scrapedData);
        _uriResolutionStatus =
            'Resolved metadata from ${resolution.resolvedUri}.';
      } else if (showManualFallbackMessage) {
        _uriResolutionStatus =
            'No metadata found for ${resolution.resolvedUri}. Fill the fields manually.';
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Could not auto-fill this record. Please complete details manually.',
            ),
          ),
        );
      } else {
        _uriResolutionStatus =
            'No metadata found for ${resolution.resolvedUri} yet.';
      }
    });
  }

  void _applyScrapedFields(Map<String, String> data) {
    void autofillField(TextEditingController controller, String? value) {
      if (value != null &&
          value.isNotEmpty &&
          (!_isEditing || controller.text.trim().isEmpty)) {
        controller.text = value;
      }
    }

    autofillField(_artistController, data['artist']);
    autofillField(_albumController, data['album']);
    autofillField(_tracksController, data['tracks']);
    autofillField(_albumCoverArtController, data['album_cover_art']);
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSendingData = true);
    final String mediaUri = _uriController.text.trim();
    final action = _isEditing
        ? mqttService.updateVinyl
        : mqttService.registerVinyl;

    action(
      uid: widget.uid,
      artist: _artistController.text.trim(),
      album: _albumController.text.trim(),
      tracks: _tracksController.text.trim(),
      mediaUri: mediaUri,
      innerRecordColor: _innerMode == DesignMode.color
          ? _innerRecordColorController.text.trim()
          : '',
      innerRecordImage: _innerMode == DesignMode.image
          ? _innerRecordImageController.text.trim()
          : '',
      outerDesignColor: _outerMode == DesignMode.color
          ? _outerDesignColorController.text.trim()
          : '',
      outerDesignImage: _outerMode == DesignMode.image
          ? _outerDesignImageController.text.trim()
          : '',
      overlayArt: _selectedOverlayArt.trim(),
      albumCoverArt: _albumCoverArtController.text.trim(),
    );

    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isEditing ? 'Record updated.' : 'Registration sent to Pi.',
        ),
        action: !_isEditing
            ? SnackBarAction(
                label: 'Play Now',
                onPressed: () => _playNow(mediaUri),
              )
            : null,
      ),
    );

    Navigator.pop(context);
    mqttService.requestLibrary();
  }

  Future<void> _playNow(String mediaUri) async {
    try {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Playing on Music Assistant...')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Playback failed: $error')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Record' : 'New Vinyl Detected'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.pagePadding),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              TagIdBanner(uid: widget.uid),
              const SizedBox(height: AppSpacing.sectionGap),
              MediaUriField(
                controller: _uriController,
                isScrapingMetadata: _isScrapingMetadata,
              ),
              if (_uriResolutionStatus != null) ...[
                const SizedBox(height: AppSpacing.inlineElementGap),
                Text(
                  _uriResolutionStatus!,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: AppColors.subtleText),
                ),
              ],
              const SizedBox(height: AppSpacing.sectionGap),
              ArtistField(controller: _artistController),
              const SizedBox(height: AppSpacing.fieldGap),
              AlbumField(controller: _albumController),
              const SizedBox(height: AppSpacing.fieldGap),
              TracksField(controller: _tracksController),
              const SizedBox(height: AppSpacing.sectionGap),
              _buildDesignAndPreviewRow(),
              const SizedBox(height: AppSpacing.sectionGap),
              _buildSubmitButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: AppSpacing.submitButtonHeight,
      child: ElevatedButton(
        onPressed: _isSendingData || _isUploadingAsset ? null : _submitForm,
        style: ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
        ),
        child: _isSendingData
            ? const CircularProgressIndicator()
            : Text(
                _isEditing ? 'Update Database' : 'Save to Vinyl Database',
                style: AppTextStyles.submitButton,
              ),
      ),
    );
  }

  Widget _buildDesignAndPreviewRow() {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final bool useTwoColumns = constraints.maxWidth >= 980;

        final Widget designFields = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            _buildRingDesignSection(
              title: 'Inner Ring Design',
              assetCategory: 'labels',
              mode: _innerMode,
              colorController: _innerRecordColorController,
              imageController: _innerRecordImageController,
              onModeReset: (mode) => setState(() {
                _innerMode = mode;
                if (mode == DesignMode.color) {
                  _innerRecordImageController.clear();
                }
              }),
            ),
            const SizedBox(height: AppSpacing.fieldGap),
            _buildRingDesignSection(
              title: 'Outer Ring Design',
              assetCategory: 'outer-rings',
              mode: _outerMode,
              colorController: _outerDesignColorController,
              imageController: _outerDesignImageController,
              onModeReset: (mode) => setState(() {
                _outerMode = mode;
                if (mode == DesignMode.color) {
                  _outerDesignImageController.clear();
                }
              }),
            ),
            const SizedBox(height: AppSpacing.fieldGap),
            _buildMediaCardsSection(),
          ],
        );

        final Widget preview = ProjectionPreview(
          outerColor: RegisterUtils.parseHexColor(
            _outerDesignColorController.text,
          ),
          innerColor: RegisterUtils.parseHexColor(
            _innerRecordColorController.text,
          ),
          outerImage: _outerMode == DesignMode.image
              ? _outerDesignImageController.text.trim()
              : '',
          innerImage: _innerMode == DesignMode.image
              ? _innerRecordImageController.text.trim()
              : '',
          coverArt: _albumCoverArtController.text.trim(),
          overlayArt: _selectedOverlayArt.trim(),
        );

        if (!useTwoColumns) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              designFields,
              const SizedBox(height: AppSpacing.sectionGap),
              preview,
            ],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 5, child: designFields),
            const SizedBox(width: AppSpacing.sectionGap),
            Expanded(flex: 4, child: preview),
          ],
        );
      },
    );
  }

  Widget _buildRingDesignSection({
    required String title,
    required String assetCategory,
    required DesignMode mode,
    required TextEditingController colorController,
    required TextEditingController imageController,
    required Function(DesignMode) onModeReset,
  }) {
    return DesignRingCard(
      title: title,
      mode: mode,
      colorText: colorController.text,
      imageText: imageController.text,
      isUploading: _isUploadingAsset,
      onSelectColorMode: () => onModeReset(DesignMode.color),
      onSelectImageMode: () => _pickAndUploadAsset(
        category: assetCategory,
        extensions: <String>['png', 'jpg', 'jpeg', 'gif', 'webp'],
        onUploaded: (url) {
          imageController.text = url;
          onModeReset(DesignMode.image);
        },
      ),
      onPickColor: () => showColorPickerDialog(
        context: context,
        title: 'Pick $title Color',
        controller: colorController,
        onColorApplied: () => onModeReset(DesignMode.color),
      ),
    );
  }

  Widget _buildMediaCardsSection() {
    return Column(
      children: [
        OverlaySectionCard(
          selectedOverlayArt: _selectedOverlayArt,
          overlayOptions: _overlayOptions,
          isLoading: _isLoadingOverlayOptions,
          isUploading: _isUploadingAsset,
          onChanged: (value) =>
              setState(() => _selectedOverlayArt = value ?? ''),
          onUploadCustom: () => _pickAndUploadAsset(
            category: 'overlays',
            extensions: <String>['png', 'jpg', 'jpeg', 'gif', 'webp'],
            onUploaded: (url) {
              if (!_overlayOptions.contains(url)) _overlayOptions.add(url);
              setState(() => _selectedOverlayArt = url);
            },
          ),
          onClear: () => setState(() => _selectedOverlayArt = ''),
        ),
        const SizedBox(height: AppSpacing.fieldGap),
        AlbumCoverCard(
          controller: _albumCoverArtController,
          isUploading: _isUploadingAsset,
          onUploadOverride: () => _pickAndUploadAsset(
            category: 'album-covers',
            extensions: <String>['png', 'jpg', 'jpeg', 'gif', 'webp'],
            onUploaded: (url) => _albumCoverArtController.text = url,
          ),
        ),
      ],
    );
  }
}
