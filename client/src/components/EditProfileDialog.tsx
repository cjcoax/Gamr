import { useState, useRef } from "react";
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
import { Camera, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { UserWithStats } from "@shared/schema";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithStats;
}

export default function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: user.username || "",
    bio: user.bio || "",
    profileImageUrl: user.profileImageUrl || "",
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: typeof formData) => {
      await apiRequest("PATCH", "/api/users/profile", profileData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onOpenChange(false);
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
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedImage(dataUrl);
        setFormData(prev => ({ ...prev, profileImageUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up the data - only send fields that have values
    const cleanData: any = {};
    if (formData.username.trim()) cleanData.username = formData.username.trim();
    if (formData.bio.trim()) cleanData.bio = formData.bio.trim();
    if (formData.profileImageUrl.trim()) cleanData.profileImageUrl = formData.profileImageUrl.trim();
    
    updateProfileMutation.mutate(cleanData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    if (!updateProfileMutation.isPending) {
      onOpenChange(false);
      // Reset form data to original values
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  };

  const removeProfileImage = () => {
    setFormData(prev => ({ ...prev, profileImageUrl: "" }));
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gaming-card border-slate-700 text-white max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Profile</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update your profile information and photo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <img 
                src={uploadedImage || formData.profileImageUrl || "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=100&h=100&fit=crop&crop=face"} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-2 border-gaming-purple mx-auto"
              />
              {(formData.profileImageUrl || uploadedImage) && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeProfileImage}
                  className="absolute -top-1 -right-1 w-6 h-6 p-0 rounded-full"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <div className="mt-4 space-y-3">
              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload from Device
                </Button>
                <p className="text-xs text-slate-400 mt-1">
                  Select an image file (max 5MB)
                </p>
              </div>

              {/* URL Input */}
              <div className="text-center text-slate-400 text-sm">or</div>
              <div>
                <Label htmlFor="profileImageUrl" className="text-sm font-medium text-slate-300">
                  Use Image URL
                </Label>
                <Input
                  id="profileImageUrl"
                  type="url"
                  value={uploadedImage ? "" : formData.profileImageUrl}
                  onChange={(e) => {
                    setUploadedImage(null);
                    handleChange("profileImageUrl", e.target.value);
                  }}
                  disabled={!!uploadedImage}
                  className="bg-gaming-dark border-slate-600 text-white mt-1 disabled:opacity-50"
                  placeholder="https://example.com/your-photo.jpg"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Enter a URL to an image hosted online
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="username" className="text-sm font-medium text-slate-300">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              className="bg-gaming-dark border-slate-600 text-white"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <Label htmlFor="bio" className="text-sm font-medium text-slate-300">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              className="bg-gaming-dark border-slate-600 text-white resize-none"
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-slate-400 mt-1">
              {formData.bio.length}/200 characters
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateProfileMutation.isPending}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-gaming-purple hover:bg-gaming-violet text-white"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}