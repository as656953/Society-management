import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Apartment } from "@shared/schema";
import {
  Loader2,
  Building2,
  Home,
  Phone,
  IndianRupee,
  Edit,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

function getTowerLetter(towerId: number): string {
  return String.fromCharCode(64 + towerId); // A = 65 in ASCII
}

function formatCurrency(amount: string | number | null): string {
  if (!amount) return "N/A";
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

export default function ApartmentDirectory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTower, setSelectedTower] = useState<string>("");
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(
    null
  );
  const [formData, setFormData] = useState({
    ownerName: "",
    status: "OCCUPIED",
    monthlyRent: "",
    salePrice: "",
    contactNumber: "",
  });

  // Add towers query
  const { data: towers, isLoading: isLoadingTowers } = useQuery<
    { id: number; name: string }[]
  >({
    queryKey: ["/api/towers"],
  });

  const { data: apartments, isLoading } = useQuery<Apartment[]>({
    queryKey: [`/api/towers/${selectedTower}/apartments`],
    enabled: !!selectedTower,
  });

  const updateApartmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!editingApartment) return;

      const updateData = {
        ...data,
        monthlyRent: data.monthlyRent ? parseFloat(data.monthlyRent) : null,
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
      };

      const res = await apiRequest(
        "PATCH",
        `/api/apartments/${editingApartment.id}`,
        updateData
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/towers/${selectedTower}/apartments`],
      });
      toast({
        title: "Apartment updated successfully",
      });
      setEditingApartment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update apartment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setFormData({
      ownerName: apartment.ownerName || "",
      status: apartment.status,
      monthlyRent: apartment.monthlyRent?.toString() || "",
      salePrice: apartment.salePrice?.toString() || "",
      contactNumber: apartment.contactNumber || "",
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateApartmentMutation.mutate(formData);
  };

  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Apartment Directory</h1>
        <Select value={selectedTower} onValueChange={setSelectedTower}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Tower">
              {selectedTower && towers
                ? towers.find((t) => t.id.toString() === selectedTower)?.name
                : "Select Tower"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {isLoadingTowers ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              towers?.map((tower) => (
                <SelectItem key={tower.id} value={tower.id.toString()}>
                  {tower.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {isLoading || !selectedTower ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          {!selectedTower ? (
            <p>Select a tower to view apartments</p>
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments?.map((apartment) => (
            <Card
              key={apartment.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {towers?.find((t) => t.id === apartment.towerId)?.name} -{" "}
                      {apartment.number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 text-sm rounded-full ${
                        apartment.status === "AVAILABLE_RENT"
                          ? "bg-blue-100 text-blue-800"
                          : apartment.status === "AVAILABLE_SALE"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {apartment.status === "AVAILABLE_RENT"
                        ? "For Rent"
                        : apartment.status === "AVAILABLE_SALE"
                        ? "For Sale"
                        : "Occupied"}
                    </div>
                    {user?.isAdmin && (
                      <Dialog
                        open={editingApartment?.id === apartment.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingApartment(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(apartment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Edit Apartment{" "}
                              {`${
                                towers?.find((t) => t.id === apartment.towerId)
                                  ?.name
                              } - ${apartment.number}`}
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">
                                Owner Name
                              </label>
                              <Input
                                value={formData.ownerName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    ownerName: e.target.value,
                                  })
                                }
                                placeholder="Owner Name"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Status
                              </label>
                              <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="OCCUPIED">
                                    Occupied
                                  </SelectItem>
                                  <SelectItem value="AVAILABLE_RENT">
                                    Available for Rent
                                  </SelectItem>
                                  <SelectItem value="AVAILABLE_SALE">
                                    Available for Sale
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Monthly Rent (₹)
                              </label>
                              <Input
                                type="number"
                                value={formData.monthlyRent}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    monthlyRent: e.target.value,
                                  })
                                }
                                placeholder="Monthly Rent"
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                Set monthly rent even if not currently for rent
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Sale Price (₹)
                              </label>
                              <Input
                                type="number"
                                value={formData.salePrice}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    salePrice: e.target.value,
                                  })
                                }
                                placeholder="Sale Price"
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                Set sale price even if not currently for sale
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Contact Number
                              </label>
                              <Input
                                value={formData.contactNumber}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    contactNumber: e.target.value,
                                  })
                                }
                                placeholder="Contact Number"
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={updateApartmentMutation.isPending}
                            >
                              {updateApartmentMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Update Apartment"
                              )}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Floor
                      </span>
                      <p className="font-medium">{apartment.floor}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Type
                      </span>
                      <p className="font-medium">{apartment.type}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Owner
                    </span>
                    <p className="font-medium">
                      {apartment.ownerName || "N/A"}
                    </p>
                  </div>

                  {user?.isAdmin ? (
                    <>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Monthly Rent
                        </span>
                        <p className="font-medium text-green-600">
                          {formatCurrency(apartment.monthlyRent)}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Sale Price
                        </span>
                        <p className="font-medium text-green-600">
                          {formatCurrency(apartment.salePrice)}
                        </p>
                      </div>
                      {apartment.contactNumber && (
                        <div>
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Contact
                          </span>
                          <p className="font-medium">
                            {apartment.contactNumber}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {(apartment.status === "AVAILABLE_RENT" ||
                        apartment.status === "AVAILABLE_SALE") && (
                        <>
                          {apartment.status === "AVAILABLE_RENT" &&
                            apartment.monthlyRent && (
                              <div>
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                  <IndianRupee className="h-4 w-4" />
                                  Monthly Rent
                                </span>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(apartment.monthlyRent)}
                                </p>
                              </div>
                            )}

                          {apartment.status === "AVAILABLE_SALE" &&
                            apartment.salePrice && (
                              <div>
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                  <IndianRupee className="h-4 w-4" />
                                  Sale Price
                                </span>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(apartment.salePrice)}
                                </p>
                              </div>
                            )}

                          {apartment.contactNumber && (
                            <div>
                              <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Contact
                              </span>
                              <p className="font-medium">
                                {apartment.contactNumber}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
