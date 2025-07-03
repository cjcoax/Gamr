import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Star, Plus, Edit, Upload, Image, Calendar, Users, MessageSquare } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import BottomNavigation from "@/components/BottomNavigation";
import type { GameWithUserData, Review } from "@shared/schema";

export default function GameDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review dialog state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewImage, setReviewImage] = useState<string | null>(null);

  // Post dialog state
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postContent, setPostContent] = useState("");

  // Helper function to render star ratings
  const renderStarRating = (rating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'fill-gaming-purple text-gaming-purple' 
            : 'text-slate-600'
        }`}
      />
    ));
  };

  const { data: game, isLoading } = useQuery({
    queryKey: ["/api/games", id],
    enabled: !!id,
  });

  // Debug logging
  console.log("GameDetail debug:", { id, isLoading, game });

  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/games", id, "reviews"],
    enabled: !!id,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["/api/games", id, "posts"],
    enabled: !!id,
  });

  const addToLibraryMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("POST", "/api/library", {
        gameId: parseInt(id!),
        status,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Game added to library!" });
      queryClient.invalidateQueries({ queryKey: ["/api/games", id] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add game to library",
        variant: "destructive",
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const reviewData: any = {
        gameId: parseInt(id!),
        rating: reviewRating,
      };
      
      // Only include optional fields if they have values
      if (reviewText.trim()) {
        reviewData.content = reviewText.trim();
      }
      if (reviewImage) {
        reviewData.imageUrl = reviewImage;
      }
      
      await apiRequest("POST", "/api/reviews", reviewData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Review submitted successfully!" });
      setShowReviewDialog(false);
      setReviewRating(0);
      setReviewText("");
      setReviewImage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/games", id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games", id] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/posts", {
        gameId: parseInt(id!),
        content: postContent,
        postType: "text",
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Post created successfully!" });
      setShowPostDialog(false);
      setPostContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/games", id, "posts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setReviewImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, size: string = "w-4 h-4") => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-slate-400"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={interactive ? () => setReviewRating(star) : undefined}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark text-slate-50">
        <div className="max-w-sm mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-slate-800 rounded-lg"></div>
            <div className="h-8 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!game || !game.id || !game.title) {
    return (
      <div className="min-h-screen bg-gaming-dark text-slate-50">
        <div className="max-w-sm mx-auto p-4 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Game not found</h2>
          <Button onClick={() => setLocation("/")} className="bg-gaming-purple hover:bg-gaming-violet">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const averageRating = game.averageRating || 0;
  const reviewCount = game.reviewCount || 0;
  const userReview = reviews.find((review: any) => review.user?.id === user?.id);

  return (
    <div className="min-h-screen bg-gaming-dark text-slate-50">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <header className="sticky top-0 bg-gaming-dark/95 backdrop-blur-sm border-b border-slate-800 z-10">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Button>
            <h1 className="text-lg font-semibold text-white truncate mx-4">
              {game.title}
            </h1>
            <div className="w-9"></div>
          </div>
        </header>

        <div className="pb-20">
          {/* Hero Image */}
          <div className="relative">
            <img
              src={game.coverImageUrl || "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=600&fit=crop"}
              alt={game.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gaming-dark/80 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-2xl font-bold text-white mb-2">{game.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-slate-300">
                <div className="flex items-center space-x-1">
                  {renderStars(Math.round(averageRating))}
                  <span>{averageRating.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{reviewCount} reviews</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-4 space-y-3">
            {!game.userGame ? (
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => addToLibraryMutation.mutate("want_to_play")}
                  disabled={addToLibraryMutation.isPending}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs"
                >
                  Want to Play
                </Button>
                <Button
                  onClick={() => addToLibraryMutation.mutate("playing")}
                  disabled={addToLibraryMutation.isPending}
                  className="bg-gaming-purple hover:bg-gaming-violet text-white text-xs"
                >
                  Playing
                </Button>
                <Button
                  onClick={() => addToLibraryMutation.mutate("completed")}
                  disabled={addToLibraryMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                  Completed
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Badge className="bg-gaming-purple text-white">
                  {game.userGame.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            )}

            {/* Review Button */}
            {!userReview && (
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gaming-purple hover:bg-gaming-violet text-white">
                    <Star className="w-4 h-4 mr-2" />
                    Write Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gaming-card border-slate-700 text-white max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Review {game.title}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Share your rating and thoughts about this game
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-300 mb-2 block">
                        Rating (required)
                      </Label>
                      {renderStars(reviewRating, true, "w-8 h-8")}
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-300">
                        Review (optional)
                      </Label>
                      <Textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="bg-gaming-dark border-slate-600 text-white mt-1"
                        placeholder="Share your thoughts about this game..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-300 mb-2 block">
                        Add Photo (optional)
                      </Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </Button>
                      {reviewImage && (
                        <div className="mt-2">
                          <img
                            src={reviewImage}
                            alt="Review"
                            className="w-20 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowReviewDialog(false)}
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => submitReviewMutation.mutate()}
                        disabled={reviewRating === 0 || submitReviewMutation.isPending}
                        className="flex-1 bg-gaming-purple hover:bg-gaming-violet text-white"
                      >
                        {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Tabbed Content */}
          <div className="px-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gaming-card border-slate-700">
                <TabsTrigger value="info" className="data-[state=active]:bg-gaming-purple data-[state=active]:text-white">
                  Game Info
                </TabsTrigger>
                <TabsTrigger value="media" className="data-[state=active]:bg-gaming-purple data-[state=active]:text-white">
                  User Media
                </TabsTrigger>
                <TabsTrigger value="posts" className="data-[state=active]:bg-gaming-purple data-[state=active]:text-white">
                  Posts
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Game Details */}
                <Card className="bg-gaming-card border-slate-700">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-1">Description</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {game.description || "No description available."}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Genre:</span>
                        <p className="text-white">{game.genre || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Platform:</span>
                        <p className="text-white">{game.platform || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Developer:</span>
                        <p className="text-white">{game.developer || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Release Date:</span>
                        <p className="text-white">
                          {game.releaseDate 
                            ? new Date(game.releaseDate).getFullYear()
                            : "Unknown"
                          }
                        </p>
                      </div>
                    </div>

                    {/* Ratings Section */}
                    <div className="border-t border-slate-600 pt-4 space-y-3">
                      <h3 className="text-sm font-medium text-slate-400">Ratings</h3>
                      <div className="space-y-2">
                        {/* User Reviews */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Gamr Users</span>
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {renderStarRating(averageRating, false)}
                            </div>
                            <span className="text-sm text-white">
                              {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                            </span>
                          </div>
                        </div>
                        
                        {/* IGDB Rating */}
                        {game.igdbRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">IGDB Community</span>
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {renderStarRating(game.igdbRating, false)}
                              </div>
                              <span className="text-sm text-white">
                                {game.igdbRating.toFixed(1)} / 5.0
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Screenshots */}
                {game.screenshotUrls && game.screenshotUrls.length > 0 && (
                  <Card className="bg-gaming-card border-slate-700">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-slate-400 mb-3">Screenshots</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {game.screenshotUrls.map((url: string, index: number) => (
                          <img
                            key={index}
                            src={url}
                            alt={`${game.title} screenshot ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-slate-600"
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gamr Reviews */}
                <Card className="bg-gaming-card border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-400">Gamr Reviews</h3>
                      <div className="flex items-center space-x-2 text-sm text-slate-300">
                        {renderStars(Math.round(averageRating))}
                        <span>{averageRating.toFixed(1)} ({reviewCount})</span>
                      </div>
                    </div>
                    
                    {reviews.length > 0 ? (
                      <div className="space-y-3">
                        {reviews.slice(0, 3).map((review: any) => (
                          <div key={review.id} className="border-b border-slate-700 last:border-b-0 pb-3 last:pb-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={review.user?.profileImageUrl || "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=32&h=32&fit=crop&crop=face"}
                                  alt={review.user?.username || "User"}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                                <span className="text-sm text-white font-medium">
                                  {review.user?.username || "Anonymous"}
                                </span>
                              </div>
                              {renderStars(review.rating || 0)}
                            </div>
                            {review.content && (
                              <p className="text-sm text-slate-300 mb-2">{review.content}</p>
                            )}
                            {review.imageUrl && (
                              <img
                                src={review.imageUrl}
                                alt="Review"
                                className="w-20 h-20 object-cover rounded border border-slate-600"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No reviews yet. Be the first to review!</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="media" className="space-y-4 mt-4">
                <Card className="bg-gaming-card border-slate-700">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-slate-400 mb-3">User-Uploaded Media</h3>
                    
                    {/* Filter reviews that have images */}
                    {(() => {
                      const reviewsWithImages = reviews.filter((review: any) => review.imageUrl);
                      return reviewsWithImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {reviewsWithImages.map((review: any) => (
                            <div key={review.id} className="space-y-2">
                              <img
                                src={review.imageUrl}
                                alt={`Review by ${review.user?.username || "User"}`}
                                className="w-full h-24 object-cover rounded border border-slate-600"
                              />
                              <div className="flex items-center space-x-2">
                                <img
                                  src={review.user?.profileImageUrl || "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=20&h=20&fit=crop&crop=face"}
                                  alt={review.user?.username || "User"}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="text-xs text-slate-400">
                                  {review.user?.username || "Anonymous"}
                                </span>
                                {renderStars(review.rating || 0, false, "w-3 h-3")}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Image className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-400 mb-2">No user media yet</p>
                          <p className="text-xs text-slate-500">Photos from reviews will appear here</p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="posts" className="space-y-4 mt-4">
                {/* Create Post Button */}
                {user && (
                  <div className="flex justify-end">
                    <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-gaming-purple hover:bg-gaming-violet text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gaming-card border-slate-700 text-white max-w-md mx-auto">
                        <DialogHeader>
                          <DialogTitle className="text-white">Create Post about {game?.title}</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Share your thoughts, progress, or screenshots about this game
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="post-content" className="text-slate-300">Content</Label>
                            <Textarea
                              id="post-content"
                              placeholder="What's happening in your playthrough?"
                              value={postContent}
                              onChange={(e) => setPostContent(e.target.value)}
                              className="bg-slate-800 border-slate-700 text-white resize-none"
                              rows={4}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowPostDialog(false)}
                              className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => createPostMutation.mutate()}
                              disabled={!postContent.trim() || createPostMutation.isPending}
                              className="bg-gaming-purple hover:bg-gaming-violet text-white"
                            >
                              {createPostMutation.isPending ? "Posting..." : "Post"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* Posts List */}
                <Card className="bg-gaming-card border-slate-700">
                  <CardContent className="p-4">
                    {(() => {
                      const gamePosts = Array.isArray(posts) ? posts : [];
                      return gamePosts.length > 0 ? (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-slate-400 mb-3">Community Posts</h3>
                          {gamePosts.map((post: any) => (
                            <div key={post.id} className="border-b border-slate-700 pb-4 last:border-b-0 last:pb-0">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gaming-purple flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {post.user?.username?.[0] || post.user?.firstName?.[0] || "U"}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-white">
                                      {post.user?.username || post.user?.firstName || "Anonymous"}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {new Date(post.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-300">{post.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-400 mb-2">No posts yet</p>
                          <p className="text-xs text-slate-500">Be the first to share your thoughts about this game!</p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <BottomNavigation activeTab="" />
      </div>
    </div>
  );
}