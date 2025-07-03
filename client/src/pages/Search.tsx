import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/BottomNavigation";
import SearchForm from "@/components/SearchForm";
import GameCard from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { Game } from "@shared/schema";

export default function Search() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/games/search", { q: searchQuery }],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to search games");
      return response.json() as Promise<Game[]>;
    },
    enabled: !!searchQuery.trim(),
  });

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
          <h1 className="text-xl font-bold text-white">Search Games</h1>
        </div>
      </header>

      {/* Search Form */}
      <div className="p-4">
        <SearchForm onSearch={setSearchQuery} />
      </div>

      {/* Search Results */}
      <div className="px-4 pb-20">
        {searchQuery && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white mb-3">
              Search Results for "{searchQuery}"
            </h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
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
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : searchResults && searchResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No games found matching your search.</p>
              </div>
            ) : null}
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gaming-card rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎮</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Discover Games</h3>
            <p className="text-slate-400">Search for games to add to your library</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" />
    </div>
  );
}
