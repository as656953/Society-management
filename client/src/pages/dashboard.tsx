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
  Users,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Booking, Apartment, Amenity, Notice, User as UserType } from "@shared/schema";
import { Link } from "wouter";
import { NoticeCard } from "@/components/NoticeCard";
import { CreateNoticeDialog } from "@/components/CreateNoticeDialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  const { data: towers } = useQuery<Tower[]>({
    queryKey: ["/api/towers"],
  });

  const { data: notices, isLoading: isLoadingNotices } = useQuery<Notice[]>({
    queryKey: ["/api/notices"],
  });

  // For admin: get all users to count unassigned
  const { data: allUsers } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: user?.isAdmin,
  });

  // Get residents of user's apartment (family members)
  const { data: apartmentResidents } = useQuery<UserType[]>({
    queryKey: ["/api/apartments", user?.apartmentId, "residents"],
    queryFn: async () => {
      if (!user?.apartmentId) return [];
      const res = await fetch(`/api/apartments/${user.apartmentId}/residents`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.apartmentId,
  });

  const userApartment = apartments?.find((a) => a.id === user?.apartmentId);
  const userTower = towers?.find((t) => t.id === userApartment?.towerId);
  const unassignedUsersCount = allUsers?.filter((u) => !u.apartmentId).length || 0;

  // Family members are other users with same apartment (excluding current user)
  const familyMembers = apartmentResidents?.filter((r) => r.id !== user?.id) || [];

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
      className="container px-4 py-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* Welcome Section */}
      <motion.div
        variants={item}
        className="flex flex-col gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Here's what's happening in your society today
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Alert for Unassigned Users */}
          {user?.isAdmin && unassignedUsersCount > 0 && (
            <Link href="/users">
              <Badge
                variant="destructive"
                className="px-2 py-1 md:px-3 md:py-1.5 cursor-pointer hover:bg-destructive/90 flex items-center gap-1.5 text-xs md:text-sm"
              >
                <AlertTriangle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                {unassignedUsersCount} unassigned
              </Badge>
            </Link>
          )}
          {user?.isAdmin && <CreateNoticeDialog />}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Quick Stats */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 md:p-6">
              <Bell className="h-6 w-6 md:h-8 md:w-8 mb-2 md:mb-4 opacity-75" />
              <div className="text-xl md:text-2xl font-bold mb-0.5 md:mb-1">
                {activeNotices.length}
              </div>
              <div className="text-blue-100 text-xs md:text-sm">Active Notices</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 md:p-6">
              <Clock className="h-6 w-6 md:h-8 md:w-8 mb-2 md:mb-4 opacity-75" />
              <div className="text-xl md:text-2xl font-bold mb-0.5 md:mb-1">
                {pendingBookings.length}
              </div>
              <div className="text-purple-100 text-xs md:text-sm">Pending Bookings</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Apartment Information */}
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/50 p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Building2 className="h-4 w-4 md:h-5 md:w-5" />
                Your Apartment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {isLoadingApartments ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : userApartment ? (
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className="p-2 md:p-3 bg-muted rounded-lg">
                      <div className="text-xs md:text-sm text-muted-foreground">Tower</div>
                      <div className="font-medium text-sm md:text-base mt-0.5 md:mt-1">
                        {userTower?.name || `Tower ${userApartment.towerId}`}
                      </div>
                    </div>
                    <div className="p-2 md:p-3 bg-muted rounded-lg">
                      <div className="text-xs md:text-sm text-muted-foreground">Floor</div>
                      <div className="font-medium text-sm md:text-base mt-0.5 md:mt-1">
                        {userApartment.floor}
                      </div>
                    </div>
                    <div className="p-2 md:p-3 bg-muted rounded-lg">
                      <div className="text-xs md:text-sm text-muted-foreground">
                        Number
                      </div>
                      <div className="font-medium text-sm md:text-base mt-0.5 md:mt-1">
                        {userApartment.number}
                      </div>
                    </div>
                    <div className="p-2 md:p-3 bg-muted rounded-lg">
                      <div className="text-xs md:text-sm text-muted-foreground">Type</div>
                      <div className="font-medium text-sm md:text-base mt-0.5 md:mt-1">
                        {userApartment.type}
                      </div>
                    </div>
                  </div>
                  {/* Family Members Section */}
                  {familyMembers.length > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Family Members</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {familyMembers.map((member) => (
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
            <CardHeader className="border-b bg-muted/50 p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Recent Notices</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
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
                        const priorityOrder: Record<string, number> = { HIGH: 3, NORMAL: 2, LOW: 1 };
                        const priorityDiff =
                          (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
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
            <CardHeader className="border-b bg-muted/50 p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
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
                {user?.apartmentId && (
                  <Link href="/complaints">
                    <Button variant="outline" className="w-full group text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      File Complaint
                      <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/50 p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
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
