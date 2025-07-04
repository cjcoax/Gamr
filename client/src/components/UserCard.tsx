import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
  const [, setLocation] = useLocation();

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    return user.email?.split('@')[0] || 'Unknown User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card 
      className="bg-gaming-card border-slate-700/50 hover:border-gaming-purple/50 transition-colors cursor-pointer"
      onClick={() => setLocation(`/users/${user.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="bg-gaming-purple text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">
              {getDisplayName()}
            </h3>
            {user.username && user.username !== getDisplayName() && (
              <p className="text-sm text-slate-400 truncate">
                @{user.username}
              </p>
            )}
            {user.bio && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {user.bio}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/users/${user.id}`);
            }}
            className="text-gaming-purple border-gaming-purple hover:bg-gaming-purple hover:text-white"
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}