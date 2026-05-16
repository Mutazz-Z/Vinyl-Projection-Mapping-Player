import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

class MediaAssetService {
  static const String _assetBaseUrlFromEnvironment = String.fromEnvironment(
    'ORCHESTRATOR_ASSET_BASE_URL',
    defaultValue: 'http://localhost:8099',
  );

  static String get _baseUrl => _assetBaseUrlFromEnvironment.trim();

  static Future<String> uploadAsset({
    required Uint8List bytes,
    required String fileName,
    required String category,
  }) async {
    final Uri uploadUri = Uri.parse('$_baseUrl/api/assets/upload');
    final http.MultipartRequest request = http.MultipartRequest('POST', uploadUri)
      ..fields['category'] = category;

    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: fileName,
      ),
    );

    final http.StreamedResponse streamedResponse = await request.send();
    final String responseBody = await streamedResponse.stream.bytesToString();

    if (streamedResponse.statusCode < 200 || streamedResponse.statusCode >= 300) {
      throw StateError(
        'Asset upload failed (${streamedResponse.statusCode}): $responseBody',
      );
    }

    final dynamic decoded = jsonDecode(responseBody);
    if (decoded is! Map<String, dynamic>) {
      throw StateError('Asset upload response was invalid JSON.');
    }

    final String? url = decoded['url']?.toString();
    if (url == null || url.isEmpty) {
      throw StateError('Asset upload response did not include URL.');
    }

    return url;
  }

  static Future<List<String>> listAssets({required String category}) async {
    final Uri listUri = Uri.parse(
      '$_baseUrl/api/assets/list?category=${Uri.encodeQueryComponent(category)}',
    );

    final http.Response response = await http.get(listUri);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return <String>[];
    }

    final dynamic decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      return <String>[];
    }

    final dynamic itemsDynamic = decoded['items'];
    if (itemsDynamic is! List) {
      return <String>[];
    }

    final List<String> urls = <String>[];
    for (final dynamic item in itemsDynamic) {
      if (item is Map<String, dynamic>) {
        final String? url = item['url']?.toString();
        if (url != null && url.isNotEmpty) {
          urls.add(url);
        }
      }
    }
    return urls;
  }
}
