import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  real,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  // Gaming platform usernames
  steamUsername: varchar("steam_username"),
  epicUsername: varchar("epic_username"),
  battlenetUsername: varchar("battlenet_username"),
  psnUsername: varchar("psn_username"),
  xboxUsername: varchar("xbox_username"),
  nintendoUsername: varchar("nintendo_username"),
  eaUsername: varchar("ea_username"),
  discordUsername: varchar("discord_username"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  igdbId: integer("igdb_id").unique(), // IGDB game ID for syncing
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  coverImageUrl: varchar("cover_image_url"),
  screenshotUrls: text("screenshot_urls").array(),
  genre: varchar("genre", { length: 100 }),
  platform: varchar("platform", { length: 100 }),
  releaseDate: timestamp("release_date"),
  developer: varchar("developer", { length: 255 }),
  publisher: varchar("publisher", { length: 255 }),
  metacriticScore: integer("metacritic_score"),
  igdbRating: real("igdb_rating"), // Rating from IGDB
  isRetro: boolean("is_retro").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User games relationship (library)
export const userGames = pgTable("user_games", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(), // want_to_play, currently_playing, completed
  progress: integer("progress").default(0), // percentage 0-100
  rating: real("rating"), // 1-5 stars
  hoursPlayed: integer("hours_played").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  rating: real("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  content: text("content"),
  imageUrl: varchar("image_url"),
  spoilers: boolean("spoilers").default(false),
  recommendedFor: text("recommended_for"), // comma-separated tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity feed
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("game_id").references(() => games.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // completed, started, rated, reviewed
  metadata: jsonb("metadata"), // additional data like rating, review excerpt
  createdAt: timestamp("created_at").defaultNow(),
});

// User relationships for social features
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game posts (user posts about games - separate from reviews)
export const gamePosts = pgTable("game_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrls: text("image_urls").array(),
  postType: varchar("post_type", { length: 50 }).notNull().default("text"), // text, image, screenshot
  createdAt: timestamp("created_at").defaultNow(),
});

export const favoriteGames = pgTable("favorite_games", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  position: integer("position").notNull(), // 1-4 for the 4 slots
  createdAt: timestamp("created_at").defaultNow(),
});

// Post reactions table
export const postReactions = pgTable("post_reactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => gamePosts.id, { onDelete: "cascade" }),
  reactionType: varchar("reaction_type").notNull(), // 'like', 'heart', 'laugh', 'sad', 'wow', 'angry'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_post_reactions").on(table.postId),
  index("idx_user_reactions").on(table.userId),
  // Ensure one reaction per user per post
  index("idx_unique_user_post_reaction").on(table.userId, table.postId),
]);

// Post comments table
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => gamePosts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_post_comments").on(table.postId),
  index("idx_user_comments").on(table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userGames: many(userGames),
  reviews: many(reviews),
  activities: many(activities),
  followers: many(userFollows, { relationName: "following" }),
  following: many(userFollows, { relationName: "follower" }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  userGames: many(userGames),
  reviews: many(reviews),
  activities: many(activities),
  posts: many(gamePosts),
}));

export const userGamesRelations = relations(userGames, ({ one }) => ({
  user: one(users, {
    fields: [userGames.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [userGames.gameId],
    references: [games.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [reviews.gameId],
    references: [games.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [activities.gameId],
    references: [games.id],
  }),
}));

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const gamePostsRelations = relations(gamePosts, ({ one, many }) => ({
  user: one(users, {
    fields: [gamePosts.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [gamePosts.gameId],
    references: [games.id],
  }),
  reactions: many(postReactions),
  comments: many(postComments),
}));

export const favoriteGamesRelations = relations(favoriteGames, ({ one }) => ({
  user: one(users, {
    fields: [favoriteGames.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [favoriteGames.gameId],
    references: [games.id],
  }),
}));

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
  user: one(users, {
    fields: [postReactions.userId],
    references: [users.id],
  }),
  post: one(gamePosts, {
    fields: [postReactions.postId],
    references: [gamePosts.id],
  }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  user: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
  post: one(gamePosts, {
    fields: [postComments.postId],
    references: [gamePosts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertUserGameSchema = createInsertSchema(userGames).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true,
});

export const insertGamePostSchema = createInsertSchema(gamePosts).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteGameSchema = createInsertSchema(favoriteGames).omit({
  id: true,
  createdAt: true,
});

export const insertPostReactionSchema = createInsertSchema(postReactions).omit({
  id: true,
  createdAt: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type UserGame = typeof userGames.$inferSelect;
export type InsertUserGame = z.infer<typeof insertUserGameSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type GamePost = typeof gamePosts.$inferSelect;
export type InsertGamePost = z.infer<typeof insertGamePostSchema>;
export type FavoriteGame = typeof favoriteGames.$inferSelect;
export type InsertFavoriteGame = z.infer<typeof insertFavoriteGameSchema>;
export type PostReaction = typeof postReactions.$inferSelect;
export type InsertPostReaction = z.infer<typeof insertPostReactionSchema>;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;

// Additional types for API responses
export type GameWithUserData = Game & {
  userGame?: UserGame;
  averageRating?: number;
  reviewCount?: number;
};

export type UserWithStats = User & {
  stats: {
    gamesCompleted: number;
    gamesPlaying: number;
    gamesWantToPlay: number;
    totalHoursPlayed: number;
    averageRating: number;
  };
};

export type ActivityWithDetails = Activity & {
  user: User;
  game?: Game;
};

export type PostWithDetails = GamePost & {
  user: User;
  game: Game;
  reactions: (PostReaction & { user: User })[];
  comments: (PostComment & { user: User })[];
  reactionCounts: {
    like: number;
    heart: number;
    laugh: number;
    sad: number;
    wow: number;
    angry: number;
  };
  userReaction?: string;
};
