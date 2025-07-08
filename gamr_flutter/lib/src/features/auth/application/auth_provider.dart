import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gamr_flutter/src/features/auth/data/auth_repository.dart';
import 'package:gamr_flutter/src/models/user_model.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? errorMessage;

  AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? errorMessage,
    bool clearUser = false, // Added to explicitly clear user on logout
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : user ?? this.user,
      errorMessage: errorMessage ?? (status == AuthStatus.error ? this.errorMessage : null), // Clear error if not error state
    );
  }
}

class AuthNotifier extendsStateNotifier<AuthState> {
  final AuthRepository _authRepository;

  AuthNotifier(this._authRepository) : super(AuthState()) {
    _initialize();
  }

  Future<void> _initialize() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final user = await _authRepository.getMe();
      if (user != null) {
        state = state.copyWith(status: AuthStatus.authenticated, user: user);
      } else {
        state = state.copyWith(status: AuthStatus.unauthenticated);
      }
    } catch (e) {
      state = state.copyWith(status: AuthStatus.error, errorMessage: e.toString());
    }
  }

  Future<void> checkAuthStatus() async {
    // This can be called to re-verify auth, e.g., on app resume
    await _initialize();
  }

  // Placeholder for actual login with credentials
  Future<void> login(String username, String password) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final user = await _authRepository.login(username, password);
      state = state.copyWith(status: AuthStatus.authenticated, user: user);
    } catch (e) {
      state = state.copyWith(status: AuthStatus.error, errorMessage: e.toString());
    }
  }

  Future<void> logout() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      await _authRepository.logout();
      state = state.copyWith(status: AuthStatus.unauthenticated, clearUser: true);
    } catch (e) {
      // Even if logout API call fails, client should probably still go to unauthenticated state
      state = state.copyWith(status: AuthStatus.unauthenticated, clearUser: true, errorMessage: "Logout failed on server, logged out locally. ${e.toString()}");
    }
  }

  // This method would be called if using a web-based login flow (e.g. Replit OAuth)
  // It returns the URL to be opened in a WebView.
  // The actual handling of the WebView and redirect needs to be done in the UI layer.
  String getWebLoginUrl() {
    return _authRepository.getLoginUrl();
  }

  // Call this after a successful web login if the app can detect it (e.g. via deeplink)
  Future<void> completeWebLogin() async {
     await _initialize(); // Re-check /me endpoint to get user data
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  return AuthNotifier(authRepository);
});

// Helper getters for easy access in UI
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).status == AuthStatus.authenticated;
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});

final authStatusProvider = Provider<AuthStatus>((ref) {
  return ref.watch(authProvider).status;
});

final authErrorMessageProvider = Provider<String?>((ref) {
  return ref.watch(authProvider).errorMessage;
});
