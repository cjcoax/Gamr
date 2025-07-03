import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, LogOut, Star, Clock, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { Review, Game } from "@shared/schema";

type ReviewWithGame = Review & { game: Game };

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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
            <div className="flex items-center space-x-4 mb-4">
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
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

        {/* Recent Reviews */}
        {userReviews && userReviews.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Recent Reviews</h3>
            <div className="space-y-3">
              {userReviews.slice(0, 5).map((review) => (
                <Card key={review.id} className="bg-gaming-card border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white">{review.game.title}</h4>
                      <div className="flex items-center text-yellow-400">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        <span className="text-sm">{review.rating}</span>
                      </div>
                    </div>
                    {review.title && (
                      <h5 className="font-medium text-gaming-purple text-sm mb-1">
                        {review.title}
                      </h5>
                    )}
                    {review.content && (
                      <p className="text-slate-400 text-sm">
                        {review.content.length > 100 
                          ? `${review.content.substring(0, 100)}...` 
                          : review.content}
                      </p>
                    )}
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" />
    </div>
  );
}
