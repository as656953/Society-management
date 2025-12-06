import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Shield,
  UserPlus,
  LogOut,
  Clock,
  Users,
  Search,
  Phone,
  Car,
  Home,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";
import { Visitor, PreApprovedVisitor, Apartment, Tower } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VisitorEntryDialog } from "@/components/VisitorEntryDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export default function GuardDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: activeVisitors, isLoading: isLoadingActive } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors/active"],
  });

  const { data: todayVisitors, isLoading: isLoadingToday } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors/today"],
  });

  const { data: preApprovedVisitors, isLoading: isLoadingPreApproved } = useQuery<PreApprovedVisitor[]>({
    queryKey: ["/api/pre-approved-visitors/pending"],
  });

  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: ["/api/apartments"],
  });

  const { data: towers } = useQuery<Tower[]>({
    queryKey: ["/api/towers"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (visitorId: number) => {
      const res = await apiRequest("PATCH", `/api/visitors/${visitorId}/checkout`, {});
      if (!res.ok) throw new Error("Failed to checkout visitor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/today"] });
      toast({
        title: "Visitor checked out",
        description: "The visitor has been checked out successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to checkout visitor",
        variant: "destructive",
      });
    },
  });

  const markArrivedMutation = useMutation({
    mutationFn: async (visitorId: number) => {
      const res = await apiRequest("PATCH", `/api/pre-approved-visitors/${visitorId}/status`, {
        status: "arrived",
      });
      if (!res.ok) throw new Error("Failed to mark as arrived");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pre-approved-visitors/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/today"] });
      toast({
        title: "Visitor marked as arrived",
        description: "The pre-approved visitor has been logged in and marked as arrived.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark visitor as arrived",
        variant: "destructive",
      });
    },
  });

  const getApartmentInfo = (apartmentId: number) => {
    const apt = apartments?.find((a) => a.id === apartmentId);
    if (!apt) return `Apt #${apartmentId}`;
    const tower = towers?.find((t) => t.id === apt.towerId);
    return tower ? `${tower.name} - ${apt.number}` : apt.number;
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case "delivery":
        return "bg-orange-100 text-orange-800";
      case "family":
        return "bg-blue-100 text-blue-800";
      case "service":
        return "bg-purple-100 text-purple-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "personal":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredActiveVisitors = activeVisitors?.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.mobileNumber.includes(searchQuery)
  );

  const filteredPreApproved = preApprovedVisitors?.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.mobileNumber && v.mobileNumber.includes(searchQuery))
  );

  // Check if user has guard or admin role
  if (user?.role !== "guard" && user?.role !== "admin" && !user?.isAdmin) {
    return (
      <div className="container p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the Guard Dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="container px-4 py-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={item}
        className="flex flex-col gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-2 md:gap-3">
            <Shield className="h-7 w-7 md:h-10 md:w-10 text-primary" />
            Guard Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Manage visitor entries and exits
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[200px] md:w-[250px] h-9"
            />
          </div>
          <VisitorEntryDialog />
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-3 md:p-6">
            <Users className="h-5 w-5 md:h-8 md:w-8 mb-1.5 md:mb-4 opacity-75" />
            <div className="text-xl md:text-2xl font-bold mb-0.5 md:mb-1">
              {activeVisitors?.length || 0}
            </div>
            <div className="text-green-100 text-xs md:text-base">Inside</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-3 md:p-6">
            <Clock className="h-5 w-5 md:h-8 md:w-8 mb-1.5 md:mb-4 opacity-75" />
            <div className="text-xl md:text-2xl font-bold mb-0.5 md:mb-1">
              {todayVisitors?.length || 0}
            </div>
            <div className="text-blue-100 text-xs md:text-base">Today</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-3 md:p-6">
            <Calendar className="h-5 w-5 md:h-8 md:w-8 mb-1.5 md:mb-4 opacity-75" />
            <div className="text-xl md:text-2xl font-bold mb-0.5 md:mb-1">
              {preApprovedVisitors?.length || 0}
            </div>
            <div className="text-purple-100 text-xs md:text-base">Expected</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-3 md:p-6">
            <CheckCircle className="h-5 w-5 md:h-8 md:w-8 mb-1.5 md:mb-4 opacity-75" />
            <div className="text-xl md:text-2xl font-bold mb-0.5 md:mb-1">
              {todayVisitors?.filter((v) => v.status === "checked_out").length || 0}
            </div>
            <div className="text-orange-100 text-xs md:text-base">Out</div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Active Visitors */}
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/50 p-3 md:p-6">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                Inside ({filteredActiveVisitors?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingActive ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : filteredActiveVisitors && filteredActiveVisitors.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {filteredActiveVisitors.map((visitor) => (
                      <div
                        key={visitor.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{visitor.name}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {visitor.mobileNumber}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Home className="h-3 w-3" />
                              {getApartmentInfo(visitor.apartmentId)}
                            </div>
                            {visitor.vehicleNumber && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Car className="h-3 w-3" />
                                {visitor.vehicleNumber}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getPurposeColor(visitor.purpose)}>
                                {visitor.purpose}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                In: {format(new Date(visitor.entryTime), "p")}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => checkoutMutation.mutate(visitor.id)}
                            disabled={checkoutMutation.isPending}
                          >
                            <LogOut className="h-4 w-4 mr-1" />
                            Checkout
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No visitors currently inside</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pre-Approved Visitors */}
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/50 p-3 md:p-6">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                Expected ({filteredPreApproved?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingPreApproved ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : filteredPreApproved && filteredPreApproved.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {filteredPreApproved.map((visitor) => (
                      <div
                        key={visitor.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{visitor.name}</div>
                            {visitor.mobileNumber && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {visitor.mobileNumber}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Home className="h-3 w-3" />
                              {getApartmentInfo(visitor.apartmentId)}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getPurposeColor(visitor.purpose)}>
                                {visitor.purpose}
                              </Badge>
                              {visitor.expectedTimeFrom && (
                                <span className="text-xs text-muted-foreground">
                                  Expected: {visitor.expectedTimeFrom}
                                  {visitor.expectedTimeTo && ` - ${visitor.expectedTimeTo}`}
                                </span>
                              )}
                            </div>
                            {visitor.numberOfPersons > 1 && (
                              <div className="text-sm text-muted-foreground">
                                {visitor.numberOfPersons} persons
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => markArrivedMutation.mutate(visitor.id)}
                            disabled={markArrivedMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Arrived
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pre-approved visitors expected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
