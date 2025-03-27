import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Booking, Amenity, User } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Check,
  X,
  Loader2,
  Calendar,
  Clock,
  User as UserIcon,
  Settings,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const headerVariants = {
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

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  show: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.2,
    },
  },
};

export default function Bookings() {
  const { toast } = useToast();

  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: amenities } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: number;
      status: "APPROVED" | "REJECTED";
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/bookings/${bookingId}/status`,
        { status }
      );
      if (!res.ok) {
        throw new Error("Failed to update booking status");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: `Booking ${variables.status.toLowerCase()}`,
        description:
          variables.status === "APPROVED"
            ? "The booking has been approved successfully."
            : "The booking has been rejected and removed from the list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getAmenityName = (amenityId: number) => {
    return (
      amenities?.find((a) => a.id === amenityId)?.name || "Unknown Amenity"
    );
  };

  const getUserName = (userId: number) => {
    const user = users?.find((u) => u.id === userId);
    return user ? `${user.name} (${user.username})` : "Unknown User";
  };

  // Filter out rejected bookings as they will be automatically hidden by the backend
  const visibleBookings = bookings?.filter(
    (booking) => booking.deletedAt == null
  );

  return (
    <div className="container p-6 space-y-8">
      {/* Header Section */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            className="relative"
            variants={headerVariants}
            initial="hidden"
            animate="show"
          >
            <div className="flex items-center gap-3">
              <motion.div variants={iconVariants} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl" />
                <Settings className="h-8 w-8 text-primary relative z-10" />
              </motion.div>
              <div className="relative">
                <h1 className="text-4xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary animate-gradient-x">
                  Manage Bookings
                </h1>
                <motion.div
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          </motion.div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="text-sm px-3 py-1 bg-primary/5">
              Total: {visibleBookings?.length || 0}
            </Badge>
            <Badge
              variant="secondary"
              className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800"
            >
              Pending:{" "}
              {visibleBookings?.filter((b) => b.status === "PENDING").length ||
                0}
            </Badge>
          </div>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <Card className="shadow-lg border-border/40 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-transparent px-6">
            <CardTitle className="text-xl">All Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isLoadingBookings ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 w-full animate-pulse bg-muted rounded-lg"
                  />
                ))}
              </div>
            ) : visibleBookings && visibleBookings.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    {visibleBookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        variants={itemVariants}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border rounded-xl bg-card hover:shadow-lg transition-all duration-300 gap-4 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="space-y-4 w-full sm:flex-1 relative">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                              {getAmenityName(booking.amenityId)}
                            </h3>
                            <Badge
                              variant={
                                booking.status === "APPROVED"
                                  ? "default"
                                  : booking.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={cn(
                                "uppercase text-xs w-fit",
                                booking.status === "APPROVED" &&
                                  "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
                                booking.status === "PENDING" &&
                                  "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
                                booking.status === "REJECTED" &&
                                  "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                              )}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                              <UserIcon className="h-4 w-4" />
                              <span className="truncate">
                                {getUserName(booking.userId)}
                              </span>
                            </div>
                            <div className="flex items-start gap-2 group-hover:text-primary transition-colors duration-300">
                              <Calendar className="h-4 w-4 mt-1" />
                              <div className="space-y-1">
                                <div>
                                  <span className="text-foreground font-medium">
                                    Start:
                                  </span>{" "}
                                  {format(new Date(booking.startTime), "PPP")}{" "}
                                  at {format(new Date(booking.startTime), "p")}
                                </div>
                                <div>
                                  <span className="text-foreground font-medium">
                                    End:
                                  </span>{" "}
                                  {format(new Date(booking.endTime), "PPP")} at{" "}
                                  {format(new Date(booking.endTime), "p")}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                              <Clock className="h-4 w-4" />
                              <span>
                                <span className="text-foreground font-medium">
                                  Duration:
                                </span>{" "}
                                {format(new Date(booking.startTime), "p")} -{" "}
                                {format(new Date(booking.endTime), "p")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {booking.status === "PENDING" && (
                          <div className="flex gap-2 w-full sm:w-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-initial bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200 relative group"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  bookingId: booking.id,
                                  status: "APPROVED",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <span className="absolute inset-0 w-0 bg-green-100 group-hover:w-full transition-all duration-300 rounded-md" />
                              {updateStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2 relative" />
                                  <span className="relative">Approve</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-initial bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200 relative group"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  bookingId: booking.id,
                                  status: "REJECTED",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <span className="absolute inset-0 w-0 bg-red-100 group-hover:w-full transition-all duration-300 rounded-md" />
                              {updateStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-2 relative" />
                                  <span className="relative">Reject</span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </ScrollArea>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 text-muted-foreground"
              >
                <Calendar className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                <div className="mb-2 text-lg font-medium">
                  No bookings found
                </div>
                <p className="text-sm">
                  When new bookings are made, they will appear here.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
