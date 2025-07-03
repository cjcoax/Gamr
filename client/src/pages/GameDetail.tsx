import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Plus, Edit } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GameWithUserData } from "@shared/schema";

export default function GameDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: game, isLoading } = useQuery({
    queryKey: ["/api/games", id],
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
      toast({
        title: "Success",
        description: "Game added to your library!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status?: string; rating?: number }) => {
      if (!game?.userGame) return;
      await apiRequest("PATCH", `/api/library/${game.userGame.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Game updated!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto bg-gaming-dark min-h-screen">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
            <div className="h-64 bg-slate-700 rounded"></div>
            <div className="h-6 bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-sm mx-auto bg-gaming-dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Game not found</h2>
          <Button onClick={() => setLocation("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
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
    <div className="max-w-sm mx-auto bg-gaming-dark min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gaming-dark/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors mr-3"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Button>
          <h1 className="text-xl font-bold text-white truncate">{game.title}</h1>
        </div>
      </header>

      <div className="p-4">
        {/* Game Cover and Basic Info */}
        <Card className="bg-gaming-card border-slate-700 mb-4">
          <CardContent className="p-4">
            <div className="flex space-x-4 mb-4">
              <img 
                src={game.coverImageUrl || "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120&h=160&fit=crop"}
                alt={game.title}
                className="w-24 h-32 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">{game.title}</h2>
                <div className="space-y-1 text-sm">
                  {game.developer && (
                    <p className="text-slate-400">
                      <span className="text-slate-300">Developer:</span> {game.developer}
                    </p>
                  )}
                  {game.platform && (
                    <p className="text-slate-400">
                      <span className="text-slate-300">Platform:</span> {game.platform}
                    </p>
                  )}
                  {game.genre && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {game.genre}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  {renderStars(Math.round(game.averageRating || 0))}
                  <span className="text-slate-400 text-sm">
                    {game.averageRating?.toFixed(1) || "No ratings"} 
                    {game.reviewCount ? ` (${game.reviewCount} reviews)` : ""}
                  </span>
                </div>
              </div>
              {game.metacriticScore && (
                <div className="text-right">
                  <div className="text-gaming-green font-bold">{game.metacriticScore}</div>
                  <div className="text-xs text-slate-400">Metacritic</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Library Status */}
        <Card className="bg-gaming-card border-slate-700 mb-4">
          <CardContent className="p-4">
            <h3 className="font-semibold text-white mb-3">Library Status</h3>
            
            {!game.userGame ? (
              <div className="space-y-2">
                <p className="text-slate-400 text-sm mb-3">Add this game to your library:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToLibraryMutation.mutate("want_to_play")}
                    disabled={addToLibraryMutation.isPending}
                    className="text-xs"
                  >
                    Want to Play
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToLibraryMutation.mutate("currently_playing")}
                    disabled={addToLibraryMutation.isPending}
                    className="text-xs"
                  >
                    Playing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToLibraryMutation.mutate("completed")}
                    disabled={addToLibraryMutation.isPending}
                    className="text-xs"
                  >
                    Completed
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <Badge 
                    variant={
                      game.userGame.status === "completed" ? "default" :
                      game.userGame.status === "currently_playing" ? "secondary" :
                      "outline"
                    }
                    className="capitalize"
                  >
                    {game.userGame.status.replace("_", " ")}
                  </Badge>
                </div>

                {game.userGame.progress !== undefined && game.userGame.progress > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white">{game.userGame.progress}%</span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gaming-purple h-2 rounded-full transition-all"
                        style={{ width: `${game.userGame.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {game.userGame.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Your Rating:</span>
                    <div className="flex items-center space-x-2">
                      {renderStars(game.userGame.rating)}
                      <span className="text-white text-sm">{game.userGame.rating}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ status: "completed" })}
                    disabled={updateStatusMutation.isPending || game.userGame.status === "completed"}
                    className="text-xs"
                  >
                    Mark Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const rating = prompt("Rate this game (1-5):");
                      if (rating && !isNaN(Number(rating))) {
                        const numRating = Math.max(1, Math.min(5, Number(rating)));
                        updateStatusMutation.mutate({ rating: numRating });
                      }
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="text-xs"
                  >
                    Rate Game
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {game.description && (
          <Card className="bg-gaming-card border-slate-700 mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-3">About</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{game.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Screenshots */}
        {game.screenshotUrls && game.screenshotUrls.length > 0 && (
          <Card className="bg-gaming-card border-slate-700">
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-3">Screenshots</h3>
              <div className="grid grid-cols-2 gap-2">
                {game.screenshotUrls.slice(0, 4).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${game.title} screenshot ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
