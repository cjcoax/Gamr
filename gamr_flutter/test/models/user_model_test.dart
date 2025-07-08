import 'package:flutter_test/flutter_test.dart';
import 'package:gamr_flutter/src/models/user_model.dart'; // Adjust import path as needed

void main() {
  group('User Model Tests', () {
    final Map<String, dynamic> userJson = {
      'id': 'user123',
      'email': 'test@example.com',
      'first_name': 'Test',
      'last_name': 'User',
      'profile_image_url': 'http://example.com/profile.jpg',
      'username': 'testuser',
      'bio': 'A test bio.',
      'steam_username': 'steamTest',
      'created_at': '2023-01-01T12:00:00.000Z',
      'updated_at': '2023-01-01T13:00:00.000Z',
    };

    test('User.fromJson creates a valid User object from JSON', () {
      final user = User.fromJson(userJson);

      expect(user.id, 'user123');
      expect(user.email, 'test@example.com');
      expect(user.firstName, 'Test');
      expect(user.lastName, 'User');
      expect(user.profileImageUrl, 'http://example.com/profile.jpg');
      expect(user.username, 'testuser');
      expect(user.bio, 'A test bio.');
      expect(user.steamUsername, 'steamTest');
      expect(user.createdAt, DateTime.parse('2023-01-01T12:00:00.000Z'));
      expect(user.updatedAt, DateTime.parse('2023-01-01T13:00:00.000Z'));
    });

    test('User.toJson creates valid JSON from a User object', () {
      final user = User.fromJson(userJson);
      final Map<String, dynamic> generatedJson = user.toJson();

      // Check a few key fields. For dates, ensure they are ISO8601 strings.
      expect(generatedJson['id'], userJson['id']);
      expect(generatedJson['email'], userJson['email']);
      expect(generatedJson['first_name'], userJson['first_name']);
      expect(generatedJson['username'], userJson['username']);
      expect(generatedJson['created_at'], userJson['created_at']);
    });

    test('User.displayName returns username if available', () {
      final user = User(id: '1', username: 'GamerTag');
      expect(user.displayName, 'GamerTag');
    });

    test('User.displayName returns firstName if username is null/empty', () {
      final user = User(id: '1', firstName: 'John');
      expect(user.displayName, 'John');
    });

    test('User.displayName returns email if username and firstName are null/empty', () {
      final user = User(id: '1', email: 'john@example.com');
      expect(user.displayName, 'john@example.com');
    });

    test('User.displayName returns id if username, firstName, and email are null/empty', () {
      final user = User(id: 'userXYZ');
      expect(user.displayName, 'userXYZ');
    });
  });
}
