import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/BottomNavigation";
import SearchForm from "@/components/SearchForm";
import GameCard from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Gamepad2 } from "lucide-react";
import { useLocation } from "wouter";
import type { Game, User as UserType } from "@shared/schema";

export default function Search() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("games");

  const { data: gameResults, isLoading: isLoadingGames } = useQuery({
    queryKey: ["/api/games/search", { q: searchQuery }],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to search games");
      return response.json() as Promise<Game[]>;
    },
    enabled: !!searchQuery.trim() && activeTab === "games",
  });

  const { data: userResults, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users/search", { q: searchQuery }],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to search users");
      return response.json() as Promise<UserType[]>;
    },
    enabled: !!searchQuery.trim() && activeTab === "users",
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
          <h1 className="text-xl font-bold text-white">Search</h1>
        </div>
      </header>

      {/* Search Form */}
      <div className="p-4">
        <SearchForm 
          onSearch={setSearchQuery} 
          placeholder={activeTab === "games" ? "Search for games..." : "Search for users..."}
        />
      </div>

      {/* Search Tabs and Results */}
      <div className="px-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Games
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="mt-4">
            {searchQuery && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white mb-3">
                  Game Results for "{searchQuery}"
                </h2>
                
                {isLoadingGames ? (
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
                ) : gameResults && gameResults.length > 0 ? (
                  <div className="space-y-3">
                    {gameResults.map((game: Game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                ) : gameResults && gameResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No games found for "{searchQuery}"</p>
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            {searchQuery && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white mb-3">
                  User Results for "{searchQuery}"
                </h2>
                
                {isLoadingUsers ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-gaming-card rounded-xl p-4 border border-slate-700/50 animate-pulse">
                        <div className="flex space-x-3">
                          <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-slate-700 rounded mb-2"></div>
                            <div className="h-3 bg-slate-700 rounded mb-2 w-3/4"></div>
                            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userResults && userResults.length > 0 ? (
                  <div className="space-y-3">
                    {userResults.map((user: UserType) => (
                      <div 
                        key={user.id} 
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:bg-slate-800/70 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/profile/${user.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                            {user.profileImageUrl ? (
                              <img 
                                src={user.profileImageUrl} 
                                alt={user.firstName || user.username || 'User'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.username || 'Gamr User'}
                            </h3>
                            {user.username && (
                              <p className="text-slate-400 text-sm">@{user.username}</p>
                            )}
                            {user.bio && (
                              <p className="text-slate-300 text-sm mt-1 line-clamp-2">{user.bio}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userResults && userResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No users found for "{searchQuery}"</p>
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {!searchQuery && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gaming-card rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">{activeTab === "games" ? "🎮" : "👥"}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {activeTab === "games" ? "Discover Games" : "Find Gamers"}
            </h3>
            <p className="text-slate-400">
              {activeTab === "games" 
                ? "Search for games to add to your library" 
                : "Search for other users to connect with"
              }
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" />
    </div>
  );
}
