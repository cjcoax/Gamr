import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import GameCard from "./GameCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { UserGame, Game } from "@shared/schema";

type UserGameWithGame = UserGame & { game: Game };

export default function CurrentlyPlaying() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: currentlyPlayingGames, isLoading } = useQuery({
    queryKey: ["/api/library", { status: "currently_playing" }],
    queryFn: async () => {
      const response = await fetch("/api/library?status=currently_playing");
      if (!response.ok) throw new Error("Failed to fetch currently playing games");
      return response.json() as Promise<UserGameWithGame[]>;
    },
    enabled: !!user,
  });

  if (!currentlyPlayingGames || currentlyPlayingGames.length === 0) {
    return null;
  }

  return (
    <section className="px-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Currently Playing</h3>
        <Button 
          variant="ghost"
          onClick={() => setLocation("/library")}
          className="text-gaming-purple text-sm font-medium hover:bg-transparent"
        >
          View All
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gaming-card rounded-xl p-4 border border-slate-700/50 animate-pulse">
              <div className="flex space-x-3">
                <div className="w-20 h-28 bg-slate-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {currentlyPlayingGames.slice(0, 3).map((userGame) => (
            <GameCard 
              key={userGame.id} 
              game={userGame.game} 
              userGame={userGame}
              showProgress={true}
            />
          ))}
        </div>
      )}
    </section>
  );
}
