import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AddGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddGameDialog({ open, onOpenChange }: AddGameDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImageUrl: "",
    genre: "",
    platform: "",
    developer: "",
    publisher: "",
    isRetro: false,
  });

  const createGameMutation = useMutation({
    mutationFn: async (gameData: typeof formData) => {
      const response = await apiRequest("POST", "/api/games", gameData);
      return response.json();
    },
    onSuccess: (newGame) => {
      toast({
        title: "Success",
        description: "Game created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
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
        description: error.message || "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      coverImageUrl: "",
      genre: "",
      platform: "",
      developer: "",
      publisher: "",
      isRetro: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Game title is required",
        variant: "destructive",
      });
      return;
    }
    createGameMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    if (!createGameMutation.isPending) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gaming-card border-slate-700 text-white max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Game</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add a new game to the GameShelf database
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-slate-300">
              Title *
            </Label>
            <Input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="bg-gaming-dark border-slate-600 text-white"
              placeholder="Enter game title"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-slate-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-gaming-dark border-slate-600 text-white resize-none"
              placeholder="Enter game description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="genre" className="text-sm font-medium text-slate-300">
                Genre
              </Label>
              <Select value={formData.genre} onValueChange={(value) => handleChange("genre", value)}>
                <SelectTrigger className="bg-gaming-dark border-slate-600 text-white">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-gaming-dark border-slate-600">
                  <SelectItem value="Action">Action</SelectItem>
                  <SelectItem value="Adventure">Adventure</SelectItem>
                  <SelectItem value="RPG">RPG</SelectItem>
                  <SelectItem value="Strategy">Strategy</SelectItem>
                  <SelectItem value="Simulation">Simulation</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Racing">Racing</SelectItem>
                  <SelectItem value="Fighting">Fighting</SelectItem>
                  <SelectItem value="Puzzle">Puzzle</SelectItem>
                  <SelectItem value="Horror">Horror</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="platform" className="text-sm font-medium text-slate-300">
                Platform
              </Label>
              <Select value={formData.platform} onValueChange={(value) => handleChange("platform", value)}>
                <SelectTrigger className="bg-gaming-dark border-slate-600 text-white">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-gaming-dark border-slate-600">
                  <SelectItem value="PC">PC</SelectItem>
                  <SelectItem value="PlayStation 5">PlayStation 5</SelectItem>
                  <SelectItem value="PlayStation 4">PlayStation 4</SelectItem>
                  <SelectItem value="Xbox Series X/S">Xbox Series X/S</SelectItem>
                  <SelectItem value="Xbox One">Xbox One</SelectItem>
                  <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="VR">VR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="developer" className="text-sm font-medium text-slate-300">
                Developer
              </Label>
              <Input
                id="developer"
                type="text"
                value={formData.developer}
                onChange={(e) => handleChange("developer", e.target.value)}
                className="bg-gaming-dark border-slate-600 text-white"
                placeholder="Developer name"
              />
            </div>

            <div>
              <Label htmlFor="publisher" className="text-sm font-medium text-slate-300">
                Publisher
              </Label>
              <Input
                id="publisher"
                type="text"
                value={formData.publisher}
                onChange={(e) => handleChange("publisher", e.target.value)}
                className="bg-gaming-dark border-slate-600 text-white"
                placeholder="Publisher name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="coverImageUrl" className="text-sm font-medium text-slate-300">
              Cover Image URL
            </Label>
            <Input
              id="coverImageUrl"
              type="url"
              value={formData.coverImageUrl}
              onChange={(e) => handleChange("coverImageUrl", e.target.value)}
              className="bg-gaming-dark border-slate-600 text-white"
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isRetro"
              checked={formData.isRetro}
              onCheckedChange={(checked) => handleChange("isRetro", checked)}
            />
            <Label htmlFor="isRetro" className="text-sm font-medium text-slate-300">
              Mark as Retro Game
            </Label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createGameMutation.isPending}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGameMutation.isPending}
              className="flex-1 bg-gaming-purple hover:bg-gaming-violet text-white"
            >
              {createGameMutation.isPending ? "Creating..." : "Create Game"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
