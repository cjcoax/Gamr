import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Search, Bookmark, Compass, User } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const tabs = [
    { id: "home", icon: Home, label: "Home", path: "/" },
    { id: "search", icon: Search, label: "Search", path: "/search" },
    { id: "library", icon: Bookmark, label: "Library", path: "/library" },
    { id: "discover", icon: Compass, label: "Discover", path: "/discover" },
    { id: "profile", icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-gaming-card/95 backdrop-blur-sm border-t border-slate-700/50">
      <div className="grid grid-cols-5 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setLocation(tab.path)}
              className={`flex flex-col items-center py-2 h-auto ${
                isActive 
                  ? "text-gaming-purple" 
                  : "text-slate-400 hover:text-gaming-purple"
              } transition-colors`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
