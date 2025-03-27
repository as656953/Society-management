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
  Search,
  Filter,
  ArrowUpDown,
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
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("number");
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

  // Filter and sort apartments
  const filteredApartments = apartments
    ?.filter((apt) => {
      const matchesSearch =
        apt.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || apt.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "number":
          return a.number.localeCompare(b.number);
        case "floor":
          return a.floor - b.floor;
        case "price":
          const aPrice = a.monthlyRent || 0;
          const bPrice = b.monthlyRent || 0;
          return Number(aPrice) - Number(bPrice);
        default:
          return 0;
      }
    });

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: {
      y: 20,
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        mass: 1,
      },
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const statusVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
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
                <Building2 className="h-8 w-8 text-primary relative z-10" />
              </motion.div>
              <div className="relative">
                <h1 className="text-4xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary animate-gradient-x">
                  Apartment Directory
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
          <Select value={selectedTower} onValueChange={setSelectedTower}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Tower" />
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

        {selectedTower && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search apartments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("OCCUPIED")}>
                  Occupied
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("AVAILABLE_RENT")}
                >
                  Available for Rent
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("AVAILABLE_SALE")}
                >
                  Available for Sale
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sort By
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setSortBy("number")}>
                  Apartment Number
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("floor")}>
                  Floor Number
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price")}>
                  Price
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content Section */}
      <AnimatePresence mode="wait">
        {!selectedTower ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center h-64 text-muted-foreground"
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                transition: { duration: 1, repeat: Infinity, repeatDelay: 2 },
              }}
            >
              <Building2 className="h-12 w-12 mb-4 opacity-50" />
            </motion.div>
            <p className="text-lg font-medium mb-2">
              Select a tower to view apartments
            </p>
            <p className="text-sm">
              Choose from available towers to see apartment listings
            </p>
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-background via-muted to-background animate-pulse" />
                <CardHeader className="space-y-4">
                  <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredApartments?.map((apartment) => (
              <motion.div
                key={apartment.id}
                variants={cardVariants}
                whileHover="hover"
                whileTap="tap"
                layout
              >
                <Card className="group relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  />
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.div variants={iconVariants}>
                          <Building2 className="h-5 w-5 text-primary" />
                        </motion.div>
                        <span className="font-heading">
                          {
                            towers?.find((t) => t.id === apartment.towerId)
                              ?.name
                          }{" "}
                          - {apartment.number}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div variants={statusVariants}>
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-3 py-1 text-sm font-medium",
                              apartment.status === "AVAILABLE_RENT" &&
                                "bg-blue-100 text-blue-800 border-blue-300",
                              apartment.status === "AVAILABLE_SALE" &&
                                "bg-green-100 text-green-800 border-green-300",
                              apartment.status === "OCCUPIED" &&
                                "bg-gray-100 text-gray-800 border-gray-300"
                            )}
                          >
                            {apartment.status === "AVAILABLE_RENT"
                              ? "For Rent"
                              : apartment.status === "AVAILABLE_SALE"
                              ? "For Sale"
                              : "Occupied"}
                          </Badge>
                        </motion.div>
                        {user?.isAdmin && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                                      className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                                      onClick={() => handleEdit(apartment)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle className="font-display">
                                        Edit Apartment{" "}
                                        {`${
                                          towers?.find(
                                            (t) => t.id === apartment.towerId
                                          )?.name
                                        } - ${apartment.number}`}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <form
                                      onSubmit={handleUpdate}
                                      className="space-y-4"
                                    >
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
                                            setFormData({
                                              ...formData,
                                              status: value,
                                            })
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
                                          Set monthly rent even if not currently
                                          for rent
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
                                          Set sale price even if not currently
                                          for sale
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
                                        disabled={
                                          updateApartmentMutation.isPending
                                        }
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
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit apartment details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div
                          className="bg-muted/50 p-3 rounded-lg cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-sm text-muted-foreground">
                            Floor
                          </span>
                          <p className="font-medium font-heading">
                            {apartment.floor}
                          </p>
                        </motion.div>
                        <motion.div
                          className="bg-muted/50 p-3 rounded-lg cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-sm text-muted-foreground">
                            Type
                          </span>
                          <p className="font-medium font-heading">
                            {apartment.type}
                          </p>
                        </motion.div>
                      </div>

                      <motion.div
                        className="bg-muted/50 p-3 rounded-lg cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          Owner
                        </span>
                        <p className="font-medium font-heading">
                          {apartment.ownerName || "N/A"}
                        </p>
                      </motion.div>

                      {user?.isAdmin ? (
                        <>
                          <motion.div
                            className="bg-muted/50 p-3 rounded-lg cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <IndianRupee className="h-4 w-4" />
                              Monthly Rent
                            </span>
                            <p className="font-medium text-green-600">
                              {formatCurrency(apartment.monthlyRent)}
                            </p>
                          </motion.div>
                          <motion.div
                            className="bg-muted/50 p-3 rounded-lg cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <IndianRupee className="h-4 w-4" />
                              Sale Price
                            </span>
                            <p className="font-medium text-green-600">
                              {formatCurrency(apartment.salePrice)}
                            </p>
                          </motion.div>
                          {apartment.contactNumber && (
                            <motion.div
                              className="bg-muted/50 p-3 rounded-lg cursor-pointer"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Contact
                              </span>
                              <p className="font-medium">
                                {apartment.contactNumber}
                              </p>
                            </motion.div>
                          )}
                        </>
                      ) : (
                        <>
                          {(apartment.status === "AVAILABLE_RENT" ||
                            apartment.status === "AVAILABLE_SALE") && (
                            <>
                              {apartment.status === "AVAILABLE_RENT" &&
                                apartment.monthlyRent && (
                                  <motion.div
                                    className="bg-muted/50 p-3 rounded-lg cursor-pointer"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                      <IndianRupee className="h-4 w-4" />
                                      Monthly Rent
                                    </span>
                                    <p className="font-medium text-green-600">
                                      {formatCurrency(apartment.monthlyRent)}
                                    </p>
                                  </motion.div>
                                )}

                              {apartment.status === "AVAILABLE_SALE" &&
                                apartment.salePrice && (
                                  <motion.div
                                    className="bg-muted/50 p-3 rounded-lg cursor-pointer"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                      <IndianRupee className="h-4 w-4" />
                                      Sale Price
                                    </span>
                                    <p className="font-medium text-green-600">
                                      {formatCurrency(apartment.salePrice)}
                                    </p>
                                  </motion.div>
                                )}

                              {apartment.contactNumber && (
                                <motion.div
                                  className="bg-muted/50 p-3 rounded-lg cursor-pointer"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Contact
                                  </span>
                                  <p className="font-medium">
                                    {apartment.contactNumber}
                                  </p>
                                </motion.div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
