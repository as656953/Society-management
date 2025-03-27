import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  User,
  Bell,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Booking, Apartment, Amenity, Notice } from "@shared/schema";
import { Link } from "wouter";
import { NoticeCard } from "@/components/NoticeCard";
import { CreateNoticeDialog } from "@/components/CreateNoticeDialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/user"],
  });

  const { data: amenities } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
  });

  const { data: apartments, isLoading: isLoadingApartments } = useQuery<
    Apartment[]
  >({
    queryKey: ["/api/apartments"],
  });

  const { data: notices, isLoading: isLoadingNotices } = useQuery<Notice[]>({
    queryKey: ["/api/notices"],
  });

  const userApartment = apartments?.find((a) => a.id === user?.apartmentId);

  const getAmenityName = (amenityId: number) => {
    return (
      amenities?.find((a) => a.id === amenityId)?.name || "Unknown Amenity"
    );
  };

  const pendingBookings = bookings?.filter((b) => b.status === "PENDING") || [];
  const activeNotices =
    notices?.filter((n) => {
      if (!n.expiresAt) return true;
      const expiryDate = new Date(n.expiresAt);
      const now = new Date();
      return expiryDate > now;
    }) || [];

  // Automatically refetch notices every minute to check for expiration
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/notices"] });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="container p-6 space-y-6"
    >
      {/* Welcome Section */}
      <motion.div
        variants={item}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening in your society today
          </p>
        </div>
        {user?.isAdmin && <CreateNoticeDialog />}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <motion.div variants={item} className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <Bell className="h-8 w-8 mb-4 opacity-75" />
              <div className="text-2xl font-bold mb-1">
                {activeNotices.length}
              </div>
              <div className="text-blue-100">Active Notices</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <Clock className="h-8 w-8 mb-4 opacity-75" />
              <div className="text-2xl font-bold mb-1">
                {pendingBookings.length}
              </div>
              <div className="text-purple-100">Pending Bookings</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Apartment Information */}
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/50">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Your Apartment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingApartments ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : userApartment ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Tower</div>
                      <div className="font-medium mt-1">
                        {userApartment.towerId}
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Floor</div>
                      <div className="font-medium mt-1">
                        {userApartment.floor}
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Number
                      </div>
                      <div className="font-medium mt-1">
                        {userApartment.number}
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Type</div>
                      <div className="font-medium mt-1">
                        {userApartment.type}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No apartment assigned</p>
                  <p className="text-sm mt-1">
                    Please contact the administrator
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Notices Section */}
        <motion.div variants={item} className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/50">
              <CardTitle>Recent Notices</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingNotices ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : notices && notices.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {notices
                      .sort((a, b) => {
                        // Sort by expiration (expired notices at the bottom)
                        const aExpired =
                          a.expiresAt && new Date(a.expiresAt) < new Date();
                        const bExpired =
                          b.expiresAt && new Date(b.expiresAt) < new Date();
                        if (aExpired !== bExpired) return aExpired ? 1 : -1;

                        // Then by priority
                        const priorityOrder = { HIGH: 3, NORMAL: 2, LOW: 1 };
                        const priorityDiff =
                          priorityOrder[b.priority] - priorityOrder[a.priority];
                        if (priorityDiff !== 0) return priorityDiff;

                        // Finally by creation date
                        return (
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                        );
                      })
                      .map((notice) => (
                        <NoticeCard key={notice.id} notice={notice} />
                      ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No notices available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/50">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Link href="/amenities">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Amenity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/apartments">
                  <Button variant="outline" className="w-full group">
                    <Building2 className="mr-2 h-4 w-4" />
                    View Directory
                    <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/50">
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingBookings ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : bookings && bookings.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {bookings
                      .filter((booking) => booking.status === "PENDING")
                      .map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              booking.status === "APPROVED"
                                ? "bg-green-500"
                                : booking.status === "PENDING"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {getAmenityName(booking.amenityId)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(booking.startTime), "PPP")} at{" "}
                              {format(new Date(booking.startTime), "p")}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "px-3 py-1 rounded-full text-sm font-medium",
                              booking.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {booking.status}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No bookings found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start by booking an amenity!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
