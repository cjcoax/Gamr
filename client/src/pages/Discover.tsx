import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/BottomNavigation";
import GameCard from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Flame, Crown, Clock, Gamepad } from "lucide-react";
import { useLocation } from "wouter";
import type { Game } from "@shared/schema";

export default function Discover() {
  const [, setLocation] = useLocation();

  const { data: trendingGames, isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/games/trending"],
  });

  const { data: topRatedGames, isLoading: topRatedLoading } = useQuery({
    queryKey: ["/api/games/top-rated"],
  });

  const { data: newReleases, isLoading: newReleasesLoading } = useQuery({
    queryKey: ["/api/games/new-releases"],
  });

  const { data: retroGames, isLoading: retroLoading } = useQuery({
    queryKey: ["/api/games/retro"],
  });

  const renderGameList = (games: Game[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
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
      );
    }

    if (!games || games.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-400">No games found in this category.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
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
          <h1 className="text-xl font-bold text-white">Discover</h1>
        </div>
      </header>

      {/* Category Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gaming-card rounded-lg p-3 border border-slate-700/50 hover:border-gaming-purple transition-colors">
            <div className="text-gaming-purple mb-2">
              <Flame className="w-5 h-5" />
            </div>
            <div className="font-medium text-white text-sm">Trending</div>
            <div className="text-slate-400 text-xs">{trendingGames?.length || 0} games</div>
          </div>
          
          <div className="bg-gaming-card rounded-lg p-3 border border-slate-700/50 hover:border-gaming-purple transition-colors">
            <div className="text-gaming-violet mb-2">
              <Crown className="w-5 h-5" />
            </div>
            <div className="font-medium text-white text-sm">Top Rated</div>
            <div className="text-slate-400 text-xs">{topRatedGames?.length || 0} games</div>
          </div>
          
          <div className="bg-gaming-card rounded-lg p-3 border border-slate-700/50 hover:border-gaming-purple transition-colors">
            <div className="text-gaming-green mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <div className="font-medium text-white text-sm">New Releases</div>
            <div className="text-slate-400 text-xs">{newReleases?.length || 0} games</div>
          </div>
          
          <div className="bg-gaming-card rounded-lg p-3 border border-slate-700/50 hover:border-gaming-purple transition-colors">
            <div className="text-yellow-400 mb-2">
              <Gamepad className="w-5 h-5" />
            </div>
            <div className="font-medium text-white text-sm">Retro</div>
            <div className="text-slate-400 text-xs">{retroGames?.length || 0} games</div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gaming-card">
            <TabsTrigger value="trending" className="text-xs">Trending</TabsTrigger>
            <TabsTrigger value="top-rated" className="text-xs">Top Rated</TabsTrigger>
            <TabsTrigger value="new" className="text-xs">New</TabsTrigger>
            <TabsTrigger value="retro" className="text-xs">Retro</TabsTrigger>
          </TabsList>

          <div className="mt-4 pb-20">
            <TabsContent value="trending" className="mt-0">
              {renderGameList(trendingGames, trendingLoading)}
            </TabsContent>

            <TabsContent value="top-rated" className="mt-0">
              {renderGameList(topRatedGames, topRatedLoading)}
            </TabsContent>

            <TabsContent value="new" className="mt-0">
              {renderGameList(newReleases, newReleasesLoading)}
            </TabsContent>

            <TabsContent value="retro" className="mt-0">
              {renderGameList(retroGames, retroLoading)}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="discover" />
    </div>
  );
}
