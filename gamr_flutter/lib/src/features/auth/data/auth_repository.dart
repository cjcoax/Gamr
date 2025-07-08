import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gamr_flutter/src/core/utils/api_service.dart';
import 'package:gamr_flutter/src/models/user_model.dart';

// Define the structure of the login response if it's more than just the user
// For now, assuming login returns the User object directly or under a 'user' key.

class AuthRepository {
  final ApiService _apiService;

  AuthRepository(this._apiService);

  // Attempts to log in.
  // The actual Replit /api/login redirects to a Replit auth page.
  // This function might need to be adapted based on how a non-Replit Flutter client
  // would authenticate (e.g., credentials POST, OAuth flow).
  // For now, assuming a placeholder endpoint or one that returns user if session exists.
  // Or, this might involve opening a WebView for the Replit login.
  // Let's assume for now there's an endpoint like /api/auth/me that returns user if authenticated.
  Future<User?> getMe() async {
    try {
      // In the original client, useAuth calls /api/auth/me (implicitly via queryClient)
      // The original client redirects to /api/login if useAuth determines not authenticated.
      // /api/login itself is a Replit-specific auth flow.
      // For Flutter, we'll first try a /me endpoint. If it fails (e.g. 401), user is not logged in.
      final response = await _apiService.get('/auth/me'); // Assuming this endpoint exists
      if (response != null && response is Map<String, dynamic>) {
        return User.fromJson(response);
      }
      return null;
    } on ApiException catch (e) {
      if (e.statusCode == 401) { // Unauthorized
        return null;
      }
      // Rethrow other API exceptions to be handled by the UI/provider
      rethrow;
    } catch (e) {
      // Handle other generic errors (network, parsing etc.)
      print("AuthRepository.getMe error: $e");
      rethrow; // Or return null / throw custom error
    }
  }

  // Placeholder for a direct login method if the backend supports it
  // e.g. with username/password
  Future<User> login(String username, String password) async {
    try {
      final response = await _apiService.post('/auth/login', body: {
        'username': username,
        'password': password,
      });
      // Assuming the response directly contains user data or under a 'user' key
      final userData = response is Map<String, dynamic> && response.containsKey('user')
                       ? response['user']
                       : response;
      if (userData is Map<String, dynamic>) {
        return User.fromJson(userData);
      } else {
        throw ApiException(500, "Invalid login response format");
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      print("AuthRepository.login error: $e");
      throw ApiException(0, "Login failed: ${e.toString()}");
    }
  }

  // Placeholder for logout
  Future<void> logout() async {
    try {
      // The original client seems to use a GET request to /api/logout
      await _apiService.get('/auth/logout');
      // No specific response data is usually expected from logout
    } on ApiException {
      rethrow;
    } catch (e) {
      print("AuthRepository.logout error: $e");
      throw ApiException(0, "Logout failed: ${e.toString()}");
    }
  }

  // The Replit client redirects to /api/login which is a GET request.
  // This URL would typically be opened in a browser or WebView.
  // For a Flutter app, if using OAuth or a similar web flow, you'd use a package
  // like `flutter_web_auth` or `uni_links` to handle the redirect.
  // This function provides the URL that would start such a flow.
  String getLoginUrl() {
    // This needs to be the full URL if used in a WebView outside the app's immediate context
     final baseUrl = _apiService.toString().split('/api')[0]; // Hacky way to get base URL
     // This is highly dependent on whether the server is running on localhost or deployed
     // And if the /api/login path is correct.
     // For now, let's assume API_BASE_URL is something like http://localhost:3000/api
     // then loginUrl should be http://localhost:3000/api/login
     // The original client uses relative paths like "/api/login".
     // If the ApiService._baseUrl is "http://localhost:3000/api", then this works.
    return '${_apiService.toString().replaceFirst(RegExp(r'/api$'), '')}/api/login';
  }

}

// Provider for ApiService (should be in a central providers file)
final apiServiceProvider = Provider<ApiService>((ref) {
  final client = http.Client(); // http.Client() from package:http/http.dart
  ref.onDispose(() => client.close());
  return ApiService(client: client);
});


// Provider for AuthRepository
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthRepository(apiService);
});
