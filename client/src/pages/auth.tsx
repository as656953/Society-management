import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (isLogin) {
        await loginMutation.mutateAsync({
          username: formData.get("username") as string,
          password: formData.get("password") as string,
        });
      } else {
        await registerMutation.mutateAsync({
          username: formData.get("username") as string,
          password: formData.get("password") as string,
          name: formData.get("name") as string,
          isAdmin: false,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
            <motion.h1
              className="text-3xl font-bold text-white text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isLogin ? "Welcome Back" : "Create Account"}
            </motion.h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">
                    Full Name
                  </label>
                  <Input
                    name="name"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-blue-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Username
                </label>
                <Input
                  name="username"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-blue-500 transition-colors"
                  placeholder="Enter your username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Password
                </label>
                <Input
                  name="password"
                  type="password"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {isLogin
                  ? "Need an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Info */}
      <div className="hidden md:flex w-1/2 bg-black/20 backdrop-blur-lg items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Building2 className="w-24 h-24 mx-auto mb-6 text-white/80" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Society Management System
          </h2>
          <p className="text-lg text-gray-300 max-w-md mx-auto">
            Access your society's amenities, manage bookings, and stay connected
            with your community.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
