import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@shared/schema";

interface FavoriteGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: number;
}

export default function FavoriteGameDialog({ open, onOpenChange, position }: FavoriteGameDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search games when user types
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['/api/games/search', searchQuery],
    enabled: searchQuery.length > 2,
    queryFn: () => apiRequest(`/api/games/search?q=${encodeURIComponent(searchQuery)}`),
  });

  // Set favorite game mutation
  const setFavoriteMutation = useMutation({
    mutationFn: async (gameId: number) => {
      return apiRequest('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ gameId, position })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Favorite Set",
        description: `Game added to position ${position}`,
      });
      onOpenChange(false);
      setSearchQuery("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set favorite game",
        variant: "destructive",
      });
    },
  });

  const handleSelectGame = (game: Game) => {
    setFavoriteMutation.mutate(game.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Favorite Game #{position}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a game..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchQuery.length > 2 && (
            <ScrollArea className="h-80">
              {isSearching ? (
                <div className="p-4 text-center text-muted-foreground">
                  Searching games...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No games found. Try a different search term.
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((game: Game) => (
                    <div
                      key={game.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleSelectGame(game)}
                    >
                      {game.coverImageUrl && (
                        <img
                          src={game.coverImageUrl}
                          alt={game.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{game.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {game.genre} • {game.releaseDate ? new Date(game.releaseDate).getFullYear() : 'Unknown'}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {searchQuery.length <= 2 && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Type at least 3 characters to search for games</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}