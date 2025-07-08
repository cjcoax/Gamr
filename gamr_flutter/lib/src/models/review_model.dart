import 'package:flutter/foundation.dart';
import 'package:gamr_flutter/src/models/game_model.dart'; // For potential nesting
import 'package:gamr_flutter/src/models/user_model.dart'; // For potential nesting

@immutable
class Review {
  final int id;
  final String userId;
  final int gameId;
  final double rating; // 1-5 stars, not null in schema
  final String? title;
  final String? content;
  final String? imageUrl;
  final bool? spoilers;
  final String? recommendedFor; // comma-separated tags
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Optional: to hold resolved Game or User objects if API returns them nested
  final Game? game;
  final User? user;

  const Review({
    required this.id,
    required this.userId,
    required this.gameId,
    required this.rating,
    this.title,
    this.content,
    this.imageUrl,
    this.spoilers,
    this.recommendedFor,
    this.createdAt,
    this.updatedAt,
    this.game,
    this.user,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] as int,
      userId: json['user_id'] as String? ?? json['userId'] as String,
      gameId: json['game_id'] as int? ?? json['gameId'] as int,
      rating: (json['rating'] as num).toDouble(), // Assuming rating is always present
      title: json['title'] as String?,
      content: json['content'] as String?,
      imageUrl: json['image_url'] as String? ?? json['imageUrl'] as String?,
      spoilers: json['spoilers'] as bool?,
      recommendedFor: json['recommended_for'] as String? ?? json['recommendedFor'] as String?,
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
      'rating': rating,
      'title': title,
      'content': content,
      'image_url': imageUrl,
      'spoilers': spoilers,
      'recommended_for': recommendedFor,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'game': game?.toJson(),
      'user': user?.toJson(),
    };
  }
}
