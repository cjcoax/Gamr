import 'package:flutter/foundation.dart';

@immutable
class User {
  final String id;
  final String? email;
  final String? firstName;
  final String? lastName;
  final String? profileImageUrl;
  final String? username;
  final String? bio;
  final String? steamUsername;
  final String? epicUsername;
  final String? battlenetUsername;
  final String? psnUsername;
  final String? xboxUsername;
  final String? nintendoUsername;
  final String? eaUsername;
  final String? discordUsername;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    this.email,
    this.firstName,
    this.lastName,
    this.profileImageUrl,
    this.username,
    this.bio,
    this.steamUsername,
    this.epicUsername,
    this.battlenetUsername,
    this.psnUsername,
    this.xboxUsername,
    this.nintendoUsername,
    this.eaUsername,
    this.discordUsername,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String?,
      firstName: json['first_name'] as String? ?? json['firstName'] as String?, // Allow both snake_case and camelCase
      lastName: json['last_name'] as String? ?? json['lastName'] as String?,
      profileImageUrl: json['profile_image_url'] as String? ?? json['profileImageUrl'] as String?,
      username: json['username'] as String?,
      bio: json['bio'] as String?,
      steamUsername: json['steam_username'] as String? ?? json['steamUsername'] as String?,
      epicUsername: json['epic_username'] as String? ?? json['epicUsername'] as String?,
      battlenetUsername: json['battlenet_username'] as String? ?? json['battlenetUsername'] as String?,
      psnUsername: json['psn_username'] as String? ?? json['psnUsername'] as String?,
      xboxUsername: json['xbox_username'] as String? ?? json['xboxUsername'] as String?,
      nintendoUsername: json['nintendo_username'] as String? ?? json['nintendoUsername'] as String?,
      eaUsername: json['ea_username'] as String? ?? json['eaUsername'] as String?,
      discordUsername: json['discord_username'] as String? ?? json['discordUsername'] as String?,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'] as String) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'profile_image_url': profileImageUrl,
      'username': username,
      'bio': bio,
      'steam_username': steamUsername,
      'epic_username': epicUsername,
      'battlenet_username': battlenetUsername,
      'psn_username': psnUsername,
      'xbox_username': xboxUsername,
      'nintendo_username': nintendoUsername,
      'ea_username': eaUsername,
      'discord_username': discordUsername,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  String get displayName {
    if (username != null && username!.isNotEmpty) {
      return username!;
    }
    if (firstName != null && firstName!.isNotEmpty) {
      return firstName!;
    }
    return email ?? id;
  }
}
