import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:web_app/main.dart';

class MediaAssetService {
  static const int _orchestratorPort = 8080;

  static String get _assetApiBaseUrl =>
      'http://${systemDataSource.orchestratorHost}:$_orchestratorPort/api/assets';

  static Future<String> uploadAsset({
    required Uint8List fileBytes,
    required String fileName,
    required String category,
  }) async {
    final Uri uploadUri = Uri.parse('$_assetApiBaseUrl/upload');
    final http.MultipartRequest multipartRequest = http.MultipartRequest(
      'POST',
      uploadUri,
    )..fields['category'] = category;

    multipartRequest.files.add(
      http.MultipartFile.fromBytes('file', fileBytes, filename: fileName),
    );

    final http.StreamedResponse streamedResponse = await multipartRequest
        .send();
    final String responseBody = await streamedResponse.stream.bytesToString();

    if (streamedResponse.statusCode < 200 ||
        streamedResponse.statusCode >= 300) {
      throw StateError(
        'Asset upload failed (${streamedResponse.statusCode}): $responseBody',
      );
    }

    final String returnedAssetPath = responseBody.trim();

    if (returnedAssetPath.isEmpty) {
      throw StateError('Asset upload response contained no path.');
    }

    return 'http://${systemDataSource.orchestratorHost}:$_orchestratorPort$returnedAssetPath';
  }

  static Future<List<String>> listAssets({required String category}) async {
    final Uri listUri = Uri.parse('$_assetApiBaseUrl/list');
    final http.Response response = await http.get(listUri);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return <String>[];
    }

    final dynamic decodedBody = jsonDecode(response.body);
    if (decodedBody is! List) return <String>[];

    return decodedBody
        .map((dynamic item) => item.toString())
        .where((String assetPath) => assetPath.startsWith(category))
        .map(
          (String assetPath) =>
              'http://${systemDataSource.orchestratorHost}:$_orchestratorPort/assets/$assetPath',
        )
        .toList();
  }
}
