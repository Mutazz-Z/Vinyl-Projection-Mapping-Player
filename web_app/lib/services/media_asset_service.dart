import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;

class MediaAssetService {
  // Uses a root-relative path. The browser will automatically prepend
  // http://Vinyl-Projector.local/ or http://localhost/ depending on where the app is loaded!
  static const String _baseProxyPath = '/api/assets';

  static Future<String> uploadAsset({
    required Uint8List bytes,
    required String fileName,
    required String category,
  }) async {
    final Uri uploadUri = Uri.parse('$_baseProxyPath/upload');
    final http.MultipartRequest request = http.MultipartRequest(
      'POST',
      uploadUri,
    )..fields['category'] = category;

    request.files.add(
      http.MultipartFile.fromBytes('file', bytes, filename: fileName),
    );

    final http.StreamedResponse streamedResponse = await request.send();
    final String responseBody = await streamedResponse.stream.bytesToString();

    if (streamedResponse.statusCode < 200 ||
        streamedResponse.statusCode >= 300) {
      throw StateError(
        'Asset upload failed (${streamedResponse.statusCode}): $responseBody',
      );
    }

    final dynamic decoded = jsonDecode(responseBody);
    final String? url = decoded['url']?.toString();

    if (url == null || url.isEmpty) {
      throw StateError('Asset upload response did not include URL.');
    }

    return url;
  }

  static Future<List<String>> listAssets({required String category}) async {
    final Uri listUri = Uri.parse(
      '$_baseProxyPath/list?category=${Uri.encodeQueryComponent(category)}',
    );
    final http.Response response = await http.get(listUri);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return <String>[];
    }

    final dynamic decoded = jsonDecode(response.body);
    final dynamic itemsDynamic = decoded['items'];
    if (itemsDynamic is! List) return <String>[];

    return itemsDynamic
        .whereType<Map<String, dynamic>>()
        .map((item) => item['url']?.toString() ?? '')
        .where((url) => url.isNotEmpty)
        .toList();
  }
}
