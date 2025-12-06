import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Building2,
  Users,
  Image,
  ToggleLeft,
  ToggleRight,
  Dumbbell,
  Home,
  PartyPopper,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Amenity } from "@shared/schema";

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

const amenityTypes = [
  { value: "GYM", label: "Gym", icon: Dumbbell },
  { value: "GUEST_HOUSE", label: "Guest House", icon: Home },
  { value: "CLUBHOUSE", label: "Clubhouse", icon: PartyPopper },
  { value: "POOL", label: "Swimming Pool", icon: Building2 },
  { value: "SPORTS", label: "Sports Facility", icon: Building2 },
  { value: "OTHER", label: "Other", icon: Building2 },
];

export default function ManageAmenities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddingAmenity, setIsAddingAmenity] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);

  const [newAmenity, setNewAmenity] = useState({
    name: "",
    type: "GYM",
    description: "",
    maxCapacity: "",
    imageUrl: "",
    isActive: true,
  });

  const { data: amenities, isLoading } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities/all"],
  });

  const createAmenityMutation = useMutation({
    mutationFn: async (data: typeof newAmenity) => {
      const res = await apiRequest("POST", "/api/amenities", {
        ...data,
        maxCapacity: data.maxCapacity ? parseInt(data.maxCapacity) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Amenity created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      setIsAddingAmenity(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create amenity", description: error.message, variant: "destructive" });
    },
  });

  const updateAmenityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Amenity> }) => {
      const res = await apiRequest("PATCH", `/api/amenities/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Amenity updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      setEditingAmenity(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update amenity", description: error.message, variant: "destructive" });
    },
  });

  const deleteAmenityMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/amenities/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Amenity deactivated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to deactivate amenity", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setNewAmenity({
      name: "",
      type: "GYM",
      description: "",
      maxCapacity: "",
      imageUrl: "",
      isActive: true,
    });
  };

  const handleCreateAmenity = () => {
    if (!newAmenity.name || !newAmenity.type) {
      toast({ title: "Name and type are required", variant: "destructive" });
      return;
    }
    createAmenityMutation.mutate(newAmenity);
  };

  const handleUpdateAmenity = () => {
    if (!editingAmenity) return;
    updateAmenityMutation.mutate({
      id: editingAmenity.id,
      data: {
        name: editingAmenity.name,
        type: editingAmenity.type,
        description: editingAmenity.description,
        maxCapacity: editingAmenity.maxCapacity,
        imageUrl: editingAmenity.imageUrl,
        isActive: editingAmenity.isActive,
      },
    });
  };

  const toggleAmenityStatus = (amenity: Amenity) => {
    updateAmenityMutation.mutate({
      id: amenity.id,
      data: { isActive: !amenity.isActive },
    });
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = amenityTypes.find((t) => t.value === type);
    const Icon = typeInfo?.icon || Building2;
    return <Icon className="h-5 w-5" />;
  };

  const getTypeLabel = (type: string) => {
    return amenityTypes.find((t) => t.value === type)?.label || type;
  };

  if (!user?.isAdmin) {
    return (
      <div className="container p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="container p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Amenities</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and manage society amenities
          </p>
        </div>
        <Dialog open={isAddingAmenity} onOpenChange={setIsAddingAmenity}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Amenity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Amenity</DialogTitle>
              <DialogDescription>
                Create a new amenity for residents to book
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newAmenity.name}
                  onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })}
                  placeholder="Main Gym"
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={newAmenity.type}
                  onValueChange={(value) => setNewAmenity({ ...newAmenity, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {amenityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newAmenity.description}
                  onChange={(e) => setNewAmenity({ ...newAmenity, description: e.target.value })}
                  placeholder="Fully equipped gym with modern equipment..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Capacity</Label>
                  <Input
                    type="number"
                    value={newAmenity.maxCapacity}
                    onChange={(e) => setNewAmenity({ ...newAmenity, maxCapacity: e.target.value })}
                    placeholder="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={newAmenity.imageUrl}
                    onChange={(e) => setNewAmenity({ ...newAmenity, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingAmenity(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAmenity} disabled={createAmenityMutation.isPending}>
                Create Amenity
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Amenities</div>
            <div className="text-2xl font-bold">{amenities?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {amenities?.filter((a) => a.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Inactive</div>
            <div className="text-2xl font-bold text-red-600">
              {amenities?.filter((a) => !a.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Capacity</div>
            <div className="text-2xl font-bold">
              {amenities?.reduce((sum, a) => sum + (a.maxCapacity || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Amenities List */}
      <motion.div variants={item}>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading amenities...</div>
        ) : amenities && amenities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {amenities.map((amenity) => (
              <Card
                key={amenity.id}
                className={`overflow-hidden ${!amenity.isActive ? "opacity-60" : ""}`}
              >
                {amenity.imageUrl && (
                  <div className="h-32 bg-muted overflow-hidden">
                    <img
                      src={amenity.imageUrl}
                      alt={amenity.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(amenity.type)}
                      <CardTitle className="text-lg">{amenity.name}</CardTitle>
                    </div>
                    <Badge variant={amenity.isActive ? "default" : "secondary"}>
                      {amenity.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{getTypeLabel(amenity.type)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {amenity.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {amenity.description}
                    </p>
                  )}
                  {amenity.maxCapacity && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Users className="h-4 w-4" />
                      <span>Max capacity: {amenity.maxCapacity}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAmenity(amenity)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAmenityStatus(amenity)}
                    >
                      {amenity.isActive ? (
                        <>
                          <ToggleRight className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">No amenities yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first amenity to get started
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAmenity} onOpenChange={(open) => !open && setEditingAmenity(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Amenity</DialogTitle>
            <DialogDescription>
              Update amenity details
            </DialogDescription>
          </DialogHeader>
          {editingAmenity && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={editingAmenity.name}
                  onChange={(e) =>
                    setEditingAmenity({ ...editingAmenity, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={editingAmenity.type}
                  onValueChange={(value) =>
                    setEditingAmenity({ ...editingAmenity, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {amenityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingAmenity.description || ""}
                  onChange={(e) =>
                    setEditingAmenity({ ...editingAmenity, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Capacity</Label>
                  <Input
                    type="number"
                    value={editingAmenity.maxCapacity || ""}
                    onChange={(e) =>
                      setEditingAmenity({
                        ...editingAmenity,
                        maxCapacity: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={editingAmenity.imageUrl || ""}
                    onChange={(e) =>
                      setEditingAmenity({ ...editingAmenity, imageUrl: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAmenity(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAmenity} disabled={updateAmenityMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
