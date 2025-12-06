import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Apartment } from "@shared/schema";
import {
  Loader2,
  Shield,
  ShieldOff,
  Trash2,
  Users as UsersIcon,
  UserCog,
  Building2,
  Home,
  X,
  Filter,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

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

// Type for tower with apartments
interface Tower {
  id: number;
  name: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>("");
  const [selectedResidentType, setSelectedResidentType] = useState<string>("");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: ["/api/apartments"],
  });

  const { data: towers } = useQuery<Tower[]>({
    queryKey: ["/api/towers"],
  });

  // Helper to get apartment display name
  const getApartmentDisplay = (apartmentId: number | null) => {
    if (!apartmentId || !apartments || !towers) return null;
    const apartment = apartments.find((a) => a.id === apartmentId);
    if (!apartment) return null;
    const tower = towers.find((t) => t.id === apartment.towerId);
    return `${tower?.name || "Tower"} - ${apartment.number}`;
  };

  // Filter users based on unassigned filter
  const filteredUsers = filterUnassigned
    ? users?.filter((u) => !u.apartmentId)
    : users;

  // Count unassigned users
  const unassignedCount = users?.filter((u) => !u.apartmentId).length || 0;

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

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: number;
      role: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, {
        role,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole("");
      toast({
        title: "User role updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user role",
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

  const assignApartmentMutation = useMutation({
    mutationFn: async ({
      userId,
      apartmentId,
      residentType,
    }: {
      userId: number;
      apartmentId: number;
      residentType: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/apartment`, {
        apartmentId,
        residentType,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAssignDialogOpen(false);
      setSelectedUser(null);
      setSelectedApartmentId("");
      setSelectedResidentType("");
      toast({
        title: "Apartment assigned successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign apartment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeApartmentMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}/apartment`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Apartment assignment removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove apartment assignment",
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

  const openAssignDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedApartmentId(user.apartmentId?.toString() || "");
    setSelectedResidentType(user.residentType || "");
    setAssignDialogOpen(true);
  };

  const handleAssignApartment = () => {
    if (selectedUser && selectedApartmentId && selectedResidentType) {
      assignApartmentMutation.mutate({
        userId: selectedUser.id,
        apartmentId: parseInt(selectedApartmentId),
        residentType: selectedResidentType,
      });
    }
  };

  const handleRemoveApartment = (userId: number) => {
    removeApartmentMutation.mutate(userId);
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role || "resident");
    setRoleDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (selectedUser && selectedRole) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: selectedRole,
      });
    }
  };

  const getRoleDisplay = (role: string | null) => {
    switch (role) {
      case "admin":
        return { label: "Admin", color: "bg-red-100 text-red-800" };
      case "guard":
        return { label: "Guard", color: "bg-blue-100 text-blue-800" };
      default:
        return { label: "Resident", color: "bg-green-100 text-green-800" };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container px-4 py-4 md:p-6 space-y-4 md:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-3 md:space-y-4">
        <div className="flex flex-col gap-3 md:gap-4">
          <motion.div
            className="relative"
            variants={headingVariants}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <motion.div variants={iconVariants} className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl" />
                <UsersIcon className="h-6 w-6 md:h-8 md:w-8 text-primary relative z-10" />
              </motion.div>
              <div className="relative">
                <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary animate-gradient-x">
                  User Management
                </h1>
                <motion.div
                  variants={underlineVariants}
                  className="absolute -bottom-1 md:-bottom-2 left-0 h-0.5 md:h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full"
                />
              </div>
            </div>
          </motion.div>
          <div className="flex flex-wrap items-center gap-2">
            {unassignedCount > 0 && (
              <Badge variant="destructive" className="px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm">
                {unassignedCount} unassigned
              </Badge>
            )}
            <Button
              variant={filterUnassigned ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterUnassigned(!filterUnassigned)}
              className="gap-1.5 md:gap-2 text-xs md:text-sm h-8 md:h-9"
            >
              <Filter className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {filterUnassigned ? "Show All" : "Unassigned Only"}
            </Button>
          </div>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredUsers?.map((user) => (
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
                  <CardHeader className="relative p-3 md:p-6">
                    <div className="flex flex-col gap-3">
                      {/* User Info Row */}
                      <div className="flex items-center gap-2 md:gap-3">
                        <Avatar className="h-9 w-9 md:h-10 md:w-10 bg-primary/10 flex-shrink-0">
                          {user.profilePicture && (
                            <AvatarImage src={user.profilePicture} alt={user.name} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm md:text-base">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm md:text-lg group-hover:text-primary transition-colors duration-300 truncate">
                            {user.name}
                          </CardTitle>
                          <Badge
                            className={cn(
                              "mt-0.5 cursor-pointer text-[10px] md:text-xs",
                              getRoleDisplay(user.role).color
                            )}
                            onClick={() => openRoleDialog(user)}
                          >
                            {getRoleDisplay(user.role).label}
                          </Badge>
                        </div>
                      </div>
                      {/* Actions Row */}
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Button
                          variant={user.isAdmin ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleAdmin(user)}
                          disabled={updateUserMutation.isPending}
                          className="relative group/btn h-7 md:h-8 text-[10px] md:text-xs px-2 md:px-3 flex-1"
                        >
                          {user.isAdmin ? (
                            <>
                              <ShieldOff className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                              <span className="hidden sm:inline">Remove Admin</span>
                              <span className="sm:hidden">Remove</span>
                            </>
                          ) : (
                            <>
                              <Shield className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                              <span className="hidden sm:inline">Make Admin</span>
                              <span className="sm:hidden">Admin</span>
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleteUserMutation.isPending}
                              className="relative group/btn h-7 w-7 md:h-8 md:w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
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
                  <CardContent className="relative p-3 md:p-6 pt-0 md:pt-0">
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground group-hover:text-primary transition-colors duration-300">
                        <UserCog className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                        <span className="truncate">@{user.username}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2 text-xs md:text-sm min-w-0 flex-1">
                          <Home className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                          {user.apartmentId ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-primary font-medium truncate text-xs md:text-sm">
                                {getApartmentDisplay(user.apartmentId)}
                              </span>
                              {user.residentType && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] md:text-xs px-1 md:px-1.5 flex-shrink-0",
                                    user.residentType === "OWNER"
                                      ? "border-green-500 text-green-600"
                                      : "border-blue-500 text-blue-600"
                                  )}
                                >
                                  {user.residentType === "OWNER" ? "Owner" : "Tenant"}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-orange-500 text-xs md:text-sm">No apartment</span>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(user)}
                            className="h-6 md:h-7 px-1.5 md:px-2 text-[10px] md:text-xs"
                          >
                            <Building2 className="h-3 w-3 mr-0.5 md:mr-1" />
                            {user.apartmentId ? "Change" : "Assign"}
                          </Button>
                          {user.apartmentId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveApartment(user.id)}
                              className="h-6 md:h-7 w-6 md:w-7 p-0 text-destructive hover:text-destructive"
                              disabled={removeApartmentMutation.isPending}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Assign Apartment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.apartmentId ? "Change Apartment" : "Assign Apartment"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.apartmentId
                ? `Change apartment assignment for ${selectedUser?.name}`
                : `Assign an apartment to ${selectedUser?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Apartment</label>
              <Select
                value={selectedApartmentId}
                onValueChange={setSelectedApartmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an apartment" />
                </SelectTrigger>
                <SelectContent>
                  {towers?.map((tower) => (
                    <div key={tower.id}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {tower.name}
                      </div>
                      {apartments
                        ?.filter((a) => a.towerId === tower.id)
                        .map((apartment) => (
                          <SelectItem
                            key={apartment.id}
                            value={apartment.id.toString()}
                          >
                            {apartment.number} - {apartment.type} (Floor {apartment.floor})
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resident Type</label>
              <Select
                value={selectedResidentType}
                onValueChange={setSelectedResidentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resident type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Owner
                    </div>
                  </SelectItem>
                  <SelectItem value="TENANT">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Tenant
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignApartment}
              disabled={!selectedApartmentId || !selectedResidentType || assignApartmentMutation.isPending}
            >
              {assignApartmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {selectedUser?.apartmentId ? "Update" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Resident - Can book amenities, pre-approve visitors
                    </div>
                  </SelectItem>
                  <SelectItem value="guard">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Guard - Can log visitor entries/exits
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Admin - Full system access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={!selectedRole || updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
