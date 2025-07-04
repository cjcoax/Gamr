import {
  users,
  games,
  userGames,
  reviews,
  activities,
  userFollows,
  gamePosts,
  favoriteGames,
  type User,
  type UpsertUser,
  type Game,
  type InsertGame,
  type UserGame,
  type InsertUserGame,
  type Review,
  type InsertReview,
  type Activity,
  type InsertActivity,
  type GamePost,
  type InsertGamePost,
  type FavoriteGame,
  type InsertFavoriteGame,
  type GameWithUserData,
  type UserWithStats,
  type ActivityWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, ilike, sql, count } from "drizzle-orm";
import { igdbService, type IGDBGame, type IGDBSearchResult } from "./igdb";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithStats(id: string): Promise<UserWithStats | undefined>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  searchUsers(query: string, limit?: number): Promise<User[]>;

  // Game operations
  getAllGames(limit?: number, offset?: number): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  getGameWithUserData(gameId: number, userId: string | null): Promise<GameWithUserData | undefined>;
  searchGames(query: string, limit?: number): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  getGamesByCategory(category: string, limit?: number): Promise<Game[]>;
  getTrendingGames(limit?: number): Promise<Game[]>;
  getTopRatedGames(limit?: number): Promise<Game[]>;
  getNewReleases(limit?: number): Promise<Game[]>;
  getRetroGames(limit?: number): Promise<Game[]>;

  // User game library operations
  getUserGames(userId: string, status?: string): Promise<(UserGame & { game: Game })[]>;
  getUserGame(userId: string, gameId: number): Promise<UserGame | undefined>;
  addGameToLibrary(userGame: InsertUserGame): Promise<UserGame>;
  updateUserGame(id: number, data: Partial<UserGame>): Promise<UserGame>;
  removeGameFromLibrary(userId: string, gameId: number): Promise<void>;

  // Review operations
  getGameReviews(gameId: number, limit?: number): Promise<(Review & { user: User })[]>;
  getUserReviews(userId: string, limit?: number): Promise<(Review & { game: Game })[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, data: Partial<Review>): Promise<Review>;
  deleteReview(id: number, userId: string): Promise<void>;

  // Activity operations
  getUserActivities(userId: string, limit?: number): Promise<ActivityWithDetails[]>;
  getFollowingActivities(userId: string, limit?: number): Promise<ActivityWithDetails[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Social operations
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowers(userId: string): Promise<User[]>;
  getUserFollowing(userId: string): Promise<User[]>;

  // IGDB integration operations
  searchIGDBGames(query: string, limit?: number): Promise<IGDBSearchResult[]>;
  createGameFromIGDB(igdbId: number): Promise<Game>;
  getGameByIGDBId(igdbId: number): Promise<Game | undefined>;
  updateSampleGamesWithIGDB(): Promise<void>;
  addNewGamesFromIGDB(): Promise<void>;
  updateGTAVIWithIGDBData(): Promise<void>;

  // Game posts operations
  getGamePosts(gameId: number, limit?: number): Promise<(GamePost & { user: User })[]>;
  getUserGamePosts(userId: string, limit?: number): Promise<(GamePost & { game: Game })[]>;
  createGamePost(post: InsertGamePost): Promise<GamePost>;
  deleteGamePost(id: number, userId: string): Promise<void>;

  // Favorite games operations
  getUserFavoriteGames(userId: string): Promise<(FavoriteGame & { game: Game })[]>;
  setFavoriteGame(userId: string, gameId: number, position: number): Promise<FavoriteGame>;
  removeFavoriteGame(userId: string, position: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithStats(id: string): Promise<UserWithStats | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const [statsResult] = await db
      .select({
        gamesCompleted: sql<number>`count(case when ${userGames.status} = 'completed' then 1 end)`,
        gamesPlaying: sql<number>`count(case when ${userGames.status} = 'currently_playing' then 1 end)`,
        gamesWantToPlay: sql<number>`count(case when ${userGames.status} = 'want_to_play' then 1 end)`,
        totalHoursPlayed: sql<number>`coalesce(sum(${userGames.hoursPlayed}), 0)`,
        averageRating: sql<number>`coalesce(avg(${userGames.rating}), 0)`,
      })
      .from(userGames)
      .where(eq(userGames.userId, id));

    return {
      ...user,
      stats: {
        gamesCompleted: Number(statsResult.gamesCompleted) || 0,
        gamesPlaying: Number(statsResult.gamesPlaying) || 0,
        gamesWantToPlay: Number(statsResult.gamesWantToPlay) || 0,
        totalHoursPlayed: Number(statsResult.totalHoursPlayed) || 0,
        averageRating: Number(statsResult.averageRating) || 0,
      },
    };
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async searchUsers(query: string, limit = 20): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.username, `%${query}%`),
          ilike(users.email, `%${query}%`)
        )
      )
      .limit(limit)
      .orderBy(desc(users.createdAt));
  }

  // Game operations
  async getAllGames(limit = 50, offset = 0): Promise<Game[]> {
    return db.select().from(games).limit(limit).offset(offset).orderBy(desc(games.createdAt));
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getGameWithUserData(gameId: number, userId: string | null): Promise<GameWithUserData | undefined> {
    // First get the basic game data
    const game = await this.getGame(gameId);
    if (!game) return undefined;

    // Get review statistics
    const reviewStats = await db
      .select({
        averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
        reviewCount: sql<number>`count(${reviews.id})`,
      })
      .from(reviews)
      .where(eq(reviews.gameId, gameId));

    const stats = reviewStats[0] || { averageRating: 0, reviewCount: 0 };

    // Get user game data if authenticated
    let userGame = undefined;
    if (userId) {
      const [userGameResult] = await db
        .select()
        .from(userGames)
        .where(and(eq(userGames.gameId, gameId), eq(userGames.userId, userId)));
      userGame = userGameResult || undefined;
    }

    return {
      ...game,
      userGame,
      averageRating: Number(stats.averageRating) || 0,
      reviewCount: Number(stats.reviewCount) || 0,
    };
  }

  async searchGames(query: string, limit = 20): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(
        or(
          ilike(games.title, `%${query}%`),
          ilike(games.description, `%${query}%`),
          ilike(games.genre, `%${query}%`),
          ilike(games.developer, `%${query}%`)
        )
      )
      .limit(limit)
      .orderBy(desc(games.createdAt));
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async getGamesByCategory(category: string, limit = 20): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(eq(games.genre, category))
      .limit(limit)
      .orderBy(desc(games.createdAt));
  }

  async getTrendingGames(limit = 20): Promise<Game[]> {
    return db
      .select({
        id: games.id,
        igdbId: games.igdbId,
        title: games.title,
        description: games.description,
        coverImageUrl: games.coverImageUrl,
        screenshotUrls: games.screenshotUrls,
        genre: games.genre,
        platform: games.platform,
        releaseDate: games.releaseDate,
        developer: games.developer,
        publisher: games.publisher,
        metacriticScore: games.metacriticScore,
        igdbRating: games.igdbRating,
        isRetro: games.isRetro,
        createdAt: games.createdAt,
      })
      .from(games)
      .leftJoin(userGames, eq(userGames.gameId, games.id))
      .groupBy(games.id)
      .orderBy(desc(sql`count(${userGames.id})`))
      .limit(limit);
  }

  async getTopRatedGames(limit = 20): Promise<Game[]> {
    return db
      .select({
        id: games.id,
        igdbId: games.igdbId,
        title: games.title,
        description: games.description,
        coverImageUrl: games.coverImageUrl,
        screenshotUrls: games.screenshotUrls,
        genre: games.genre,
        platform: games.platform,
        releaseDate: games.releaseDate,
        developer: games.developer,
        publisher: games.publisher,
        metacriticScore: games.metacriticScore,
        igdbRating: games.igdbRating,
        isRetro: games.isRetro,
        createdAt: games.createdAt,
      })
      .from(games)
      .leftJoin(reviews, eq(reviews.gameId, games.id))
      .groupBy(games.id)
      .having(sql`count(${reviews.id}) > 0`)
      .orderBy(desc(sql`avg(${reviews.rating})`))
      .limit(limit);
  }

  async getNewReleases(limit = 20): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(sql`${games.releaseDate} >= NOW() - INTERVAL '3 months'`)
      .orderBy(desc(games.releaseDate))
      .limit(limit);
  }

  async getRetroGames(limit = 20): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(eq(games.isRetro, true))
      .orderBy(desc(games.createdAt))
      .limit(limit);
  }

  // User game library operations
  async getUserGames(userId: string, status?: string): Promise<(UserGame & { game: Game })[]> {
    let query = db
      .select({
        id: userGames.id,
        userId: userGames.userId,
        gameId: userGames.gameId,
        status: userGames.status,
        progress: userGames.progress,
        rating: userGames.rating,
        hoursPlayed: userGames.hoursPlayed,
        startedAt: userGames.startedAt,
        completedAt: userGames.completedAt,
        createdAt: userGames.createdAt,
        updatedAt: userGames.updatedAt,
        game: games,
      })
      .from(userGames)
      .innerJoin(games, eq(games.id, userGames.gameId));

    if (status) {
      return query
        .where(and(eq(userGames.userId, userId), eq(userGames.status, status)))
        .orderBy(desc(userGames.updatedAt));
    } else {
      return query
        .where(eq(userGames.userId, userId))
        .orderBy(desc(userGames.updatedAt));
    }
  }

  async getUserGame(userId: string, gameId: number): Promise<UserGame | undefined> {
    const [userGame] = await db
      .select()
      .from(userGames)
      .where(and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)));
    return userGame;
  }

  async addGameToLibrary(userGame: InsertUserGame): Promise<UserGame> {
    const [newUserGame] = await db.insert(userGames).values(userGame).returning();
    return newUserGame;
  }

  async updateUserGame(id: number, data: Partial<UserGame>): Promise<UserGame> {
    const [updatedUserGame] = await db
      .update(userGames)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userGames.id, id))
      .returning();
    return updatedUserGame;
  }

  async removeGameFromLibrary(userId: string, gameId: number): Promise<void> {
    await db.delete(userGames).where(and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)));
  }

  // Review operations
  async getGameReviews(gameId: number, limit = 20): Promise<(Review & { user: User })[]> {
    return db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        gameId: reviews.gameId,
        rating: reviews.rating,
        title: reviews.title,
        content: reviews.content,
        imageUrl: reviews.imageUrl,
        spoilers: reviews.spoilers,
        recommendedFor: reviews.recommendedFor,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        user: users,
      })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.userId))
      .where(eq(reviews.gameId, gameId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
  }

  async getUserReviews(userId: string, limit = 20): Promise<(Review & { game: Game })[]> {
    return db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        gameId: reviews.gameId,
        rating: reviews.rating,
        title: reviews.title,
        content: reviews.content,
        imageUrl: reviews.imageUrl,
        spoilers: reviews.spoilers,
        recommendedFor: reviews.recommendedFor,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        game: games,
      })
      .from(reviews)
      .innerJoin(games, eq(games.id, reviews.gameId))
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async updateReview(id: number, data: Partial<Review>): Promise<Review> {
    const [updatedReview] = await db
      .update(reviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteReview(id: number, userId: string): Promise<void> {
    await db.delete(reviews).where(and(eq(reviews.id, id), eq(reviews.userId, userId)));
  }

  // Activity operations
  async getUserActivities(userId: string, limit = 20): Promise<ActivityWithDetails[]> {
    return db
      .select({
        id: activities.id,
        userId: activities.userId,
        gameId: activities.gameId,
        type: activities.type,
        metadata: activities.metadata,
        createdAt: activities.createdAt,
        user: users,
        game: games,
      })
      .from(activities)
      .innerJoin(users, eq(users.id, activities.userId))
      .leftJoin(games, eq(games.id, activities.gameId))
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async getFollowingActivities(userId: string, limit = 20): Promise<ActivityWithDetails[]> {
    return db
      .select({
        id: activities.id,
        userId: activities.userId,
        gameId: activities.gameId,
        type: activities.type,
        metadata: activities.metadata,
        createdAt: activities.createdAt,
        user: users,
        game: games,
      })
      .from(activities)
      .innerJoin(userFollows, eq(userFollows.followingId, activities.userId))
      .innerJoin(users, eq(users.id, activities.userId))
      .leftJoin(games, eq(games.id, activities.gameId))
      .where(eq(userFollows.followerId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Social operations
  async followUser(followerId: string, followingId: string): Promise<void> {
    await db.insert(userFollows).values({ followerId, followingId });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
    return !!result;
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    return db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        username: users.username,
        bio: users.bio,
        steamUsername: users.steamUsername,
        epicUsername: users.epicUsername,
        battlenetUsername: users.battlenetUsername,
        psnUsername: users.psnUsername,
        xboxUsername: users.xboxUsername,
        nintendoUsername: users.nintendoUsername,
        eaUsername: users.eaUsername,
        discordUsername: users.discordUsername,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(userFollows, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followingId, userId));
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    return db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        username: users.username,
        bio: users.bio,
        steamUsername: users.steamUsername,
        epicUsername: users.epicUsername,
        battlenetUsername: users.battlenetUsername,
        psnUsername: users.psnUsername,
        xboxUsername: users.xboxUsername,
        nintendoUsername: users.nintendoUsername,
        eaUsername: users.eaUsername,
        discordUsername: users.discordUsername,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(userFollows, eq(userFollows.followingId, users.id))
      .where(eq(userFollows.followerId, userId));
  }

  // IGDB integration methods
  async searchIGDBGames(query: string, limit = 20): Promise<IGDBSearchResult[]> {
    return igdbService.searchGames(query, limit);
  }

  async getGameByIGDBId(igdbId: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.igdbId, igdbId));
    return game;
  }

  async createGameFromIGDB(igdbId: number): Promise<Game> {
    const igdbGame = await igdbService.getGameDetails(igdbId);
    if (!igdbGame) {
      throw new Error(`Game with IGDB ID ${igdbId} not found`);
    }

    const gameData: InsertGame = {
      igdbId: igdbGame.id,
      title: igdbGame.name,
      description: igdbGame.summary || null,
      coverImageUrl: igdbGame.cover?.url || null,
      screenshotUrls: igdbGame.screenshots?.map(s => s.url) || null,
      genre: igdbGame.genres?.[0]?.name || null,
      platform: igdbGame.platforms?.map(p => p.name).join(', ') || null,
      developer: igdbGame.involved_companies?.find(c => c.developer)?.company.name || null,
      publisher: igdbGame.involved_companies?.find(c => c.publisher)?.company.name || null,
      releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : null,
      igdbRating: igdbGame.rating ? Math.round(igdbGame.rating) / 20 : null, // Convert 0-100 to 0-5
      isRetro: igdbGame.first_release_date ? (igdbGame.first_release_date < Date.now() / 1000 - (15 * 365 * 24 * 60 * 60)) : false,
    };

    const [newGame] = await db.insert(games).values(gameData).returning();
    return newGame;
  }

  async updateSampleGamesWithIGDB(): Promise<void> {
    try {
      // Update Skyrim
      const skyrimSearch = await igdbService.searchGames("The Elder Scrolls V Skyrim", 1);
      if (skyrimSearch.length > 0) {
        const skyrimIGDB = await igdbService.getGameDetails(skyrimSearch[0].id);
        if (skyrimIGDB) {
          await db.update(games)
            .set({
              igdbId: skyrimIGDB.id,
              description: skyrimIGDB.summary || null,
              coverImageUrl: skyrimIGDB.cover?.url || null,
              screenshotUrls: skyrimIGDB.screenshots?.map(s => s.url) || null,
              genre: skyrimIGDB.genres?.[0]?.name || null,
              platform: skyrimIGDB.platforms?.map(p => p.name).join(', ') || null,
              developer: skyrimIGDB.involved_companies?.find(c => c.developer)?.company.name || null,
              publisher: skyrimIGDB.involved_companies?.find(c => c.publisher)?.company.name || null,
              releaseDate: skyrimIGDB.first_release_date ? new Date(skyrimIGDB.first_release_date * 1000) : null,
              igdbRating: skyrimIGDB.rating ? Math.round(skyrimIGDB.rating) / 20 : null,
            })
            .where(eq(games.title, "The Elder Scrolls V: Skyrim"));
        }
      }

      // Update Stardew Valley
      const stardewSearch = await igdbService.searchGames("Stardew Valley", 1);
      if (stardewSearch.length > 0) {
        const stardewIGDB = await igdbService.getGameDetails(stardewSearch[0].id);
        if (stardewIGDB) {
          await db.update(games)
            .set({
              igdbId: stardewIGDB.id,
              description: stardewIGDB.summary || null,
              coverImageUrl: stardewIGDB.cover?.url || null,
              screenshotUrls: stardewIGDB.screenshots?.map(s => s.url) || null,
              genre: stardewIGDB.genres?.[0]?.name || null,
              platform: stardewIGDB.platforms?.map(p => p.name).join(', ') || null,
              developer: stardewIGDB.involved_companies?.find(c => c.developer)?.company.name || null,
              publisher: stardewIGDB.involved_companies?.find(c => c.publisher)?.company.name || null,
              releaseDate: stardewIGDB.first_release_date ? new Date(stardewIGDB.first_release_date * 1000) : null,
              igdbRating: stardewIGDB.rating ? Math.round(stardewIGDB.rating) / 20 : null,
            })
            .where(eq(games.title, "Stardew Valley"));
        }
      }

      console.log("Updated sample games with IGDB data");
    } catch (error) {
      console.error("Error updating sample games with IGDB data:", error);
    }
  }

  async addNewGamesFromIGDB(): Promise<void> {
    try {
      // Games to add with their specific search terms
      const gamesToAdd = [
        "Fortnite",
        "Infinity Nikki", 
        "Avowed",
        "Baldur's Gate 3",
        "Overwatch 2",
        "Abiotic Factor",
        "Diablo IV",
        "Grand Theft Auto VI",
        "V Rising",
        "Marvel Rivals",
        "Hunt: Showdown 1896",
        "Luma Island",
        "Two Point Museum",
        "Bloons TD 6",
        "Dune: Awakening",
        "Conan Exiles"
      ];

      for (const gameTitle of gamesToAdd) {
        try {
          // Check if game already exists
          const existingGame = await db.select().from(games)
            .where(eq(games.title, gameTitle))
            .limit(1);

          if (existingGame.length > 0) {
            console.log(`Game ${gameTitle} already exists, skipping`);
            continue;
          }

          // Search for the game
          const searchResults = await igdbService.searchGames(gameTitle, 5);
          if (searchResults.length > 0) {
            // Get detailed data for the first result
            const gameData = await igdbService.getGameDetails(searchResults[0].id);
            
            if (gameData) {
              // Create the game entry
              await db.insert(games).values({
                igdbId: gameData.id,
                title: gameData.name,
                description: gameData.summary || null,
                coverImageUrl: gameData.cover?.url ? igdbService['formatImageUrl'](gameData.cover.url) : null,
                screenshotUrls: gameData.screenshots?.map(s => igdbService['formatImageUrl'](s.url)) || null,
                genre: gameData.genres?.[0]?.name || null,
                platform: gameData.platforms?.map(p => p.name).join(', ') || null,
                developer: gameData.involved_companies?.find(c => c.developer)?.company.name || null,
                publisher: gameData.involved_companies?.find(c => c.publisher)?.company.name || null,
                releaseDate: gameData.first_release_date ? new Date(gameData.first_release_date * 1000) : null,
                igdbRating: gameData.rating ? Math.round(gameData.rating) / 20 : null,
                isRetro: gameData.first_release_date ? 
                  (new Date(gameData.first_release_date * 1000).getFullYear() < 2015) : false,
              });

              console.log(`Added game: ${gameData.name}`);
            }
          } else {
            console.log(`Could not find IGDB data for: ${gameTitle}`);
            
            // Try alternative search terms for games that might be harder to find
            if (gameTitle === "Grand Theft Auto VI") {
              const altSearchResults = await igdbService.searchGames("Grand Theft Auto 6", 5);
              if (altSearchResults.length > 0) {
                const gameData = await igdbService.getGameDetails(altSearchResults[0].id);
                if (gameData) {
                  await db.insert(games).values({
                    igdbId: gameData.id,
                    title: gameData.name,
                    description: gameData.summary || null,
                    coverImageUrl: gameData.cover?.url ? igdbService['formatImageUrl'](gameData.cover.url) : null,
                    screenshotUrls: gameData.screenshots?.map(s => igdbService['formatImageUrl'](s.url)) || null,
                    genre: gameData.genres?.[0]?.name || null,
                    platform: gameData.platforms?.map(p => p.name).join(', ') || null,
                    developer: gameData.involved_companies?.find(c => c.developer)?.company.name || null,
                    publisher: gameData.involved_companies?.find(c => c.publisher)?.company.name || null,
                    releaseDate: gameData.first_release_date ? new Date(gameData.first_release_date * 1000) : null,
                    igdbRating: gameData.rating ? Math.round(gameData.rating) / 20 : null,
                    isRetro: gameData.first_release_date ? 
                      (new Date(gameData.first_release_date * 1000).getFullYear() < 2015) : false,
                  });
                  console.log(`Added game: ${gameData.name} (found with alternative search)`);
                }
              } else {
                console.log("Could not find GTA VI even with alternative search terms");
              }
            }
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`Error adding game ${gameTitle}:`, error);
        }
      }

      console.log("Finished adding new games from IGDB");
    } catch (error) {
      console.error("Error adding new games from IGDB:", error);
    }
  }

  async updateGTAVIWithIGDBData(): Promise<void> {
    try {
      // Search for GTA VI using alternative search terms
      const searchResults = await igdbService.searchGames("Grand Theft Auto 6", 10);
      
      if (searchResults.length > 0) {
        const gameData = await igdbService.getGameDetails(searchResults[0].id);
        
        if (gameData) {
          // Update the existing GTA VI entry with real IGDB data
          await db
            .update(games)
            .set({
              igdbId: gameData.id,
              title: gameData.name,
              description: gameData.summary || null,
              coverImageUrl: gameData.cover?.url ? igdbService['formatImageUrl'](gameData.cover.url) : null,
              screenshotUrls: gameData.screenshots?.map(s => igdbService['formatImageUrl'](s.url)) || null,
              genre: gameData.genres?.[0]?.name || null,
              platform: gameData.platforms?.map(p => p.name).join(', ') || null,
              developer: gameData.involved_companies?.find(c => c.developer)?.company.name || null,
              publisher: gameData.involved_companies?.find(c => c.publisher)?.company.name || null,
              releaseDate: gameData.first_release_date ? new Date(gameData.first_release_date * 1000) : null,
              igdbRating: gameData.rating ? Math.round(gameData.rating) / 20 : null,
            })
            .where(eq(games.title, "Grand Theft Auto VI"));
          
          console.log(`Updated GTA VI with real IGDB data: ${gameData.name}`);
        }
      } else {
        console.log("Could not find GTA VI in IGDB search");
      }
    } catch (error) {
      console.error("Error updating GTA VI with IGDB data:", error);
    }
  }

  // Game posts operations
  async getGamePosts(gameId: number, limit = 20): Promise<(GamePost & { user: User })[]> {
    return db
      .select({
        id: gamePosts.id,
        userId: gamePosts.userId,
        gameId: gamePosts.gameId,
        content: gamePosts.content,
        imageUrls: gamePosts.imageUrls,
        postType: gamePosts.postType,
        createdAt: gamePosts.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          username: users.username,
          bio: users.bio,
          steamUsername: users.steamUsername,
          epicUsername: users.epicUsername,
          battlenetUsername: users.battlenetUsername,
          psnUsername: users.psnUsername,
          xboxUsername: users.xboxUsername,
          nintendoUsername: users.nintendoUsername,
          eaUsername: users.eaUsername,
          discordUsername: users.discordUsername,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(gamePosts)
      .innerJoin(users, eq(users.id, gamePosts.userId))
      .where(eq(gamePosts.gameId, gameId))
      .orderBy(desc(gamePosts.createdAt))
      .limit(limit);
  }

  async getUserGamePosts(userId: string, limit = 20): Promise<(GamePost & { game: Game })[]> {
    return db
      .select({
        id: gamePosts.id,
        userId: gamePosts.userId,
        gameId: gamePosts.gameId,
        content: gamePosts.content,
        imageUrls: gamePosts.imageUrls,
        postType: gamePosts.postType,
        createdAt: gamePosts.createdAt,
        game: {
          id: games.id,
          igdbId: games.igdbId,
          title: games.title,
          description: games.description,
          coverImageUrl: games.coverImageUrl,
          screenshotUrls: games.screenshotUrls,
          genre: games.genre,
          platform: games.platform,
          releaseDate: games.releaseDate,
          developer: games.developer,
          publisher: games.publisher,
          metacriticScore: games.metacriticScore,
          igdbRating: games.igdbRating,
          isRetro: games.isRetro,
          createdAt: games.createdAt,
        },
      })
      .from(gamePosts)
      .innerJoin(games, eq(games.id, gamePosts.gameId))
      .where(eq(gamePosts.userId, userId))
      .orderBy(desc(gamePosts.createdAt))
      .limit(limit);
  }

  async createGamePost(post: InsertGamePost): Promise<GamePost> {
    const [newPost] = await db
      .insert(gamePosts)
      .values(post)
      .returning();
    return newPost;
  }

  async deleteGamePost(id: number, userId: string): Promise<void> {
    await db
      .delete(gamePosts)
      .where(and(eq(gamePosts.id, id), eq(gamePosts.userId, userId)));
  }

  // Favorite games operations
  async getUserFavoriteGames(userId: string): Promise<(FavoriteGame & { game: Game })[]> {
    return await db
      .select({
        id: favoriteGames.id,
        userId: favoriteGames.userId,
        gameId: favoriteGames.gameId,
        position: favoriteGames.position,
        createdAt: favoriteGames.createdAt,
        game: {
          id: games.id,
          igdbId: games.igdbId,
          title: games.title,
          description: games.description,
          coverImageUrl: games.coverImageUrl,
          screenshotUrls: games.screenshotUrls,
          genre: games.genre,
          platform: games.platform,
          releaseDate: games.releaseDate,
          developer: games.developer,
          publisher: games.publisher,
          metacriticScore: games.metacriticScore,
          igdbRating: games.igdbRating,
          isRetro: games.isRetro,
          createdAt: games.createdAt,
        },
      })
      .from(favoriteGames)
      .innerJoin(games, eq(games.id, favoriteGames.gameId))
      .where(eq(favoriteGames.userId, userId))
      .orderBy(favoriteGames.position);
  }

  async setFavoriteGame(userId: string, gameId: number, position: number): Promise<FavoriteGame> {
    // First, remove any existing game in this position
    await db
      .delete(favoriteGames)
      .where(and(eq(favoriteGames.userId, userId), eq(favoriteGames.position, position)));

    // Insert the new favorite game
    const [favoriteGame] = await db
      .insert(favoriteGames)
      .values({
        userId,
        gameId,
        position,
      })
      .returning();
    
    return favoriteGame;
  }

  async removeFavoriteGame(userId: string, position: number): Promise<void> {
    await db
      .delete(favoriteGames)
      .where(and(eq(favoriteGames.userId, userId), eq(favoriteGames.position, position)));
  }
}

export const storage = new DatabaseStorage();

// Seed sample games if they don't exist
async function seedSampleGames() {
  try {
    const existingGames = await storage.getAllGames(10);
    if (existingGames.length === 0) {
      console.log("Seeding sample games...");
      
      // Add Skyrim
      await storage.createGame({
        title: "The Elder Scrolls V: Skyrim",
        description: "The Elder Scrolls V: Skyrim is an action role-playing game set in an open world environment. Players take on the role of a Dragonborn, a prophesied figure with the power to combat dragons that have returned to the world.",
        coverImageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
        screenshotUrls: [
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop",
          "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=450&fit=crop",
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=450&fit=crop"
        ],
        genre: "Action RPG",
        platform: "PC, PlayStation, Xbox, Nintendo Switch",
        releaseDate: new Date("2011-11-11"),
        developer: "Bethesda Game Studios",
        publisher: "Bethesda Softworks",
        isRetro: false
      });

      // Add Stardew Valley
      await storage.createGame({
        title: "Stardew Valley",
        description: "Stardew Valley is a simulation role-playing game where you inherit your grandfather's old farm plot in Stardew Valley. Armed with hand-me-down tools and a few coins, you set out to begin your new life.",
        coverImageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop",
        screenshotUrls: [
          "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=450&fit=crop",
          "https://images.unsplash.com/photo-1574177565735-66b9f8e7c9c2?w=800&h=450&fit=crop",
          "https://images.unsplash.com/photo-1542838686-67ce30f7c475?w=800&h=450&fit=crop"
        ],
        genre: "Simulation, Indie",
        platform: "PC, PlayStation, Xbox, Nintendo Switch, Mobile",
        releaseDate: new Date("2016-02-26"),
        developer: "ConcernedApe",
        publisher: "ConcernedApe",
        isRetro: false
      });

      console.log("Sample games seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding sample games:", error);
  }
}

// Call seed function when storage is initialized and update with IGDB data
seedSampleGames().then(() => {
  // Update sample games with IGDB data after seeding
  setTimeout(() => {
    storage.updateSampleGamesWithIGDB().then(() => {
      // Add new games from IGDB after updating existing ones
      return storage.addNewGamesFromIGDB();
    }).then(() => {
      // Update GTA VI with real IGDB data
      return storage.updateGTAVIWithIGDBData();
    }).catch(console.error);
  }, 3000); // Wait 3 seconds for server to fully start
}).catch(console.error);
