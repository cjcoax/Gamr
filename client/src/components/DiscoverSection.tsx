import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Flame, Crown, Clock, Gamepad } from "lucide-react";
import { useLocation } from "wouter";
import type { Game } from "@shared/schema";

export default function DiscoverSection() {
  const [, setLocation] = useLocation();

  const { data: trendingGames } = useQuery({
    queryKey: ["/api/games/trending", { limit: 1 }],
    queryFn: async () => {
      const response = await fetch("/api/games/trending?limit=1");
      if (!response.ok) throw new Error("Failed to fetch trending games");
      return response.json() as Promise<Game[]>;
    },
  });

  const featuredGame = trendingGames?.[0];

  const categories = [
    { 
      name: "Trending", 
      icon: Flame, 
      color: "text-gaming-purple", 
      count: "142 games",
      queryKey: "trending"
    },
    { 
      name: "Top Rated", 
      icon: Crown, 
      color: "text-gaming-violet", 
      count: "89 games",
      queryKey: "top-rated"
    },
    { 
      name: "New Releases", 
      icon: Clock, 
      color: "text-gaming-green", 
      count: "56 games",
      queryKey: "new-releases"
    },
    { 
      name: "Retro", 
      icon: Gamepad, 
      color: "text-yellow-400", 
      count: "234 games",
      queryKey: "retro"
    },
  ];

  return (
    <section className="px-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Discover</h3>
        <Button 
          variant="ghost"
          onClick={() => setLocation("/discover")}
          className="text-gaming-purple text-sm font-medium hover:bg-transparent"
        >
          Explore
        </Button>
      </div>
      
      {/* Featured Game */}
      {featuredGame && (
        <div className="mb-6">
          <Card 
            className="bg-gaming-card border-slate-700/50 overflow-hidden hover:border-gaming-purple/50 transition-colors cursor-pointer"
            onClick={() => setLocation(`/game/${featuredGame.id}`)}
          >
            <div 
              className="h-32 bg-cover bg-center"
              style={{
                backgroundImage: featuredGame.screenshotUrls?.[0] 
                  ? `url(${featuredGame.screenshotUrls[0]})` 
                  : "url(https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=200&fit=crop)"
              }}
            />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-gaming-green text-white text-xs">Featured</Badge>
                <div className="flex items-center text-yellow-400">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  <span className="text-white text-sm">4.8</span>
                </div>
              </div>
              <h4 className="font-semibold text-white mb-1">{featuredGame.title}</h4>
              <p className="text-slate-400 text-sm">
                {featuredGame.platform && `${featuredGame.platform} • `}
                {featuredGame.genre || "Adventure"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.name}
              variant="ghost"
              onClick={() => setLocation("/discover")}
              className="bg-gaming-card rounded-lg p-3 border border-slate-700/50 text-left hover:border-gaming-purple transition-colors h-auto"
            >
              <div className={`${category.color} mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-medium text-white text-sm">{category.name}</div>
              <div className="text-slate-400 text-xs">{category.count}</div>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
