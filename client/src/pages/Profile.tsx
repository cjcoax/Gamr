import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BottomNavigation from "@/components/BottomNavigation";
import EditProfileDialog from "@/components/EditProfileDialog";
import FavoriteGameDialog from "@/components/FavoriteGameDialog";
import PostInteractions from "@/components/PostInteractions";
import ImageModal from "@/components/ImageModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, Star, Clock, CheckCircle, Edit, Gamepad2, Plus, MessageSquare, Camera, X } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Review, Game, FavoriteGame } from "@shared/schema";

type ReviewWithGame = Review & { game: Game };

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFavoriteDialog, setShowFavoriteDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number>(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userReviews } = useQuery({
    queryKey: ["/api/users", user?.id, "reviews"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/reviews`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json() as Promise<ReviewWithGame[]>;
    },
    enabled: !!user?.id,
  });

  const { data: userPosts } = useQuery({
    queryKey: ["/api/users", user?.id, "posts"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/posts`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: favoriteGames = [] } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const response = await fetch("/api/favorites");
      if (!response.ok) throw new Error("Failed to fetch favorites");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (position: number) => {
      const response = await fetch(`/api/favorites/${position}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Failed to remove favorite");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Favorite Removed",
        description: "Game removed from favorites",
      });
    },
  });

  const handleAddFavorite = (position: number) => {
    setSelectedPosition(position);
    setShowFavoriteDialog(true);
  };

  const handleRemoveFavorite = (position: number) => {
    removeFavoriteMutation.mutate(position);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-gaming-dark min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gaming-dark/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/")}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors mr-3"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Button>
            <h1 className="text-xl font-bold text-white">Profile</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      </header>

      <div className="p-4 pb-20">
        {/* Profile Info */}
        <Card className="bg-gaming-card border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <img 
                  src={user.profileImageUrl || "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=100&h=100&fit=crop&crop=face"} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-gaming-purple"
                />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.username || "Gaming Enthusiast"}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {user.email}
                  </p>
                  {user.bio && (
                    <p className="text-slate-300 text-sm mt-1">{user.bio}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Edit className="w-4 h-4 text-slate-400" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gaming-violet">
                  {user.stats?.gamesCompleted || 0}
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gaming-purple">
                  {user.stats?.gamesPlaying || 0}
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Playing
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gaming-green">
                  {user.stats?.gamesWantToPlay || 0}
                </div>
                <div className="text-xs text-slate-400">Backlog</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {user.stats?.gamesDNF || 0}
                </div>
                <div className="text-xs text-slate-400">DNF</div>
              </div>
            </div>

            {user.stats?.totalHoursPlayed ? (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {user.stats.totalHoursPlayed} hours
                  </div>
                  <div className="text-xs text-slate-400">Total playtime</div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Gaming Platform Usernames */}
        {(user.steamUsername || user.epicUsername || user.battlenetUsername || 
          user.psnUsername || user.xboxUsername || user.nintendoUsername || 
          user.eaUsername || user.discordUsername) && (
          <Card className="bg-gaming-card border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Gaming Platforms</h3>
              <div className="grid grid-cols-2 gap-4">
                {user.steamUsername && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">ST</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Steam</div>
                      <div className="text-sm text-white">{user.steamUsername}</div>
                    </div>
                  </div>
                )}
                
                {user.epicUsername && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">EP</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Epic Games</div>
                      <div className="text-sm text-white">{user.epicUsername}</div>
                    </div>
                  </div>
                )}
                
                {user.battlenetUsername && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">BN</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Battle.net</div>
                      <div className="text-sm text-white">{user.battlenetUsername}</div>
                    </div>
                  </div>
                )}
                
                {user.psnUsername && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">PS</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">PlayStation</div>
                      <div className="text-sm text-white">{user.psnUsername}</div>
                    </div>
                  </div>
                )}
                
                {user.xboxUsername && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">XB</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Xbox Live</div>
                      <div className="text-sm text-white">{user.xboxUsername}</div>
                    </div>
                  </div>
                )}
                
                {user.nintendoUsername && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">NI</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Nintendo</div>
                      <div className="text-sm text-white">{user.nintendoUsername}</div>
                    </div>
                  </div>
                )}
                
                {user.eaUsername && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">EA</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">EA</div>
                      <div className="text-sm text-white">{user.eaUsername}</div>
                    </div>
                  </div>
                )}
                
                {user.discordUsername && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">DC</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Discord</div>
                      <div className="text-sm text-white">{user.discordUsername}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Favorite Games */}
        <Card className="bg-gaming-card border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-gaming-purple mr-2" />
                <h3 className="text-lg font-semibold text-white">Favorite Games</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((position) => {
                const favorite = favoriteGames.find((f: any) => f.position === position);
                return (
                  <div key={position} className="relative group">
                    {favorite ? (
                      <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-600 min-h-[120px] flex flex-col">
                        <button
                          onClick={() => handleRemoveFavorite(position)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {favorite.game.coverImageUrl && (
                          <img
                            src={favorite.game.coverImageUrl}
                            alt={favorite.game.title}
                            className="w-full h-16 object-cover rounded mb-2"
                          />
                        )}
                        <div className="flex-1 flex flex-col justify-end">
                          <h4 className="text-xs font-medium text-white line-clamp-2">{favorite.game.title}</h4>
                          <div className="text-xs text-slate-400 mt-1">#{position}</div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddFavorite(position)}
                        className="bg-slate-800/50 rounded-lg p-3 border border-dashed border-slate-600 flex flex-col items-center justify-center text-center min-h-[120px] hover:bg-slate-700/50 transition-colors w-full"
                      >
                        <Plus className="w-6 h-6 text-slate-500 mb-2" />
                        <span className="text-xs text-slate-500">Add favorite #{position}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {(() => {
          const activities: any[] = [];
          
          // Add reviews as activities
          if (userReviews) {
            userReviews.forEach((review: any) => {
              activities.push({
                id: `review-${review.id}`,
                type: 'review',
                game: review.game,
                content: review.content,
                title: review.title,
                rating: review.rating,
                imageUrl: review.imageUrl,
                createdAt: review.createdAt,
              });
            });
          }
          
          // Add posts as activities
          if (userPosts) {
            userPosts.forEach((post: any) => {
              activities.push({
                id: `post-${post.id}`,
                postId: post.id, // Include actual post ID for interactions
                type: post.postType || 'post',
                game: post.game,
                content: post.content,
                imageUrls: post.imageUrls,
                createdAt: post.createdAt,
              });
            });
          }
          
          // Sort by creation date (newest first)
          activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          return activities.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activities.slice(0, 10).map((activity) => (
                  <Card key={activity.id} className="bg-gaming-card border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          {activity.type === 'review' && (
                            <MessageSquare className="w-4 h-4 text-gaming-purple" />
                          )}
                          {activity.type === 'media' && (
                            <Camera className="w-4 h-4 text-gaming-purple" />
                          )}
                          {activity.type === 'post' && (
                            <Edit className="w-4 h-4 text-gaming-purple" />
                          )}
                          <h4 className="font-semibold text-white">{activity.game?.title}</h4>
                        </div>
                        {activity.type === 'review' && activity.rating && (
                          <div className="flex items-center text-yellow-400">
                            <Star className="w-4 h-4 mr-1 fill-current" />
                            <span className="text-sm">{activity.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      {activity.title && (
                        <h5 className="font-medium text-gaming-purple text-sm mb-1">
                          {activity.title}
                        </h5>
                      )}
                      
                      {activity.content && (
                        <p className="text-slate-400 text-sm mb-2">
                          {activity.content.length > 100 
                            ? `${activity.content.substring(0, 100)}...` 
                            : activity.content}
                        </p>
                      )}
                      
                      {/* Show media for posts */}
                      {activity.type === 'media' && activity.imageUrls && activity.imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {activity.imageUrls.slice(0, 4).map((imageUrl: string, index: number) => (
                            <ImageModal
                              key={index}
                              src={imageUrl}
                              alt="User media"
                              className="w-full h-16"
                            >
                              <img
                                src={imageUrl}
                                alt="User media"
                                className="w-full h-16 object-cover rounded border border-slate-600"
                              />
                            </ImageModal>
                          ))}
                        </div>
                      )}
                      
                      {/* Show single image for reviews */}
                      {activity.type === 'review' && activity.imageUrl && (
                        <div className="mb-2">
                          <ImageModal
                            src={activity.imageUrl}
                            alt="Review media"
                            className="w-24 h-16"
                          >
                            <img
                              src={activity.imageUrl}
                              alt="Review media"
                              className="w-24 h-16 object-cover rounded border border-slate-600"
                            />
                          </ImageModal>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-slate-500 text-xs">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                        <span className="text-xs text-slate-500 capitalize">
                          {activity.type === 'media' ? 'Photo Upload' : activity.type}
                        </span>
                      </div>
                      
                      {/* Add PostInteractions for posts */}
                      {activity.postId && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <PostInteractions postId={activity.postId} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null;
        })()}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" />

      {/* Edit Profile Dialog */}
      <EditProfileDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        user={user} 
      />

      {/* Favorite Game Dialog */}
      <FavoriteGameDialog
        open={showFavoriteDialog}
        onOpenChange={setShowFavoriteDialog}
        position={selectedPosition}
      />
    </div>
  );
}
