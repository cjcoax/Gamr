import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertGameSchema,
  insertUserGameSchema,
  insertReviewSchema,
  insertActivitySchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithStats(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.patch("/api/users/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = z.object({
        username: z.string().optional(),
        bio: z.string().optional(),
        profileImageUrl: z.string().url().optional(),
        steamUsername: z.string().optional(),
        epicUsername: z.string().optional(),
        battlenetUsername: z.string().optional(),
        psnUsername: z.string().optional(),
        xboxUsername: z.string().optional(),
        nintendoUsername: z.string().optional(),
        eaUsername: z.string().optional(),
        discordUsername: z.string().optional(),
      }).parse(req.body);

      const user = await storage.updateUserProfile(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Game routes
  app.get("/api/games", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const games = await storage.getAllGames(limit, offset);
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const limit = parseInt(req.query.limit as string) || 20;
      const games = await storage.searchGames(query, limit);
      res.json(games);
    } catch (error) {
      console.error("Error searching games:", error);
      res.status(500).json({ message: "Failed to search games" });
    }
  });

  app.get("/api/games/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const games = await storage.getTrendingGames(limit);
      res.json(games);
    } catch (error) {
      console.error("Error fetching trending games:", error);
      res.status(500).json({ message: "Failed to fetch trending games" });
    }
  });

  app.get("/api/games/top-rated", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const games = await storage.getTopRatedGames(limit);
      res.json(games);
    } catch (error) {
      console.error("Error fetching top rated games:", error);
      res.status(500).json({ message: "Failed to fetch top rated games" });
    }
  });

  app.get("/api/games/new-releases", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const games = await storage.getNewReleases(limit);
      res.json(games);
    } catch (error) {
      console.error("Error fetching new releases:", error);
      res.status(500).json({ message: "Failed to fetch new releases" });
    }
  });

  app.get("/api/games/retro", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const games = await storage.getRetroGames(limit);
      res.json(games);
    } catch (error) {
      console.error("Error fetching retro games:", error);
      res.status(500).json({ message: "Failed to fetch retro games" });
    }
  });

  app.get("/api/games/:id", async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || null;
      const game = await storage.getGameWithUserData(gameId, userId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post("/api/games", isAuthenticated, async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  // User library routes
  app.get("/api/library", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = req.query.status as string;
      const userGames = await storage.getUserGames(userId, status);
      res.json(userGames);
    } catch (error) {
      console.error("Error fetching library:", error);
      res.status(500).json({ message: "Failed to fetch library" });
    }
  });

  app.post("/api/library", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userGameData = insertUserGameSchema.parse({
        ...req.body,
        userId,
      });

      // Check if game already exists in library
      const existingUserGame = await storage.getUserGame(userId, userGameData.gameId);
      if (existingUserGame) {
        return res.status(400).json({ message: "Game already in library" });
      }

      const userGame = await storage.addGameToLibrary(userGameData);

      // Create activity
      await storage.createActivity({
        userId,
        gameId: userGameData.gameId,
        type: "added",
        metadata: { status: userGameData.status },
      });

      res.status(201).json(userGame);
    } catch (error) {
      console.error("Error adding game to library:", error);
      res.status(500).json({ message: "Failed to add game to library" });
    }
  });

  app.patch("/api/library/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userGameId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const updateData = z.object({
        status: z.string().optional(),
        progress: z.number().min(0).max(100).optional(),
        rating: z.number().min(1).max(5).optional(),
        hoursPlayed: z.number().min(0).optional(),
      }).parse(req.body);

      // Add completion timestamp if status changed to completed
      const finalUpdateData = updateData.status === "completed" 
        ? { ...updateData, completedAt: new Date() }
        : updateData;

      const userGame = await storage.updateUserGame(userGameId, finalUpdateData);

      // Create activity for certain updates
      if (updateData.status === "completed") {
        await storage.createActivity({
          userId,
          gameId: userGame.gameId,
          type: "completed",
          metadata: { rating: updateData.rating },
        });
      } else if (updateData.rating) {
        await storage.createActivity({
          userId,
          gameId: userGame.gameId,
          type: "rated",
          metadata: { rating: updateData.rating },
        });
      }

      res.json(userGame);
    } catch (error) {
      console.error("Error updating user game:", error);
      res.status(500).json({ message: "Failed to update user game" });
    }
  });

  app.delete("/api/library/:gameId", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = req.user.claims.sub;
      await storage.removeGameFromLibrary(userId, gameId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing game from library:", error);
      res.status(500).json({ message: "Failed to remove game from library" });
    }
  });

  // Review routes
  app.get("/api/games/:gameId/reviews", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const limit = parseInt(req.query.limit as string) || 20;
      const reviews = await storage.getGameReviews(gameId, limit);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching game reviews:", error);
      res.status(500).json({ message: "Failed to fetch game reviews" });
    }
  });

  app.get("/api/users/:userId/reviews", async (req, res) => {
    try {
      const userId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const reviews = await storage.getUserReviews(userId, limit);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = z.object({
        gameId: z.number(),
        rating: z.number().min(1).max(5),
        content: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
      }).parse(req.body);

      const review = await storage.createReview({
        ...reviewData,
        userId,
      });

      // Create activity
      await storage.createActivity({
        userId,
        gameId: reviewData.gameId,
        type: "reviewed",
        metadata: { 
          rating: reviewData.rating,
        },
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.patch("/api/reviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const updateData = z.object({
        rating: z.number().min(1).max(5).optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        spoilers: z.boolean().optional(),
        recommendedFor: z.string().optional(),
      }).parse(req.body);

      const review = await storage.updateReview(reviewId, updateData);
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete("/api/reviews/:id", isAuthenticated, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      await storage.deleteReview(reviewId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await storage.getUserActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/following", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await storage.getFollowingActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching following activities:", error);
      res.status(500).json({ message: "Failed to fetch following activities" });
    }
  });

  // Social routes
  app.post("/api/users/:userId/follow", isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const isAlreadyFollowing = await storage.isFollowing(followerId, followingId);
      if (isAlreadyFollowing) {
        return res.status(400).json({ message: "Already following this user" });
      }

      await storage.followUser(followerId, followingId);
      res.status(201).json({ message: "User followed successfully" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:userId/follow", isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      await storage.unfollowUser(followerId, followingId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get("/api/users/:userId/followers", async (req, res) => {
    try {
      const userId = req.params.userId;
      const followers = await storage.getUserFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get("/api/users/:userId/following", async (req, res) => {
    try {
      const userId = req.params.userId;
      const following = await storage.getUserFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // IGDB Integration routes
  app.get("/api/games/search-igdb", async (req, res) => {
    try {
      const { q, limit } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const results = await storage.searchIGDBGames(q, limit ? parseInt(limit as string) : 20);
      res.json(results);
    } catch (error) {
      console.error("Error searching IGDB games:", error);
      res.status(500).json({ message: "Failed to search games" });
    }
  });

  app.post("/api/games/from-igdb", isAuthenticated, async (req, res) => {
    try {
      const { igdbId } = req.body;
      if (!igdbId) {
        return res.status(400).json({ message: "IGDB ID is required" });
      }

      // Check if game already exists
      const existingGame = await storage.getGameByIGDBId(igdbId);
      if (existingGame) {
        return res.json(existingGame);
      }

      // Create new game from IGDB data
      const newGame = await storage.createGameFromIGDB(igdbId);
      res.json(newGame);
    } catch (error) {
      console.error("Error creating game from IGDB:", error);
      res.status(500).json({ message: "Failed to create game from IGDB data" });
    }
  });

  app.post("/api/admin/update-sample-games", isAuthenticated, async (req, res) => {
    try {
      await storage.updateSampleGamesWithIGDB();
      res.json({ message: "Sample games updated with IGDB data" });
    } catch (error) {
      console.error("Error updating sample games:", error);
      res.status(500).json({ message: "Failed to update sample games" });
    }
  });

  // Game posts routes
  app.get("/api/games/:id/posts", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const posts = await storage.getGamePosts(gameId, limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching game posts:", error);
      res.status(500).json({ message: "Failed to fetch game posts" });
    }
  });

  app.get("/api/users/:id/posts", async (req, res) => {
    try {
      const userId = req.params.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const posts = await storage.getUserGamePosts(userId, limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameId, content, imageUrls, postType } = req.body;

      if (!gameId || !content) {
        return res.status(400).json({ message: "Game ID and content are required" });
      }

      const post = await storage.createGamePost({
        userId,
        gameId: parseInt(gameId),
        content,
        imageUrls: imageUrls || [],
        postType: postType || "text",
      });

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating game post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.delete("/api/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);

      await storage.deleteGamePost(postId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting game post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Media upload endpoint for game posts
  app.post("/api/games/:gameId/upload-media", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = req.user.claims.sub;
      
      // Parse the uploaded image data
      const { imageData, fileName } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "No image data provided" });
      }

      // Validate file size (10MB limit)
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
      const bufferSize = Buffer.byteLength(base64Data, 'base64');
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (bufferSize > maxSize) {
        return res.status(400).json({ message: "File size exceeds 10MB limit" });
      }

      // For demo purposes, we'll store the data URL directly
      // In production, you'd upload to a cloud storage service
      const imageUrl = imageData;

      // Create a media post for this game
      const post = await storage.createGamePost({
        userId,
        gameId,
        content: `Uploaded ${fileName || 'screenshot'}`,
        imageUrls: [imageUrl],
        postType: 'media'
      });

      res.json({ 
        message: "Media uploaded successfully",
        post,
        imageUrl
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
