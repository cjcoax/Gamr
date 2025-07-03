import {
  users,
  games,
  userGames,
  reviews,
  activities,
  userFollows,
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
  type GameWithUserData,
  type UserWithStats,
  type ActivityWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithStats(id: string): Promise<UserWithStats | undefined>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;

  // Game operations
  getAllGames(limit?: number, offset?: number): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  getGameWithUserData(gameId: number, userId: string): Promise<GameWithUserData | undefined>;
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

  // Game operations
  async getAllGames(limit = 50, offset = 0): Promise<Game[]> {
    return db.select().from(games).limit(limit).offset(offset).orderBy(desc(games.createdAt));
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getGameWithUserData(gameId: number, userId: string): Promise<GameWithUserData | undefined> {
    const [gameResult] = await db
      .select({
        game: games,
        userGame: userGames,
        averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
        reviewCount: sql<number>`count(${reviews.id})`,
      })
      .from(games)
      .leftJoin(userGames, and(eq(userGames.gameId, gameId), eq(userGames.userId, userId)))
      .leftJoin(reviews, eq(reviews.gameId, gameId))
      .where(eq(games.id, gameId))
      .groupBy(games.id, userGames.id);

    if (!gameResult) return undefined;

    return {
      ...gameResult.game,
      userGame: gameResult.userGame || undefined,
      averageRating: Number(gameResult.averageRating) || 0,
      reviewCount: Number(gameResult.reviewCount) || 0,
    };
  }

  async searchGames(query: string, limit = 20): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(
        or(
          like(games.title, `%${query}%`),
          like(games.description, `%${query}%`),
          like(games.genre, `%${query}%`),
          like(games.developer, `%${query}%`)
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

// Call seed function when storage is initialized
seedSampleGames();
