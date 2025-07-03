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

  app.get("/api/games/:id", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
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
        content: z.string().optional(),
        imageUrl: z.string().optional(),
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

  const httpServer = createServer(app);
  return httpServer;
}
