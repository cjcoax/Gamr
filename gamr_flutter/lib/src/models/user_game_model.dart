import 'package:flutter/foundation.dart';
import 'package:gamr_flutter/src/models/game_model.dart'; // For potential nesting if needed
import 'package:gamr_flutter/src/models/user_model.dart'; // For potential nesting if needed

enum UserGameStatus {
  wantToPlay,
  playing,
  completed,
  dnf, // Did Not Finish
  unknown; // Default or error case

  static UserGameStatus fromString(String? statusString) {
    if (statusString == null) return UserGameStatus.unknown;
    switch (statusString.toLowerCase()) {
      case 'want_to_play':
      case 'wanttoplay':
        return UserGameStatus.wantToPlay;
      case 'playing':
        return UserGameStatus.playing;
      case 'completed':
        return UserGameStatus.completed;
      case 'dnf':
        return UserGameStatus.dnf;
      default:
        return UserGameStatus.unknown;
    }
  }

  String toJsonString() {
    switch (this) {
      case UserGameStatus.wantToPlay:
        return 'want_to_play';
      case UserGameStatus.playing:
        return 'playing';
      case UserGameStatus.completed:
        return 'completed';
      case UserGameStatus.dnf:
        return 'dnf';
      default:
        return 'unknown';
    }
  }
}

@immutable
class UserGame {
  final int id;
  final String userId;
  final int gameId;
  final UserGameStatus status;
  final int? progress; // percentage 0-100
  final double? rating; // 1-5 stars
  final int? hoursPlayed;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Optional: to hold resolved Game or User objects if API returns them nested
  final Game? game;
  final User? user;

  const UserGame({
    required this.id,
    required this.userId,
    required this.gameId,
    required this.status,
    this.progress,
    this.rating,
    this.hoursPlayed,
    this.startedAt,
    this.completedAt,
    this.createdAt,
    this.updatedAt,
    this.game,
    this.user,
  });

  factory UserGame.fromJson(Map<String, dynamic> json) {
    return UserGame(
      id: json['id'] as int,
      userId: json['user_id'] as String? ?? json['userId'] as String,
      gameId: json['game_id'] as int? ?? json['gameId'] as int,
      status: UserGameStatus.fromString(json['status'] as String?),
      progress: json['progress'] as int?,
      rating: (json['rating'] as num?)?.toDouble(),
      hoursPlayed: json['hours_played'] as int? ?? json['hoursPlayed'] as int?,
      startedAt: json['started_at'] != null ? DateTime.tryParse(json['started_at'] as String) : (json['startedAt'] != null ? DateTime.tryParse(json['startedAt'] as String) : null),
      completedAt: json['completed_at'] != null ? DateTime.tryParse(json['completed_at'] as String) : (json['completedAt'] != null ? DateTime.tryParse(json['completedAt'] as String) : null),
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'] as String) : (json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null),
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'] as String) : (json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'] as String) : null),
      game: json['game'] != null && json['game'] is Map<String, dynamic> ? Game.fromJson(json['game'] as Map<String, dynamic>) : null,
      user: json['user'] != null && json['user'] is Map<String, dynamic> ? User.fromJson(json['user'] as Map<String, dynamic>) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'game_id': gameId,
      'status': status.toJsonString(),
      'progress': progress,
      'rating': rating,
      'hours_played': hoursPlayed,
      'started_at': startedAt?.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'game': game?.toJson(), // Optional
      'user': user?.toJson(), // Optional
    };
  }
}
