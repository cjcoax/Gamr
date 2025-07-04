import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

interface PostInteractionsProps {
  postId: number;
}

interface Reaction {
  id: number;
  userId: string;
  postId: number;
  reactionType: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    profileImageUrl: string | null;
  };
}

interface Comment {
  id: number;
  userId: string;
  postId: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    profileImageUrl: string | null;
  };
}

const reactionEmojis = {
  like: "👍",
  heart: "❤️",
  laugh: "😂",
  sad: "😢",
  wow: "😮",
  angry: "😠",
};

export default function PostInteractions({ postId }: PostInteractionsProps) {
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reactions
  const { data: reactions = [] } = useQuery<Reaction[]>({
    queryKey: [`/api/posts/${postId}/reactions`],
    retry: false,
  });

  // Fetch comments
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
    retry: false,
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reactionType }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/reactions`] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    },
  });

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }
      
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/reactions`] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to remove reaction",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      setNewComment("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Calculate reaction counts
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find user's reaction
  const userReaction = user && typeof user === 'object' && user !== null && 'id' in user ? reactions.find(r => r.userId === (user as any).id) : null;

  const handleReactionClick = (reactionType: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to react to posts",
        variant: "destructive",
      });
      return;
    }

    if (userReaction?.reactionType === reactionType) {
      // Remove reaction if clicking same type
      removeReactionMutation.mutate();
    } else {
      // Add new reaction (will replace existing one)
      addReactionMutation.mutate(reactionType);
    }
  };

  const handleAddComment = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to comment on posts",
        variant: "destructive",
      });
      return;
    }

    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const getUserDisplayName = (user: Comment['user']) => {
    if (user.username) return user.username;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return "Anonymous";
  };

  return (
    <div className="space-y-3">
      {/* Reactions */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(reactionEmojis).map(([type, emoji]) => (
          <Button
            key={type}
            variant={userReaction?.reactionType === type ? "default" : "outline"}
            size="sm"
            onClick={() => handleReactionClick(type)}
            disabled={addReactionMutation.isPending || removeReactionMutation.isPending}
            className="h-8 px-2 py-1 text-xs bg-gaming-card border-slate-600 hover:bg-gaming-purple/20"
          >
            <span className="mr-1">{emoji}</span>
            {reactionCounts[type] || 0}
          </Button>
        ))}
      </div>

      {/* Comments toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="text-slate-400 hover:text-white"
        >
          💬 {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </Button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-3">
          <Separator className="bg-slate-700" />
          
          {/* Add comment */}
          {user && (
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="bg-gaming-card border-slate-700 text-white placeholder-slate-400 focus:border-gaming-purple resize-none"
                rows={2}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                size="sm"
                className="bg-gaming-purple hover:bg-gaming-purple/80"
              >
                {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-slate-400 text-sm">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="bg-gaming-card border-slate-700">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gaming-purple rounded-full flex items-center justify-center flex-shrink-0">
                        {comment.user.profileImageUrl ? (
                          <img
                            src={comment.user.profileImageUrl}
                            alt={getUserDisplayName(comment.user)}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-white">
                            {getUserDisplayName(comment.user).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white text-sm">
                            {getUserDisplayName(comment.user)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}