import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@shared/schema";
import {
  Loader2,
  Shield,
  ShieldOff,
  Trash2,
  Users as UsersIcon,
  UserCog,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const headerAnimation = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const headingVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const underlineVariants = {
  initial: { width: 0 },
  animate: {
    width: "100%",
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const iconVariants = {
  initial: { rotate: 0, scale: 0.8 },
  animate: {
    rotate: 360,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

export default function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      isAdmin,
    }: {
      userId: number;
      isAdmin: boolean;
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, {
        isAdmin,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete user");
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted successfully",
      });

      if (userId === currentUser?.id) {
        queryClient.clear();
        logoutMutation.mutate(undefined, {
          onSuccess: () => {
            setLocation("/auth");
          },
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAdmin = (user: User) => {
    updateUserMutation.mutate({
      userId: user.id,
      isAdmin: !user.isAdmin,
    });
  };

  const handleDeleteUser = (user: User) => {
    deleteUserMutation.mutate(user.id);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            className="relative"
            variants={headingVariants}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center gap-3">
              <motion.div variants={iconVariants} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl" />
                <UsersIcon className="h-8 w-8 text-primary relative z-10" />
              </motion.div>
              <div className="relative">
                <h1 className="text-4xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary animate-gradient-x">
                  User Management
                </h1>
                <motion.div
                  variants={underlineVariants}
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full"
                />
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {users?.map((user) => (
              <motion.div
                key={user.id}
                variants={item}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.95 }}
                className="group"
              >
                <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 bg-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                            {user.name}
                          </CardTitle>
                          <Badge
                            variant={user.isAdmin ? "default" : "secondary"}
                            className={cn(
                              "mt-1",
                              user.isAdmin
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {user.isAdmin ? "Administrator" : "Resident"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={user.isAdmin ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleAdmin(user)}
                          disabled={updateUserMutation.isPending}
                          className="relative group/btn"
                        >
                          <span className="absolute inset-0 w-0 bg-primary/10 group-hover/btn:w-full transition-all duration-300 rounded-md" />
                          {user.isAdmin ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleteUserMutation.isPending}
                              className="relative group/btn"
                            >
                              <span className="absolute inset-0 w-0 bg-destructive/10 group-hover/btn:w-full transition-all duration-300 rounded-md" />
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                {user.id === currentUser?.id
                                  ? "Are you sure you want to delete your account? This action cannot be undone and you will be logged out."
                                  : `Are you sure you want to delete ${user.name}? This action cannot be undone.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors duration-300">
                        <UserCog className="h-4 w-4" />
                        <span>Username: {user.username}</span>
                      </div>
                      {user.apartmentId && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors duration-300">
                          <Building2 className="h-4 w-4" />
                          <span>Apartment ID: {user.apartmentId}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
