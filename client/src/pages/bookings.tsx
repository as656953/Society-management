import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Booking, Amenity, User, Apartment, Tower } from "@shared/schema";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Check,
  X,
  Loader2,
  Calendar,
  Clock,
  User as UserIcon,
  Settings,
  Building2,
  Timer,
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

  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: ["/api/apartments"],
  });

  const { data: towers } = useQuery<Tower[]>({
    queryKey: ["/api/towers"],
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

  const getUserInfo = (userId: number) => {
    const user = users?.find((u) => u.id === userId);
    if (!user) return { name: "Unknown User", username: "", apartment: "" };

    let apartmentInfo = "";
    if (user.apartmentId) {
      const apartment = apartments?.find((a) => a.id === user.apartmentId);
      if (apartment) {
        const tower = towers?.find((t) => t.id === apartment.towerId);
        apartmentInfo = tower
          ? `${tower.name} - ${apartment.number}`
          : apartment.number;
      }
    }

    return {
      name: user.name,
      username: user.username,
      apartment: apartmentInfo,
    };
  };

  const formatDuration = (startTime: Date, endTime: Date) => {
    const totalMinutes = differenceInMinutes(endTime, startTime);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    }
    return `${hours} hr ${minutes} min`;
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
                        whileHover={{ scale: 1.01, y: -2 }}
                        className="group border rounded-xl bg-card hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Header with Amenity Name and Status */}
                        <div className="px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-muted/30 to-transparent relative">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="h-5 w-5 text-primary" />
                              </div>
                              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                                {getAmenityName(booking.amenityId)}
                              </h3>
                            </div>
                            <Badge
                              variant={
                                booking.status === "APPROVED"
                                  ? "default"
                                  : booking.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={cn(
                                "uppercase text-xs w-fit px-3 py-1",
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
                        </div>

                        {/* Content Section */}
                        <div className="p-4 sm:p-6 relative">
                          <div className="space-y-4">
                            {/* User & Apartment Info Grid */}
                            {(() => {
                              const userInfo = getUserInfo(booking.userId);
                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <motion.div
                                    className="bg-muted/50 p-3 rounded-lg"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                      <UserIcon className="h-4 w-4" />
                                      Requested By
                                    </span>
                                    <p className="font-medium mt-1">{userInfo.name}</p>
                                    <p className="text-xs text-muted-foreground">@{userInfo.username}</p>
                                  </motion.div>
                                  <motion.div
                                    className="bg-muted/50 p-3 rounded-lg"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      Apartment
                                    </span>
                                    <p className="font-medium mt-1">{userInfo.apartment || "Not Assigned"}</p>
                                  </motion.div>
                                </div>
                              );
                            })()}

                            {/* Date & Time Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <motion.div
                                className="bg-muted/50 p-3 rounded-lg"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Date
                                </span>
                                <p className="font-medium mt-1">
                                  {format(new Date(booking.startTime), "EEE, MMM d, yyyy")}
                                </p>
                              </motion.div>
                              <motion.div
                                className="bg-muted/50 p-3 rounded-lg"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Time Slot
                                </span>
                                <p className="font-medium mt-1">
                                  {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                                </p>
                              </motion.div>
                              <motion.div
                                className="bg-primary/10 p-3 rounded-lg border border-primary/20"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <span className="text-sm text-primary flex items-center gap-2">
                                  <Timer className="h-4 w-4" />
                                  Duration
                                </span>
                                <p className="font-semibold text-primary mt-1">
                                  {formatDuration(new Date(booking.startTime), new Date(booking.endTime))}
                                </p>
                              </motion.div>
                            </div>
                          </div>

                          {/* Action Buttons for Pending */}
                          {booking.status === "PENDING" && (
                            <div className="flex gap-2 mt-4 pt-4 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    bookingId: booking.id,
                                    status: "APPROVED",
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                {updateStatusMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    bookingId: booking.id,
                                    status: "REJECTED",
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                {updateStatusMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
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
