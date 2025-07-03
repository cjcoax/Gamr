import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function GameDetailSimple() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  console.log("GameDetailSimple - id:", id);

  const { data: game, isLoading, error } = useQuery({
    queryKey: [`/api/games/${id}`],
    enabled: !!id,
  });

  console.log("GameDetailSimple - game data:", { game, isLoading, error });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gaming-dark text-white flex items-center justify-center">
        <div>Error: {String(error)}</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gaming-dark text-white flex items-center justify-center">
        <div>No game found</div>
      </div>
    );
  }

  const gameData = game as any;

  return (
    <div className="min-h-screen bg-gaming-dark text-white">
      <div className="max-w-sm mx-auto p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">{gameData.title || "Unknown Game"}</h1>
        </div>
        
        <div className="space-y-4">
          <p>Game ID: {gameData.id}</p>
          <p>IGDB ID: {gameData.igdbId}</p>
          <p>Description: {gameData.description || "No description"}</p>
          {gameData.coverImageUrl && (
            <img 
              src={gameData.coverImageUrl} 
              alt={gameData.title}
              className="w-32 h-48 object-cover rounded"
            />
          )}
        </div>
      </div>
    </div>
  );
}