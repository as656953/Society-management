import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  User,
  Building2,
  Phone,
  Mail,
  Lock,
  Camera,
  Car,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Bell,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Apartment, User as UserType, Vehicle, NotificationPreferences } from "@shared/schema";
import { Switch } from "@/components/ui/switch";

interface Tower {
  id: number;
  name: string;
}

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

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [editedEmail, setEditedEmail] = useState(user?.email || "");
  const [editedPhone, setEditedPhone] = useState(user?.phone || "");

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleType: "car" as "car" | "bike" | "scooter" | "other",
    vehicleNumber: "",
    makeModel: "",
    color: "",
    parkingSlot: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: ["/api/apartments"],
  });

  const { data: towers } = useQuery<Tower[]>({
    queryKey: ["/api/towers"],
  });

  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles/my"],
    enabled: !!user?.apartmentId,
  });

  const { data: familyMembers } = useQuery<UserType[]>({
    queryKey: ["/api/apartments", user?.apartmentId, "residents"],
    queryFn: async () => {
      if (!user?.apartmentId) return [];
      const res = await fetch(`/api/apartments/${user.apartmentId}/residents`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.apartmentId,
  });

  const { data: notificationPrefs } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notifications/preferences"],
  });

  const userApartment = apartments?.find((a) => a.id === user?.apartmentId);
  const userTower = towers?.find((t) => t.id === userApartment?.towerId);
  const otherFamilyMembers = familyMembers?.filter((m) => m.id !== user?.id) || [];

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string; phone?: string }) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
      const res = await apiRequest("PATCH", "/api/profile/password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to change password", description: error.message, variant: "destructive" });
    },
  });

  const addVehicleMutation = useMutation({
    mutationFn: async (data: typeof newVehicle) => {
      const res = await apiRequest("POST", "/api/vehicles", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Vehicle added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/my"] });
      setIsAddingVehicle(false);
      setNewVehicle({
        vehicleType: "car",
        vehicleNumber: "",
        makeModel: "",
        color: "",
        parkingSlot: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add vehicle", description: error.message, variant: "destructive" });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      await apiRequest("DELETE", `/api/vehicles/${vehicleId}`);
    },
    onSuccess: () => {
      toast({ title: "Vehicle removed successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/my"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove vehicle", description: error.message, variant: "destructive" });
    },
  });

  const updateNotificationPrefsMutation = useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const res = await apiRequest("PATCH", "/api/notifications/preferences", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Notification preferences updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update preferences", description: error.message, variant: "destructive" });
    },
  });

  const updateProfilePictureMutation = useMutation({
    mutationFn: async (profilePicture: string | null) => {
      const res = await apiRequest("PATCH", "/api/profile", { profilePicture });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile picture updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update profile picture", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: editedName,
      email: editedEmail || undefined,
      phone: editedPhone || undefined,
    });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword, confirmPassword });
  };

  const handleAddVehicle = () => {
    if (!newVehicle.vehicleNumber) {
      toast({ title: "Vehicle number is required", variant: "destructive" });
      return;
    }
    addVehicleMutation.mutate(newVehicle);
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image size must be less than 2MB", variant: "destructive" });
      return;
    }

    setIsUploadingPicture(true);

    try {
      // Resize and compress the image
      const base64 = await resizeImage(file, 200, 200);
      await updateProfilePictureMutation.mutateAsync(base64);
    } catch (error) {
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingPicture(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const base64 = canvas.toDataURL("image/jpeg", 0.8);
          resolve(base64);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveProfilePicture = async () => {
    setIsUploadingPicture(true);
    try {
      await updateProfilePictureMutation.mutateAsync(null);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case "car":
        return "🚗";
      case "bike":
        return "🏍️";
      case "scooter":
        return "🛵";
      default:
        return "🚙";
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="container px-4 py-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* Profile Header */}
      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-blue-600 h-20 md:h-32" />
          <CardContent className="relative pt-0 p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-3 md:gap-4 -mt-12 md:-mt-12">
              <div className="relative group">
                <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-background shadow-lg">
                  {user?.profilePicture ? (
                    <AvatarImage src={user.profilePicture} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="text-2xl md:text-4xl bg-primary/10 text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Camera overlay button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPicture}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploadingPicture ? (
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  )}
                </button>
                {/* Remove picture button */}
                {user?.profilePicture && user.authProvider !== "google" && !isUploadingPicture && (
                  <button
                    onClick={handleRemoveProfilePicture}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-destructive text-white rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                    title="Remove profile picture"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 text-center md:text-left pb-2 md:pb-4">
                <h1 className="text-xl md:text-2xl font-bold">{user?.name}</h1>
                <p className="text-sm md:text-base text-muted-foreground">@{user?.username}</p>
                <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 justify-center md:justify-start">
                  <Badge variant={user?.isAdmin ? "default" : "secondary"}>
                    {user?.role === "admin" ? "Administrator" : user?.role === "guard" ? "Security Guard" : "Resident"}
                  </Badge>
                  {user?.authProvider === "google" && (
                    <Badge variant="outline" className="gap-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google Connected
                    </Badge>
                  )}
                </div>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(true);
                    setEditedName(user?.name || "");
                    setEditedEmail(user?.email || "");
                    setEditedPhone(user?.phone || "");
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Personal Information */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      disabled={user?.authProvider === "google"}
                    />
                    {user?.authProvider === "google" && (
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed for Google-linked accounts
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Full Name</div>
                      <div className="font-medium">{user?.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{user?.email || "Not set"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{user?.phone || "Not set"}</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Apartment Information */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Apartment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userApartment ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Tower</div>
                      <div className="font-medium">{userTower?.name || `Tower ${userApartment.towerId}`}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Apartment</div>
                      <div className="font-medium">{userApartment.number}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Floor</div>
                      <div className="font-medium">{userApartment.floor}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Type</div>
                      <div className="font-medium">{userApartment.type}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Resident Type</div>
                    <div className="font-medium">
                      <Badge variant={user?.residentType === "OWNER" ? "default" : "secondary"}>
                        {user?.residentType || "Not specified"}
                      </Badge>
                    </div>
                  </div>
                  {otherFamilyMembers.length > 0 && (
                    <div className="pt-2">
                      <div className="text-sm text-muted-foreground mb-2">Family Members</div>
                      <div className="flex flex-wrap gap-2">
                        {otherFamilyMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {member.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No apartment assigned</p>
                  <p className="text-sm mt-1">Please contact the administrator</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security / Change Password */}
        {user?.authProvider === "local" && (
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Change your password</CardDescription>
              </CardHeader>
              <CardContent>
                {isChangingPassword ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
                        <Check className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                      <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Vehicles */}
        {user?.apartmentId && (
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Registered Vehicles
                  </div>
                  <Dialog open={isAddingVehicle} onOpenChange={setIsAddingVehicle}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vehicle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Register New Vehicle</DialogTitle>
                        <DialogDescription>
                          Add a new vehicle to your apartment
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Vehicle Type</Label>
                          <Select
                            value={newVehicle.vehicleType}
                            onValueChange={(value: "car" | "bike" | "scooter" | "other") =>
                              setNewVehicle({ ...newVehicle, vehicleType: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="car">Car</SelectItem>
                              <SelectItem value="bike">Bike</SelectItem>
                              <SelectItem value="scooter">Scooter</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Vehicle Number *</Label>
                          <Input
                            value={newVehicle.vehicleNumber}
                            onChange={(e) =>
                              setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value.toUpperCase() })
                            }
                            placeholder="MH 12 AB 1234"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Make & Model</Label>
                          <Input
                            value={newVehicle.makeModel}
                            onChange={(e) =>
                              setNewVehicle({ ...newVehicle, makeModel: e.target.value })
                            }
                            placeholder="Honda City"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Input
                              value={newVehicle.color}
                              onChange={(e) =>
                                setNewVehicle({ ...newVehicle, color: e.target.value })
                              }
                              placeholder="White"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Parking Slot</Label>
                            <Input
                              value={newVehicle.parkingSlot}
                              onChange={(e) =>
                                setNewVehicle({ ...newVehicle, parkingSlot: e.target.value })
                              }
                              placeholder="P-101"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingVehicle(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddVehicle} disabled={addVehicleMutation.isPending}>
                          Add Vehicle
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingVehicles ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : vehicles && vehicles.length > 0 ? (
                  <div className="space-y-3">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getVehicleTypeIcon(vehicle.vehicleType)}</span>
                          <div>
                            <div className="font-medium">{vehicle.vehicleNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {vehicle.makeModel ? `${vehicle.makeModel}` : vehicle.vehicleType}
                              {vehicle.color && ` - ${vehicle.color}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {vehicle.parkingSlot && (
                            <Badge variant="outline">{vehicle.parkingSlot}</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No vehicles registered</p>
                    <p className="text-sm mt-1">Add your vehicles to your profile</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notification Preferences */}
        <motion.div variants={item} className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* In-App Notifications */}
                <div>
                  <h4 className="text-sm font-medium mb-4">In-App Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="booking-notifications">Booking Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when your bookings are approved or rejected
                        </p>
                      </div>
                      <Switch
                        id="booking-notifications"
                        checked={notificationPrefs?.bookingNotifications ?? true}
                        onCheckedChange={(checked) =>
                          updateNotificationPrefsMutation.mutate({ bookingNotifications: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="complaint-notifications">Complaint Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about your complaint status changes
                        </p>
                      </div>
                      <Switch
                        id="complaint-notifications"
                        checked={notificationPrefs?.complaintNotifications ?? true}
                        onCheckedChange={(checked) =>
                          updateNotificationPrefsMutation.mutate({ complaintNotifications: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="visitor-notifications">Visitor Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when visitors arrive at your apartment
                        </p>
                      </div>
                      <Switch
                        id="visitor-notifications"
                        checked={notificationPrefs?.visitorNotifications ?? true}
                        onCheckedChange={(checked) =>
                          updateNotificationPrefsMutation.mutate({ visitorNotifications: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notice-notifications">Society Notices</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about new society notices and announcements
                        </p>
                      </div>
                      <Switch
                        id="notice-notifications"
                        checked={notificationPrefs?.noticeNotifications ?? true}
                        onCheckedChange={(checked) =>
                          updateNotificationPrefsMutation.mutate({ noticeNotifications: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="system-notifications">System Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive important system notifications and updates
                        </p>
                      </div>
                      <Switch
                        id="system-notifications"
                        checked={notificationPrefs?.systemNotifications ?? true}
                        onCheckedChange={(checked) =>
                          updateNotificationPrefsMutation.mutate({ systemNotifications: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Email Notifications - For future */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Email notifications are coming soon. Stay tuned!
                  </p>
                  <div className="space-y-4 opacity-50 pointer-events-none">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Emergency Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Always receive critical emergency notifications via email
                        </p>
                      </div>
                      <Switch checked={notificationPrefs?.emailEmergencyNotifications ?? true} disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Important Notices</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive important society notices via email
                        </p>
                      </div>
                      <Switch checked={notificationPrefs?.emailNoticeNotifications ?? true} disabled />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
