import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import UserStats from "@/components/UserStats";
import CurrentlyPlaying from "@/components/CurrentlyPlaying";
import DiscoverSection from "@/components/DiscoverSection";
import RecentActivity from "@/components/RecentActivity";
import LibraryPreview from "@/components/LibraryPreview";
import BottomNavigation from "@/components/BottomNavigation";
import AddGameDialog from "@/components/AddGameDialog";
import { Button } from "@/components/ui/button";
import { Search, Bell, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAddGame, setShowAddGame] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gaming-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400">Loading your gaming library...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-sm mx-auto bg-gaming-dark min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gaming-dark/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gaming-purple rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            <h1 className="text-xl font-bold text-white">GameShelf</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/search")}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-400" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gaming-green rounded-full"></div>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <UserStats user={user} />
        <CurrentlyPlaying />
        <DiscoverSection />
        <RecentActivity />
        <LibraryPreview />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowAddGame(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gaming-purple rounded-full hover:bg-gaming-violet transition-colors shadow-lg"
      >
        <Plus className="w-6 h-6 text-white" />
      </Button>

      {/* Add Game Dialog */}
      <AddGameDialog open={showAddGame} onOpenChange={setShowAddGame} />
    </div>
  );
}
