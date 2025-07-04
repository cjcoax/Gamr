import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import BottomNavigation from "@/components/BottomNavigation";
import GameCard from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { UserGame, Game } from "@shared/schema";

type UserGameWithGame = UserGame & { game: Game };

export default function Library() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");

  const { data: userGames, isLoading } = useQuery({
    queryKey: ["/api/library"],
    enabled: !!user,
  });

  const filteredGames = userGames?.filter((userGame: UserGameWithGame) => {
    if (activeTab === "all") return true;
    return userGame.status === activeTab;
  }) || [];

  const getStatusCounts = () => {
    if (!userGames) return { all: 0, want_to_play: 0, playing: 0, completed: 0, dnf: 0 };
    
    return userGames.reduce((acc: any, userGame: UserGameWithGame) => {
      acc.all++;
      acc[userGame.status] = (acc[userGame.status] || 0) + 1;
      return acc;
    }, { all: 0, want_to_play: 0, playing: 0, completed: 0, dnf: 0 });
  };

  const statusCounts = getStatusCounts();

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
          <h1 className="text-xl font-bold text-white">My Library</h1>
        </div>
      </header>

      {/* Library Tabs */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gaming-card">
            <TabsTrigger value="all" className="text-xs">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="want_to_play" className="text-xs">
              Want ({statusCounts.want_to_play})
            </TabsTrigger>
            <TabsTrigger value="playing" className="text-xs">
              Playing ({statusCounts.playing})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Done ({statusCounts.completed})
            </TabsTrigger>
            <TabsTrigger value="dnf" className="text-xs">
              DNF ({statusCounts.dnf})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
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
            ) : filteredGames.length > 0 ? (
              <div className="space-y-3 pb-20">
                {filteredGames.map((userGame: UserGameWithGame) => (
                  <GameCard 
                    key={userGame.id} 
                    game={userGame.game} 
                    userGame={userGame}
                    showProgress={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gaming-card rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {activeTab === "all" ? "No games in library" : 
                   activeTab === "want_to_play" ? "No games in want to play" :
                   activeTab === "playing" ? "No games currently playing" :
                   "No completed games"}
                </h3>
                <p className="text-slate-400">Start building your gaming library!</p>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="library" />
    </div>
  );
}
