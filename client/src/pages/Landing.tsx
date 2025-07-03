import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad, Star, Users, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gaming-dark text-slate-50">
      <div className="max-w-sm mx-auto">
        {/* Hero Section */}
        <div className="px-4 py-8 text-center">
          <div className="w-16 h-16 bg-gaming-purple rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Gamepad className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Gamr</h1>
          <p className="text-slate-400 text-lg mb-8">
            Your personal gaming library and social platform. Track, rate, and discover games like never before.
          </p>
          
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-gaming-purple hover:bg-gaming-violet text-white font-semibold py-3 px-8 rounded-lg text-lg w-full"
          >
            Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="px-4 pb-8 space-y-4">
          <Card className="bg-gaming-card border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gaming-green/20 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-gaming-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Track & Rate</h3>
                  <p className="text-slate-400 text-sm">Organize your gaming library with custom shelves and ratings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gaming-card border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gaming-violet/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-gaming-violet" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Discover</h3>
                  <p className="text-slate-400 text-sm">Find your next favorite game with personalized recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gaming-card border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gaming-purple/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gaming-purple" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Social</h3>
                  <p className="text-slate-400 text-sm">Connect with fellow gamers and share your gaming journey</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
