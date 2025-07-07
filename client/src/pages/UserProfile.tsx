import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import GameCard from "@/components/GameCard";
import type { UserWithStats, UserGame, Game } from "@shared/schema";

interface UserProfileData extends UserWithStats {
  isFollowing: boolean;
}

type UserGameWithGame = UserGame & { game: Game };

export default function UserProfile() {
  const [location, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const userId = location.split('/')[2]; // Extract user ID from /users/:id

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json() as Promise<UserProfileData>;
    },
    enabled: !!userId,
  });

  const { data: userGames } = useQuery({
    queryKey: ["/api/users", userId, "library"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/library`);
      if (!response.ok) throw new Error("Failed to fetch user library");
      return response.json() as Promise<UserGameWithGame[]>;
    },
    enabled: !!userId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      console.log('Attempting to follow user:', userId);
      const result = await apiRequest('POST', `/api/users/${userId}/follow`);
      console.log('Follow result:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      toast({
        title: "Success",
        description: `Now following ${getDisplayName()}!`,
      });
    },
    onError: (error) => {
      console.error('Follow error:', error);
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
        description: `Failed to follow user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      toast({
        title: "Success",
        description: `Unfollowed ${getDisplayName()}`,
      });
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
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDisplayName = () => {
    if (!user) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    return user.email?.split('@')[0] || 'Unknown User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto bg-gaming-dark min-h-screen">
        <header className="sticky top-0 z-50 bg-gaming-dark/95 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center px-4 py-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/search")}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors mr-3"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Button>
            <h1 className="text-lg font-semibold text-white">User Profile</h1>
          </div>
        </header>
        
        <div className="p-4 space-y-4">
          <div className="bg-gaming-card rounded-xl p-6 border border-slate-700/50 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-slate-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-sm mx-auto bg-gaming-dark min-h-screen">
        <header className="sticky top-0 z-50 bg-gaming-dark/95 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center px-4 py-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/search")}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors mr-3"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Button>
            <h1 className="text-lg font-semibold text-white">User Profile</h1>
          </div>
        </header>
        
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-slate-400">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = false; // For now, assume all profiles are other users

  return (
    <div className="max-w-sm mx-auto bg-gaming-dark min-h-screen">
      <header className="sticky top-0 z-50 bg-gaming-dark/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/search")}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors mr-3"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Button>
          <h1 className="text-lg font-semibold text-white">Profile</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gaming-card border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-gaming-purple text-white text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">
                  {getDisplayName()}
                </h2>
                {user.username && user.username !== getDisplayName() && (
                  <p className="text-gaming-purple">@{user.username}</p>
                )}
                {user.bio && (
                  <p className="text-slate-300 mt-2">{user.bio}</p>
                )}
              </div>

              {!isOwnProfile && (
                <Button
                  onClick={() => {
                    console.log('Button clicked, isFollowing:', user.isFollowing);
                    if (user.isFollowing) {
                      unfollowMutation.mutate();
                    } else {
                      followMutation.mutate();
                    }
                  }}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  variant={user.isFollowing ? "outline" : "default"}
                  size="sm"
                  className={user.isFollowing 
                    ? "border-gaming-purple text-gaming-purple hover:bg-gaming-purple hover:text-white" 
                    : "bg-gaming-purple hover:bg-gaming-violet text-white"
                  }
                >
                  {user.isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-gaming-green">
                  {user.stats.gamesCompleted}
                </div>
                <div className="text-xs text-slate-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gaming-purple">
                  {user.stats.gamesPlaying}
                </div>
                <div className="text-xs text-slate-400">Playing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-400">
                  {user.stats.gamesWantToPlay}
                </div>
                <div className="text-xs text-slate-400">Want to Play</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {user.stats.gamesDNF}
                </div>
                <div className="text-xs text-slate-400">DNF</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games Library */}
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
            <TabsTrigger value="games">Library</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="games" className="mt-4">
            {userGames && userGames.length > 0 ? (
              <div className="space-y-3">
                {userGames.slice(0, 10).map((userGame) => (
                  <GameCard 
                    key={userGame.id} 
                    game={userGame.game} 
                    userGame={userGame}
                    showProgress={true}
                  />
                ))}
                {userGames.length > 10 && (
                  <p className="text-center text-slate-400 text-sm">
                    Showing 10 of {userGames.length} games
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">No games in library</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-4">
            <div className="text-center py-8">
              <p className="text-slate-400">Reviews coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}