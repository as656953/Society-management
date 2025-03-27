import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
  });
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/");
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { score: 0, text: "" };
    if (password.length < 6) return { score: 1, text: "Weak" };
    if (password.length < 8) return { score: 2, text: "Fair" };
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const score =
      [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean)
        .length + 2;
    return {
      score: Math.min(score, 5),
      text: score <= 3 ? "Good" : score === 4 ? "Strong" : "Very Strong",
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await loginMutation.mutateAsync({
          username: formData.username,
          password: formData.password,
        });
      } else {
        if (!formData.name.trim()) {
          throw new Error("Please enter your full name");
        }
        await registerMutation.mutateAsync({
          username: formData.username,
          password: formData.password,
          name: formData.name,
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

  const formVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={formVariants}
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
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-gray-200">
                      Full Name
                    </label>
                    <div className="relative">
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="bg-white/5 border-white/10 text-white pr-10 placeholder:text-gray-400 focus:border-blue-500 transition-colors"
                        placeholder="Enter your full name"
                      />
                      {formData.name && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {formData.name.trim().length > 0 ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Username
                </label>
                <div className="relative">
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="bg-white/5 border-white/10 text-white pr-10 placeholder:text-gray-400 focus:border-blue-500 transition-colors"
                    placeholder="Enter your username"
                  />
                  {formData.username && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {formData.username.trim().length > 2 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="bg-white/5 border-white/10 text-white pr-10 placeholder:text-gray-400 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formData.password && !isLogin && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2"
                  >
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "h-1 w-full rounded-full transition-colors",
                            level <= passwordStrength.score
                              ? level <= 2
                                ? "bg-red-500"
                                : level <= 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-gray-700"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      Password strength: {passwordStrength.text}
                    </p>
                  </motion.div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ username: "", password: "", name: "" });
                }}
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
