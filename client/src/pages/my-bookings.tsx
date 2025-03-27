import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Booking, Amenity } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Users2,
  Home,
  Dumbbell,
  CheckCircle2,
  XCircle,
  Clock4,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

const headerAnimation = {
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

const iconAnimation = {
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

export default function MyBookings() {
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/user"],
  });

  const { data: amenities } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
  });

  const getAmenityName = (amenityId: number) => {
    return (
      amenities?.find((a) => a.id === amenityId)?.name || "Unknown Amenity"
    );
  };

  const getAmenityIcon = (amenityId: number) => {
    const amenity = amenities?.find((a) => a.id === amenityId);
    if (!amenity) return null;

    switch (amenity.type) {
      case "GYM":
        return <Dumbbell className="h-5 w-5 text-blue-500" />;
      case "GUEST_HOUSE":
        return <Home className="h-5 w-5 text-green-500" />;
      case "CLUBHOUSE":
        return <Users2 className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const pendingBookings = bookings?.filter((b) => b.status === "PENDING") || [];
  const approvedBookings =
    bookings?.filter((b) => b.status === "APPROVED") || [];
  const rejectedBookings =
    bookings?.filter((b) => b.status === "REJECTED") || [];

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border rounded-xl bg-card hover:shadow-lg transition-all duration-300 gap-4 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="space-y-4 w-full sm:flex-1 relative">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
              {getAmenityIcon(booking.amenityId)}
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
              "uppercase text-xs w-fit flex items-center gap-1",
              booking.status === "APPROVED" &&
                "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
              booking.status === "PENDING" &&
                "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
              booking.status === "REJECTED" &&
                "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
            )}
          >
            {booking.status === "APPROVED" && (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {booking.status === "PENDING" && <Clock4 className="h-3 w-3" />}
            {booking.status === "REJECTED" && <XCircle className="h-3 w-3" />}
            {booking.status}
          </Badge>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
            <Calendar className="h-4 w-4" />
            {format(new Date(booking.startTime), "PPP")}
          </div>
          <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
            <Clock className="h-4 w-4" />
            {format(new Date(booking.startTime), "p")} -{" "}
            {format(new Date(booking.endTime), "p")}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="container p-6">
      <div className="flex flex-col gap-6">
        <motion.div
          variants={headerAnimation}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="space-y-1">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                variants={iconAnimation}
                initial="hidden"
                animate="show"
                className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10"
              >
                <Calendar className="h-6 w-6 text-primary" />
              </motion.div>
              <motion.h1
                className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                My Bookings
              </motion.h1>
            </motion.div>
            <motion.p
              className="text-muted-foreground"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Track and manage your amenity bookings
            </motion.p>
          </div>
        </motion.div>

        {isLoadingBookings ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : bookings && bookings.length > 0 ? (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1">
              <TabsTrigger
                value="pending"
                className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-colors duration-200"
              >
                <Clock4 className="h-4 w-4" />
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 transition-colors duration-200"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approved
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="flex items-center gap-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-800 transition-colors duration-200"
              >
                <XCircle className="h-4 w-4" />
                Rejected
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <Card className="shadow-lg border-border/40 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-transparent px-6">
                  <CardTitle className="text-xl">Pending Bookings</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                      >
                        {pendingBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                        {pendingBookings.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <Clock4 className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                            <div className="mb-2 text-lg font-medium">
                              No pending bookings
                            </div>
                            <p className="text-sm">
                              Your pending bookings will appear here.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="approved">
              <Card className="shadow-lg border-border/40 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-transparent px-6">
                  <CardTitle className="text-xl">Approved Bookings</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                      >
                        {approvedBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                        {approvedBookings.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
                            <div className="mb-2 text-lg font-medium">
                              No approved bookings
                            </div>
                            <p className="text-sm">
                              Your approved bookings will appear here.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rejected">
              <Card className="shadow-lg border-border/40 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-transparent px-6">
                  <CardTitle className="text-xl">Rejected Bookings</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                      >
                        {rejectedBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}
                        {rejectedBookings.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500/50" />
                            <div className="mb-2 text-lg font-medium">
                              No rejected bookings
                            </div>
                            <p className="text-sm">
                              Your rejected bookings will appear here.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="shadow-lg border-border/40 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Calendar className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                <div className="mb-2 text-lg font-medium">
                  No bookings found
                </div>
                <p className="text-sm">Start by booking an amenity!</p>
              </motion.div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
