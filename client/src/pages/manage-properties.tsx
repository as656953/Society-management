import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  Building2,
  Trash2,
  Home,
  IndianRupee,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Tower {
  id: number;
  name: string;
}

interface Apartment {
  id: number;
  number: string;
  towerId: number;
  type: string;
  floor: number;
  monthlyRent: number | null;
  salePrice: number | null;
  status: "OCCUPIED" | "FOR_RENT" | "FOR_SALE";
  ownerId: number | null;
  contactNumber: string | null;
}

export default function ManageProperties() {
  const { toast } = useToast();
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [isAddTowerOpen, setIsAddTowerOpen] = useState(false);
  const [isAddApartmentOpen, setIsAddApartmentOpen] = useState(false);
  const [newTowerName, setNewTowerName] = useState("");
  const [newApartment, setNewApartment] = useState({
    number: "",
    type: "2BHK",
    floor: 1,
    monthlyRent: "",
    salePrice: "",
    status: "FOR_RENT",
    contactNumber: "",
  });

  const { data: towers, isLoading: isLoadingTowers } = useQuery<Tower[]>({
    queryKey: ["/api/towers"],
  });

  const { data: apartments, isLoading: isLoadingApartments } = useQuery<
    Apartment[]
  >({
    queryKey: ["/api/apartments", selectedTower?.id],
    enabled: !!selectedTower,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/apartments?towerId=${selectedTower!.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch apartments");
      return res.json();
    },
  });

  const addTowerMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/towers", { name });
      if (!res.ok) throw new Error("Failed to add tower");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/towers"] });
      setIsAddTowerOpen(false);
      setNewTowerName("");
      toast({
        title: "Tower added",
        description: "The tower has been added successfully.",
      });
    },
  });

  const addApartmentMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedTower) throw new Error("No tower selected");

      const apartmentData = {
        ...data,
        towerId: selectedTower.id,
        monthlyRent: data.monthlyRent ? parseFloat(data.monthlyRent) : null,
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
      };

      const res = await apiRequest("POST", "/api/apartments", apartmentData);
      if (!res.ok) throw new Error("Failed to add apartment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/apartments", selectedTower?.id],
      });
      setIsAddApartmentOpen(false);
      setNewApartment({
        number: "",
        type: "2BHK",
        floor: 1,
        monthlyRent: "",
        salePrice: "",
        status: "FOR_RENT",
        contactNumber: "",
      });
      toast({
        title: "Apartment added",
        description: "The apartment has been added successfully.",
      });
    },
  });

  const deleteTowerMutation = useMutation({
    mutationFn: async (towerId: number) => {
      const res = await apiRequest("DELETE", `/api/towers/${towerId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete tower");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/towers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
      setSelectedTower(null);
      toast({
        title: "Tower deleted",
        description:
          "The tower and its apartments have been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete tower",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteApartmentMutation = useMutation({
    mutationFn: async (apartmentId: number) => {
      const res = await apiRequest("DELETE", `/api/apartments/${apartmentId}`);
      if (!res.ok) throw new Error("Failed to delete apartment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/apartments", selectedTower?.id],
      });
      toast({
        title: "Apartment deleted",
        description: "The apartment has been deleted successfully.",
      });
    },
  });

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Manage Properties
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage towers and their apartments in your society.
          </p>
        </div>
        <Dialog open={isAddTowerOpen} onOpenChange={setIsAddTowerOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Tower
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tower</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="towerName">Tower Name</Label>
                <Input
                  id="towerName"
                  value={newTowerName}
                  onChange={(e) => setNewTowerName(e.target.value)}
                  placeholder="e.g. Tower A"
                />
              </div>
              <Button
                onClick={() => addTowerMutation.mutate(newTowerName)}
                disabled={!newTowerName || addTowerMutation.isPending}
                className="w-full"
              >
                {addTowerMutation.isPending ? "Adding..." : "Add Tower"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-4 shadow-lg border-border/40">
          <CardHeader className="border-b bg-muted/50 px-6">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Towers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isLoadingTowers ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : towers?.length ? (
              <div className="space-y-2">
                {towers.map((tower) => (
                  <div
                    key={tower.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                      selectedTower?.id === tower.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <button
                      className="flex-1 text-left font-medium"
                      onClick={() => setSelectedTower(tower)}
                    >
                      {tower.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteTowerMutation.mutate(tower.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">No towers found</p>
                <p className="text-sm">Add a tower to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-8 shadow-lg border-border/40">
          <CardHeader className="border-b bg-muted/50 px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Home className="h-5 w-5" />
                {selectedTower
                  ? `${selectedTower.name} Apartments`
                  : "Select a tower to view apartments"}
              </CardTitle>
              {selectedTower && (
                <Dialog
                  open={isAddApartmentOpen}
                  onOpenChange={setIsAddApartmentOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Apartment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Apartment</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="number">Apartment Number</Label>
                          <Input
                            id="number"
                            value={newApartment.number}
                            onChange={(e) =>
                              setNewApartment({
                                ...newApartment,
                                number: e.target.value,
                              })
                            }
                            placeholder="e.g. A-101"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select
                            value={newApartment.type}
                            onValueChange={(value) =>
                              setNewApartment({ ...newApartment, type: value })
                            }
                          >
                            <SelectTrigger id="type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1BHK">1 BHK</SelectItem>
                              <SelectItem value="2BHK">2 BHK</SelectItem>
                              <SelectItem value="3BHK">3 BHK</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="floor">Floor</Label>
                          <Input
                            id="floor"
                            type="number"
                            value={newApartment.floor}
                            onChange={(e) =>
                              setNewApartment({
                                ...newApartment,
                                floor: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={newApartment.status}
                            onValueChange={(value: any) =>
                              setNewApartment({
                                ...newApartment,
                                status: value,
                              })
                            }
                          >
                            <SelectTrigger id="status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FOR_RENT">For Rent</SelectItem>
                              <SelectItem value="FOR_SALE">For Sale</SelectItem>
                              <SelectItem value="OCCUPIED">Occupied</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="monthlyRent">Monthly Rent (₹)</Label>
                          <Input
                            id="monthlyRent"
                            type="number"
                            value={newApartment.monthlyRent}
                            onChange={(e) =>
                              setNewApartment({
                                ...newApartment,
                                monthlyRent: e.target.value,
                              })
                            }
                            placeholder="Enter amount"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salePrice">Sale Price (₹)</Label>
                          <Input
                            id="salePrice"
                            type="number"
                            value={newApartment.salePrice}
                            onChange={(e) =>
                              setNewApartment({
                                ...newApartment,
                                salePrice: e.target.value,
                              })
                            }
                            placeholder="Enter amount"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactNumber">Contact Number</Label>
                          <Input
                            id="contactNumber"
                            value={newApartment.contactNumber}
                            onChange={(e) =>
                              setNewApartment({
                                ...newApartment,
                                contactNumber: e.target.value,
                              })
                            }
                            placeholder="Enter contact number"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          addApartmentMutation.mutate({
                            ...newApartment,
                            towerId: selectedTower.id,
                          })
                        }
                        disabled={
                          !newApartment.number || addApartmentMutation.isPending
                        }
                        className="w-full"
                      >
                        {addApartmentMutation.isPending
                          ? "Adding..."
                          : "Add Apartment"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {!selectedTower ? (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">Select a tower</p>
                <p className="text-sm">
                  Choose a tower to view and manage its apartments.
                </p>
              </div>
            ) : isLoadingApartments ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 w-full animate-pulse bg-muted rounded-lg"
                  />
                ))}
              </div>
            ) : apartments && apartments.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4">
                  {apartments.map((apartment) => (
                    <div
                      key={apartment.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border rounded-xl bg-card hover:shadow-md transition-all duration-200 gap-4"
                    >
                      <div className="space-y-4 w-full sm:flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <h3 className="font-semibold text-lg">
                            {selectedTower.name} - {apartment.number}
                          </h3>
                          <Badge
                            variant={
                              apartment.status === "OCCUPIED"
                                ? "default"
                                : apartment.status === "FOR_RENT"
                                ? "secondary"
                                : "outline"
                            }
                            className="w-fit"
                          >
                            {apartment.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 shrink-0" />
                            <span>
                              {apartment.type} • Floor {apartment.floor}
                            </span>
                          </div>
                          {apartment.monthlyRent && (
                            <div className="flex items-center gap-2">
                              <IndianRupee className="h-4 w-4 shrink-0" />
                              <span>₹{apartment.monthlyRent}/month</span>
                            </div>
                          )}
                          {apartment.salePrice && (
                            <div className="flex items-center gap-2">
                              <IndianRupee className="h-4 w-4 shrink-0" />
                              <span>₹{apartment.salePrice}</span>
                            </div>
                          )}
                          {apartment.contactNumber && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0" />
                              <span>{apartment.contactNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          deleteApartmentMutation.mutate(apartment.id)
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">No apartments found</p>
                <p className="text-sm">
                  Add apartments to {selectedTower.name}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
