import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  Calendar,
  Clock,
  Phone,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Visitor, PreApprovedVisitor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PreApproveVisitorDialog } from "@/components/PreApproveVisitorDialog";
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

export default function Visitors() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: myVisitors, isLoading: isLoadingVisitors } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors/apartment", user?.apartmentId, "residents"],
    queryFn: async () => {
      if (!user?.apartmentId) return [];
      const res = await fetch(`/api/visitors/apartment/${user.apartmentId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.apartmentId,
  });

  const { data: preApprovedVisitors, isLoading: isLoadingPreApproved } = useQuery<PreApprovedVisitor[]>({
    queryKey: ["/api/pre-approved-visitors/my"],
  });

  const cancelPreApprovalMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/pre-approved-visitors/${id}`);
      if (!res.ok) throw new Error("Failed to cancel pre-approval");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pre-approved-visitors/my"] });
      toast({
        title: "Pre-approval cancelled",
        description: "The visitor pre-approval has been cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel pre-approval",
        variant: "destructive",
      });
    },
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "arrived":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Check if user has an apartment assigned
  if (!user?.apartmentId) {
    return (
      <div className="container p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">No Apartment Assigned</h2>
            <p className="text-muted-foreground">
              You need to have an apartment assigned to manage visitors. Please contact the administrator.
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
            <Users className="h-7 w-7 md:h-10 md:w-10 text-primary" />
            My Visitors
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            View visitor history and pre-approve upcoming visitors
          </p>
        </div>
        <PreApproveVisitorDialog />
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="pre-approved" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9 md:h-10">
            <TabsTrigger value="pre-approved" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Pre-Approved
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Pre-Approved Visitors Tab */}
          <TabsContent value="pre-approved" className="mt-4 md:mt-6">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/50 p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                  Pre-Approved ({preApprovedVisitors?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingPreApproved ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : preApprovedVisitors && preApprovedVisitors.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="divide-y">
                      {preApprovedVisitors.map((visitor) => (
                        <div
                          key={visitor.id}
                          className="p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{visitor.name}</span>
                                <Badge className={getStatusColor(visitor.status)}>
                                  {visitor.status}
                                </Badge>
                              </div>
                              {visitor.mobileNumber && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {visitor.mobileNumber}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(visitor.expectedDate), "PPP")}
                                {visitor.expectedTimeFrom && (
                                  <span>
                                    at {visitor.expectedTimeFrom}
                                    {visitor.expectedTimeTo && ` - ${visitor.expectedTimeTo}`}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getPurposeColor(visitor.purpose)}>
                                  {visitor.purpose}
                                </Badge>
                                {visitor.numberOfPersons > 1 && (
                                  <span className="text-sm text-muted-foreground">
                                    {visitor.numberOfPersons} persons
                                  </span>
                                )}
                              </div>
                              {visitor.notes && (
                                <p className="text-sm text-muted-foreground italic">
                                  "{visitor.notes}"
                                </p>
                              )}
                            </div>
                            {visitor.status === "pending" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Pre-Approval?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will cancel the pre-approval for {visitor.name}. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelPreApprovalMutation.mutate(visitor.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Cancel Pre-Approval
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pre-approved visitors</p>
                    <p className="text-sm mt-1">
                      Use the "Pre-Approve Visitor" button to add expected visitors
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visitor History Tab */}
          <TabsContent value="history" className="mt-4 md:mt-6">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/50 p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                  Visitor History ({myVisitors?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingVisitors ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : myVisitors && myVisitors.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="divide-y">
                      {myVisitors.map((visitor) => (
                        <div
                          key={visitor.id}
                          className="p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{visitor.name}</span>
                              {visitor.status === "inside" ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Inside
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">
                                  Checked Out
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {visitor.mobileNumber}
                            </div>
                            {visitor.vehicleNumber && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Car className="h-3 w-3" />
                                {visitor.vehicleNumber}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge className={getPurposeColor(visitor.purpose)}>
                                {visitor.purpose}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                In: {format(new Date(visitor.entryTime), "PPp")}
                              </span>
                              {visitor.exitTime && (
                                <span className="text-sm text-muted-foreground">
                                  Out: {format(new Date(visitor.exitTime), "PPp")}
                                </span>
                              )}
                            </div>
                            {visitor.notes && (
                              <p className="text-sm text-muted-foreground italic">
                                "{visitor.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No visitor history</p>
                    <p className="text-sm mt-1">
                      Visitors to your apartment will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
