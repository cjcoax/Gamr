import 'package:flutter/foundation.dart';
import 'package:gamr_flutter/src/models/game_model.dart'; // For potential nesting
import 'package:gamr_flutter/src/models/user_model.dart'; // For potential nesting

@immutable
class FavoriteGame {
  final int id;
  final String userId;
  final int gameId;
  final int position; // 1-4 for the 4 slots
  final DateTime? createdAt;

  // Optional: to hold resolved Game or User objects if API returns them nested
  final Game? game;
  final User? user;

  const FavoriteGame({
    required this.id,
    required this.userId,
    required this.gameId,
    required this.position,
    this.createdAt,
    this.game,
    this.user,
  });

  factory FavoriteGame.fromJson(Map<String, dynamic> json) {
    return FavoriteGame(
      id: json['id'] as int,
      userId: json['user_id'] as String? ?? json['userId'] as String,
      gameId: json['game_id'] as int? ?? json['gameId'] as int,
      position: json['position'] as int,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'] as String) : (json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null),
      game: json['game'] != null && json['game'] is Map<String, dynamic> ? Game.fromJson(json['game'] as Map<String, dynamic>) : null,
      user: json['user'] != null && json['user'] is Map<String, dynamic> ? User.fromJson(json['user'] as Map<String, dynamic>) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'game_id': gameId,
      'position': position,
      'created_at': createdAt?.toIso8601String(),
      'game': game?.toJson(),
      'user': user?.toJson(),
    };
  }
}
