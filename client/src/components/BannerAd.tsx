import { ExternalLink } from "lucide-react";

export default function BannerAd() {
  return (
    <div className="w-full h-[50px] bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-white/10"></div>
      </div>
      
      {/* Ad content */}
      <div className="flex items-center space-x-3 text-white relative z-10">
        <div className="text-sm font-medium">
          🎮 GameCorp Pro - Premium Gaming Chair
        </div>
        <ExternalLink className="h-3 w-3 opacity-75" />
      </div>
      
      {/* Small "Ad" label */}
      <div className="absolute top-1 right-2 text-xs text-white/60 font-medium">
        Ad
      </div>
    </div>
  );
}