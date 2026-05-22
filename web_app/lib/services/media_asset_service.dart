import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:web_app/main.dart';

class MediaAssetService {
  static String get _baseApiUrl =>
      'http://$globalOrchestratorHost:8080/api/assets';

  static Future<String> uploadAsset({
    required Uint8List bytes,
    required String fileName,
    required String category,
  }) async {
    final Uri uploadUri = Uri.parse('$_baseApiUrl/upload');
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

    final String rawPath = responseBody.trim();

    if (rawPath.isEmpty) {
      throw StateError('Asset upload response was empty.');
    }

    return '$globalOrchestratorHost$rawPath';
  }

  static Future<List<String>> listAssets({required String category}) async {
    final Uri listUri = Uri.parse('$_baseApiUrl/list');
    final http.Response response = await http.get(listUri);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return <String>[];
    }

    final dynamic decoded = jsonDecode(response.body);
    if (decoded is! List) return <String>[];

    return decoded
        .map((item) => item.toString())
        .where((path) => path.startsWith(category))
        .map((path) => '$globalOrchestratorHost/assets/$path')
        .toList();
  }
}
