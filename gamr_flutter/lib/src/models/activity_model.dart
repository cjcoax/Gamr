import 'package:flutter/foundation.dart';
import 'package:gamr_flutter/src/models/game_model.dart'; // For potential nesting
import 'package:gamr_flutter/src/models/user_model.dart'; // For potential nesting

enum ActivityType {
  completed,
  started,
  rated,
  reviewed,
  posted, // Added based on common activity types, schema has 'type' as varchar
  followedUser,
  addedToLibrary,
  unknown;

  static ActivityType fromString(String? typeString) {
    if (typeString == null) return ActivityType.unknown;
    switch (typeString.toLowerCase()) {
      case 'completed':
        return ActivityType.completed;
      case 'started':
        return ActivityType.started;
      case 'rated':
        return ActivityType.rated;
      case 'reviewed':
        return ActivityType.reviewed;
      case 'posted': // If you have a generic 'user made a post'
        return ActivityType.posted;
      case 'followed_user':
        return ActivityType.followedUser;
      case 'added_to_library':
        return ActivityType.addedToLibrary;
      default:
        // Log unknown activity type for potential future handling
        debugPrint("Unknown activity type string: $typeString");
        return ActivityType.unknown;
    }
  }

  String toJsonString() {
    switch (this) {
      case ActivityType.completed:
        return 'completed';
      case ActivityType.started:
        return 'started';
      case ActivityType.rated:
        return 'rated';
      case ActivityType.reviewed:
        return 'reviewed';
      case ActivityType.posted:
        return 'posted';
      case ActivityType.followedUser:
        return 'followed_user';
      case ActivityType.addedToLibrary:
        return 'added_to_library';
      default:
        return 'unknown';
    }
  }
}

@immutable
class Activity {
  final int id;
  final String userId;
  final int? gameId; // Optional, as some activities might not relate to a game (e.g. user follow)
  final ActivityType type;
  final Map<String, dynamic>? metadata; // For jsonb
  final DateTime? createdAt;

  // Optional: to hold resolved Game or User objects if API returns them nested
  // The schema.ts defines ActivityWithDetails which includes User and optional Game.
  final User? user;
  final Game? game;


  const Activity({
    required this.id,
    required this.userId,
    this.gameId,
    required this.type,
    this.metadata,
    this.createdAt,
    this.user,
    this.game,
  });

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      id: json['id'] as int,
      userId: json['user_id'] as String? ?? json['userId'] as String,
      gameId: json['game_id'] as int? ?? json['gameId'] as int?,
      type: ActivityType.fromString(json['type'] as String?),
      metadata: json['metadata'] != null ? Map<String, dynamic>.from(json['metadata'] as Map) : null,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'] as String) : (json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null),
      user: json['user'] != null && json['user'] is Map<String, dynamic> ? User.fromJson(json['user'] as Map<String, dynamic>) : null,
      game: json['game'] != null && json['game'] is Map<String, dynamic> ? Game.fromJson(json['game'] as Map<String, dynamic>) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'game_id': gameId,
      'type': type.toJsonString(),
      'metadata': metadata,
      'created_at': createdAt?.toIso8601String(),
      'user': user?.toJson(),
      'game': game?.toJson(),
    };
  }
}
