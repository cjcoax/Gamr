import { Card, CardContent } from "@/components/ui/card";
import type { UserWithStats } from "@shared/schema";

interface UserStatsProps {
  user: UserWithStats;
}

export default function UserStats({ user }: UserStatsProps) {
  return (
    <section className="px-4 py-6">
      <Card className="bg-gaming-card border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4 mb-4">
            <img 
              src={user.profileImageUrl || "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=100&h=100&fit=crop&crop=face"} 
              alt="Profile picture" 
              className="w-16 h-16 rounded-full object-cover border-2 border-gaming-purple"
            />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.username || "Gaming Enthusiast"}
              </h2>
              <p className="text-slate-400 text-sm">
                @{user.username || user.email?.split("@")[0] || "gamer"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gaming-purple">
                {user.stats?.gamesCompleted || 0}
              </div>
              <div className="text-xs text-slate-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gaming-green">
                {user.stats?.gamesPlaying || 0}
              </div>
              <div className="text-xs text-slate-400">Playing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gaming-violet">
                {user.stats?.gamesWantToPlay || 0}
              </div>
              <div className="text-xs text-slate-400">Backlog</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
