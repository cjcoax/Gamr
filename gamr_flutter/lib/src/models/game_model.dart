import 'package:flutter/foundation.dart';

@immutable
class Game {
  final int id;
  final int? igdbId;
  final String title;
  final String? description;
  final String? coverImageUrl;
  final List<String>? screenshotUrls;
  final String? genre;
  final String? platform;
  final DateTime? releaseDate;
  final String? developer;
  final String? publisher;
  final int? metacriticScore;
  final double? igdbRating;
  final bool? isRetro;
  final DateTime? createdAt;

  const Game({
    required this.id,
    this.igdbId,
    required this.title,
    this.description,
    this.coverImageUrl,
    this.screenshotUrls,
    this.genre,
    this.platform,
    this.releaseDate,
    this.developer,
    this.publisher,
    this.metacriticScore,
    this.igdbRating,
    this.isRetro,
    this.createdAt,
  });

  factory Game.fromJson(Map<String, dynamic> json) {
    return Game(
      id: json['id'] as int,
      igdbId: json['igdb_id'] as int? ?? json['igdbId'] as int?,
      title: json['title'] as String,
      description: json['description'] as String?,
      coverImageUrl: json['cover_image_url'] as String? ?? json['coverImageUrl'] as String?,
      screenshotUrls: (json['screenshot_urls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          (json['screenshotUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(),
      genre: json['genre'] as String?,
      platform: json['platform'] as String?,
      releaseDate: json['release_date'] != null
          ? DateTime.tryParse(json['release_date'] as String)
          : (json['releaseDate'] != null ? DateTime.tryParse(json['releaseDate'] as String) : null),
      developer: json['developer'] as String?,
      publisher: json['publisher'] as String?,
      metacriticScore: json['metacritic_score'] as int? ?? json['metacriticScore'] as int?,
      igdbRating: (json['igdb_rating'] as num?)?.toDouble() ?? (json['igdbRating'] as num?)?.toDouble(),
      isRetro: json['is_retro'] as bool? ?? json['isRetro'] as bool?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : (json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'igdb_id': igdbId,
      'title': title,
      'description': description,
      'cover_image_url': coverImageUrl,
      'screenshot_urls': screenshotUrls,
      'genre': genre,
      'platform': platform,
      'release_date': releaseDate?.toIso8601String(),
      'developer': developer,
      'publisher': publisher,
      'metacritic_score': metacriticScore,
      'igdb_rating': igdbRating,
      'is_retro': isRetro,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
