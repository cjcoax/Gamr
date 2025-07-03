import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { useLocation } from "wouter";
import type { Game, UserGame } from "@shared/schema";

interface GameCardProps {
  game: Game;
  userGame?: UserGame;
  showProgress?: boolean;
}

export default function GameCard({ game, userGame, showProgress }: GameCardProps) {
  const [, setLocation] = useLocation();

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

  return (
    <Card 
      className="bg-gaming-card rounded-xl border border-slate-700/50 hover:border-gaming-purple/50 transition-colors cursor-pointer"
      onClick={() => setLocation(`/games/${game.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <img 
            src={game.coverImageUrl || "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=120&fit=crop"}
            alt={game.title}
            className="w-20 h-28 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white mb-1 truncate">{game.title}</h4>
            <p className="text-slate-400 text-sm mb-2">
              {game.platform && `${game.platform} • `}
              {game.genre || "Game"}
            </p>
            
            {userGame?.rating && (
              <div className="flex items-center space-x-2 mb-2">
                {renderStars(userGame.rating)}
                <span className="text-slate-400 text-xs">{userGame.rating}</span>
              </div>
            )}

            {userGame && (
              <div className="mb-2">
                <Badge 
                  variant={
                    userGame.status === "completed" ? "default" :
                    userGame.status === "currently_playing" ? "secondary" :
                    "outline"
                  }
                  className="text-xs capitalize"
                >
                  {userGame.status.replace("_", " ")}
                </Badge>
              </div>
            )}

            {showProgress && userGame && userGame.progress !== undefined && userGame.progress > 0 && (
              <div>
                <div className="bg-slate-700 rounded-full h-2 mb-1">
                  <div 
                    className="bg-gaming-purple h-2 rounded-full transition-all"
                    style={{ width: `${userGame.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{userGame.progress}% Complete</p>
              </div>
            )}

            {game.developer && (
              <p className="text-xs text-slate-500 mt-1 truncate">
                by {game.developer}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
