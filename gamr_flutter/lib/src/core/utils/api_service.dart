import 'dart:convert';
import 'dart:io';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

// Custom Exception for API errors
class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic errors; // For detailed validation errors if any

  ApiException(this.statusCode, this.message, [this.errors]);

  @override
  String toString() {
    return "ApiException: $statusCode - $message ${errors != null ? '\nErrors: ${jsonEncode(errors)}' : ''}";
  }
}

class ApiService {
  final String _baseUrl;
  final http.Client _client;

  // Using a single client for cookie persistence
  ApiService({http.Client? client})
      : _client = client ?? http.Client(),
        _baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000/api' {
    if (dotenv.env['API_BASE_URL'] == null) {
      print("WARNING: API_BASE_URL not found in .env, using default 'http://localhost:3000/api'");
    }
  }

  Future<dynamic> _handleResponse(http.Response response) async {
    final dynamic responseBody = json.decode(utf8.decode(response.bodyBytes)); // Handle UTF-8

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return responseBody;
    } else {
      String message = "An unknown error occurred";
      dynamic errors;

      if (responseBody is Map<String, dynamic>) {
        message = responseBody['message'] as String? ??
                  responseBody['error'] as String? ??
                  (responseBody.containsKey('detail') ? responseBody['detail'] as String : message);
        if (responseBody.containsKey('errors')) {
          errors = responseBody['errors'];
        }
      } else if (responseBody is String) {
        message = responseBody;
      }

      // Special handling for Replit-style error messages if present
      // e.g., "401: Unauthorized"
      final replitErrorMatch = RegExp(r'^(\d+):\s*(.*)').firstMatch(message);
      if (replitErrorMatch != null && replitErrorMatch.groupCount == 2) {
         // int statusCode = int.tryParse(replitErrorMatch.group(1)!) ?? response.statusCode;
         // message = replitErrorMatch.group(2)!;
         // For now, we rely on actual response.statusCode and parse message from body
      }


      throw ApiException(response.statusCode, message, errors);
    }
  }

  Future<dynamic> get(String endpoint, {Map<String, String>? headers}) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    try {
      final response = await _client.get(
        url,
        headers: {
          HttpHeaders.contentTypeHeader: 'application/json; charset=utf-8',
          ...?headers,
        },
      );
      return _handleResponse(response);
    } on SocketException {
      throw ApiException(0, 'No Internet connection or server not reachable.');
    } on http.ClientException catch (e) {
      throw ApiException(0, 'Network error: ${e.message}');
    }
  }

  Future<dynamic> post(String endpoint, {dynamic body, Map<String, String>? headers}) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    try {
      final response = await _client.post(
        url,
        headers: {
          HttpHeaders.contentTypeHeader: 'application/json; charset=utf-8',
          ...?headers,
        },
        body: json.encode(body),
      );
      return _handleResponse(response);
    } on SocketException {
      throw ApiException(0, 'No Internet connection or server not reachable.');
    } on http.ClientException catch (e) {
      throw ApiException(0, 'Network error: ${e.message}');
    }
  }

  Future<dynamic> put(String endpoint, {dynamic body, Map<String, String>? headers}) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    try {
      final response = await _client.put(
        url,
        headers: {
          HttpHeaders.contentTypeHeader: 'application/json; charset=utf-8',
          ...?headers,
        },
        body: json.encode(body),
      );
      return _handleResponse(response);
    } on SocketException {
      throw ApiException(0, 'No Internet connection or server not reachable.');
    } on http.ClientException catch (e) {
      throw ApiException(0, 'Network error: ${e.message}');
    }
  }

  Future<dynamic> delete(String endpoint, {Map<String, String>? headers}) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    try {
      final response = await _client.delete(
        url,
        headers: {
          HttpHeaders.contentTypeHeader: 'application/json; charset=utf-8',
          ...?headers,
        },
      );
      return _handleResponse(response);
    } on SocketException {
      throw ApiException(0, 'No Internet connection or server not reachable.');
    } on http.ClientException catch (e) {
      throw ApiException(0, 'Network error: ${e.message}');
    }
  }

  // Method to close the client when it's no longer needed (e.g. in a provider's dispose method)
  void close() {
    _client.close();
  }
}

// Riverpod provider for the ApiService
// final apiServiceProvider = Provider<ApiService>((ref) {
//   final client = http.Client();
//   ref.onDispose(() => client.close());
//   return ApiService(client: client);
// });
// This will be uncommented and placed in a more appropriate providers file later.
