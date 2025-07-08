import 'package:flutter/foundation.dart';
import 'package:gamr_flutter/src/models/game_model.dart'; // For potential nesting
import 'package:gamr_flutter/src/models/user_model.dart'; // For potential nesting
// Import reaction and comment models when they are created if they are part of PostWithDetails
// import 'package:gamr_flutter/src/models/post_reaction_model.dart';
// import 'package:gamr_flutter/src/models/post_comment_model.dart';


enum GamePostType {
  text,
  image,
  screenshot, // As per schema
  unknown;

  static GamePostType fromString(String? typeString) {
    if (typeString == null) return GamePostType.unknown;
    switch (typeString.toLowerCase()) {
      case 'text':
        return GamePostType.text;
      case 'image':
        return GamePostType.image;
      case 'screenshot':
        return GamePostType.screenshot;
      default:
        return GamePostType.unknown;
    }
  }

  String toJsonString() {
    return name; // Enum name matches schema values
  }
}

@immutable
class GamePost {
  final int id;
  final String userId;
  final int gameId;
  final String content;
  final String? caption;
  final List<String>? imageUrls;
  final GamePostType postType;
  final DateTime? createdAt;

  // Fields from PostWithDetails (from schema.ts)
  final User? user;
  final Game? game;
  // final List<PostReactionWithUser>? reactions; // Define PostReactionWithUser later
  // final List<PostCommentWithUser>? comments; // Define PostCommentWithUser later
  // final Map<String, int>? reactionCounts;
  // final String? userReaction;


  const GamePost({
    required this.id,
    required this.userId,
    required this.gameId,
    required this.content,
    this.caption,
    this.imageUrls,
    required this.postType,
    this.createdAt,
    this.user,
    this.game,
    // this.reactions,
    // this.comments,
    // this.reactionCounts,
    // this.userReaction,
  });

  factory GamePost.fromJson(Map<String, dynamic> json) {
    // Helper to parse reaction counts
    // Map<String, int>? parseReactionCounts(dynamic counts) {
    //   if (counts == null || counts is! Map) return null;
    //   return Map<String, int>.from(counts.map((key, value) => MapEntry(key.toString(), value as int)));
    // }

    return GamePost(
      id: json['id'] as int,
      userId: json['user_id'] as String? ?? json['userId'] as String,
      gameId: json['game_id'] as int? ?? json['gameId'] as int,
      content: json['content'] as String,
      caption: json['caption'] as String?,
      imageUrls: (json['image_urls'] as List<dynamic>?)?.map((e) => e as String).toList() ??
                 (json['imageUrls'] as List<dynamic>?)?.map((e) => e as String).toList(),
      postType: GamePostType.fromString(json['post_type'] as String? ?? json['postType'] as String?),
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'] as String) : (json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null),

      // From PostWithDetails
      user: json['user'] != null && json['user'] is Map<String, dynamic> ? User.fromJson(json['user'] as Map<String, dynamic>) : null,
      game: json['game'] != null && json['game'] is Map<String, dynamic> ? Game.fromJson(json['game'] as Map<String, dynamic>) : null,
      // reactions: (json['reactions'] as List<dynamic>?)?.map((r) => PostReactionWithUser.fromJson(r as Map<String, dynamic>)).toList(),
      // comments: (json['comments'] as List<dynamic>?)?.map((c) => PostCommentWithUser.fromJson(c as Map<String, dynamic>)).toList(),
      // reactionCounts: parseReactionCounts(json['reactionCounts'] ?? json['reaction_counts']),
      // userReaction: json['userReaction'] as String? ?? json['user_reaction'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'game_id': gameId,
      'content': content,
      'caption': caption,
      'image_urls': imageUrls,
      'post_type': postType.toJsonString(),
      'created_at': createdAt?.toIso8601String(),
      'user': user?.toJson(),
      'game': game?.toJson(),
      // 'reactions': reactions?.map((r) => r.toJson()).toList(),
      // 'comments': comments?.map((c) => c.toJson()).toList(),
      // 'reaction_counts': reactionCounts,
      // 'user_reaction': userReaction,
    };
  }
}

// TODO: Define PostReactionWithUser and PostCommentWithUser if needed.
// These would typically be:
// class PostReactionWithUser extends PostReaction { final User user; ... }
// class PostCommentWithUser extends PostComment { final User user; ... }
// And PostReaction / PostComment models themselves.
// For now, these are commented out to keep GamePost simple.
// They can be added when implementing features that use them.
