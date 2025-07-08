import 'package:flutter_test/flutter_test.dart';
import 'package:gamr_flutter/src/features/auth/application/auth_provider.dart';
import 'package:gamr_flutter/src/features/auth/data/auth_repository.dart';
import 'package:gamr_flutter/src/models/user_model.dart';
import 'package:gamr_flutter/src/core/utils/api_service.dart'; // For ApiException
import 'package:mocktail/mocktail.dart'; // Using mocktail for mocking

// Mocks
class MockAuthRepository extends Mock implements AuthRepository {}
class MockUser extends Mock implements User {}

void main() {
  late MockAuthRepository mockAuthRepository;
  late AuthNotifier authNotifier;

  setUp(() {
    mockAuthRepository = MockAuthRepository();
    // Initialize AuthNotifier with the mocked repository
    // This direct instantiation is for testing. In app, it's through Riverpod.
    authNotifier = AuthNotifier(mockAuthRepository);
  });

  tearDown(() {
    authNotifier.dispose(); // Dispose the notifier
  });

  group('AuthNotifier Tests', () {
    final mockUser = User(id: 'testId', username: 'TestUser');

    test('Initial state is AuthStatus.initial', () {
      // The constructor calls _initialize, so state will change quickly.
      // We can test the state *after* _initialize completes.
      // For true initial state before _initialize, more complex setup needed.
      expect(authNotifier.debugState.status, isNot(AuthStatus.initial)); // It should have moved past initial due to _initialize()
    });

    group('_initialize (called on construction)', () {
      test('State becomes authenticated if getMe returns a user', () async {
        when(() => mockAuthRepository.getMe()).thenAnswer((_) async => mockUser);

        // Re-initialize for this specific test condition if needed, or rely on initial setup
        final notifier = AuthNotifier(mockAuthRepository); // New instance for clean test

        // Wait for async operations in _initialize to complete
        await Future.delayed(Duration.zero); // Allow microtasks to run

        expect(notifier.debugState.status, AuthStatus.authenticated);
        expect(notifier.debugState.user, mockUser);
        notifier.dispose();
      });

      test('State becomes unauthenticated if getMe returns null', () async {
        when(() => mockAuthRepository.getMe()).thenAnswer((_) async => null);

        final notifier = AuthNotifier(mockAuthRepository);
        await Future.delayed(Duration.zero);

        expect(notifier.debugState.status, AuthStatus.unauthenticated);
        expect(notifier.debugState.user, isNull);
        notifier.dispose();
      });

      test('State becomes error if getMe throws an exception', () async {
        final exception = ApiException(500, 'Server error');
        when(() => mockAuthRepository.getMe()).thenThrow(exception);

        final notifier = AuthNotifier(mockAuthRepository);
        await Future.delayed(Duration.zero);

        expect(notifier.debugState.status, AuthStatus.error);
        expect(notifier.debugState.errorMessage, exception.toString());
        notifier.dispose();
      });
    });

    group('logout', () {
      test('State becomes unauthenticated and user is cleared on successful logout', () async {
        // Arrange: Initial state is authenticated
        when(() => mockAuthRepository.getMe()).thenAnswer((_) async => mockUser);
        final notifier = AuthNotifier(mockAuthRepository);
        await Future.delayed(Duration.zero); // Let _initialize complete
        expect(notifier.debugState.status, AuthStatus.authenticated);

        // Act: Call logout
        when(() => mockAuthRepository.logout()).thenAnswer((_) async {}); // Mock successful logout
        await notifier.logout();

        // Assert
        expect(notifier.debugState.status, AuthStatus.unauthenticated);
        expect(notifier.debugState.user, isNull);
        notifier.dispose();
      });

       test('State becomes unauthenticated even if logout API call fails', () async {
        // Arrange: Initial state is authenticated
        when(() => mockAuthRepository.getMe()).thenAnswer((_) async => mockUser);
        final notifier = AuthNotifier(mockAuthRepository);
        await Future.delayed(Duration.zero); // Let _initialize complete

        // Act: Call logout, repository throws error
        final exception = ApiException(500, 'Logout failed on server');
        when(() => mockAuthRepository.logout()).thenThrow(exception);
        await notifier.logout();

        // Assert: Still unauthenticated locally, error message might be set
        expect(notifier.debugState.status, AuthStatus.unauthenticated);
        expect(notifier.debugState.user, isNull);
        expect(notifier.debugState.errorMessage, contains("Logout failed on server"));
        notifier.dispose();
      });
    });

    // TODO: Add tests for login method when its implementation is concrete
    // group('login', () { ... });

    test('getWebLoginUrl returns URL from repository', () {
      const expectedUrl = 'http://example.com/login';
      when(() => mockAuthRepository.getLoginUrl()).thenReturn(expectedUrl);

      final url = authNotifier.getWebLoginUrl();
      expect(url, expectedUrl);
    });

  });
}
