import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useLocation } from "wouter";
import type { ActivityWithDetails } from "@shared/schema";

export default function RecentActivity() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities/following"],
    queryFn: async () => {
      const response = await fetch("/api/activities/following?limit=5");
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json() as Promise<ActivityWithDetails[]>;
    },
    enabled: !!user,
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating 
                ? "text-yellow-400 fill-current" 
                : "text-slate-400"
            }`}
          />
        ))}
      </div>
    );
  };

  const getActivityText = (activity: ActivityWithDetails) => {
    const username = activity.user.username || activity.user.firstName || "Someone";
    const gameName = activity.game?.title || "a game";

    switch (activity.type) {
      case "completed":
        return { action: " completed ", gameName };
      case "started":
        return { action: " started playing ", gameName };
      case "rated":
        return { action: " rated ", gameName };
      case "reviewed":
        return { action: " reviewed ", gameName };
      case "added":
        return { action: " added ", gameName: `${gameName} to their library` };
      default:
        return { action: " updated ", gameName };
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!activities || activities.length === 0) {
    return (
      <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        
        <Card className="bg-gaming-card border-slate-700/50">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-gaming-card rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👥</span>
            </div>
            <h4 className="font-medium text-white mb-1">No Activity Yet</h4>
            <p className="text-slate-400 text-sm">
              Follow other users to see their gaming activities here
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="px-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <Button 
          variant="ghost"
          className="text-gaming-purple text-sm font-medium hover:bg-transparent"
        >
          View All
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gaming-card border-slate-700/50 animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const { action, gameName } = getActivityText(activity);
            const username = activity.user.username || activity.user.firstName || "Someone";
            const rating = activity.metadata?.rating as number;

            return (
              <Card key={activity.id} className="bg-gaming-card border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <img 
                      src={activity.user.profileImageUrl || "https://images.unsplash.com/photo-1606503153255-59d8b8b82176?w=40&h=40&fit=crop&crop=face"} 
                      alt={`${username} avatar`} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        <span className="font-medium">{username}</span>
                        <span className="text-slate-400">{action}</span>
                        <span 
                          className="font-medium text-gaming-purple cursor-pointer hover:underline"
                          onClick={() => activity.gameId && setLocation(`/game/${activity.gameId}`)}
                        >
                          {gameName}
                        </span>
                      </p>
                      <div className="flex items-center mt-1">
                        {rating && (
                          <div className="flex text-yellow-400 mr-2">
                            {renderStars(rating)}
                          </div>
                        )}
                        <span className="text-slate-400 text-xs">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
