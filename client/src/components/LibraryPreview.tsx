import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Gamepad, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { UserGame, Game } from "@shared/schema";

type UserGameWithGame = UserGame & { game: Game };

export default function LibraryPreview() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: userGames, isLoading } = useQuery({
    queryKey: ["/api/library"],
    enabled: !!user,
  });

  const getShelfCounts = () => {
    if (!userGames) return { wantToPlay: 0, playing: 0, completed: 0 };
    
    return userGames.reduce((acc: any, userGame: UserGameWithGame) => {
      switch (userGame.status) {
        case "want_to_play":
          acc.wantToPlay++;
          break;
        case "playing":
          acc.playing++;
          break;
        case "completed":
          acc.completed++;
          break;
      }
      return acc;
    }, { wantToPlay: 0, playing: 0, completed: 0 });
  };

  const shelves = getShelfCounts();

  return (
    <section className="px-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Library</h3>
        <Button 
          variant="ghost"
          onClick={() => setLocation("/library")}
          className="text-gaming-purple text-sm font-medium hover:bg-transparent"
        >
          Manage
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gaming-card border-slate-700/50 animate-pulse">
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 bg-slate-700 rounded-full mx-auto mb-2"></div>
                <div className="h-3 bg-slate-700 rounded mb-1"></div>
                <div className="h-6 bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Card 
            className="bg-gaming-card border-slate-700/50 hover:border-gaming-green/50 transition-colors cursor-pointer"
            onClick={() => setLocation("/library")}
          >
            <CardContent className="p-3 text-center">
              <div className="text-gaming-green text-2xl mb-2 flex justify-center">
                <Play className="w-6 h-6" />
              </div>
              <div className="font-medium text-white text-sm">Want to Play</div>
              <div className="text-gaming-green text-lg font-bold">{shelves.wantToPlay}</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gaming-card border-slate-700/50 hover:border-gaming-purple/50 transition-colors cursor-pointer"
            onClick={() => setLocation("/library")}
          >
            <CardContent className="p-3 text-center">
              <div className="text-gaming-purple text-2xl mb-2 flex justify-center">
                <Gamepad className="w-6 h-6" />
              </div>
              <div className="font-medium text-white text-sm">Playing</div>
              <div className="text-gaming-purple text-lg font-bold">{shelves.playing}</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gaming-card border-slate-700/50 hover:border-gaming-violet/50 transition-colors cursor-pointer"
            onClick={() => setLocation("/library")}
          >
            <CardContent className="p-3 text-center">
              <div className="text-gaming-violet text-2xl mb-2 flex justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="font-medium text-white text-sm">Completed</div>
              <div className="text-gaming-violet text-lg font-bold">{shelves.completed}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
