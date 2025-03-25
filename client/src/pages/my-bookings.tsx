import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Booking, Amenity } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const pendingBookings = bookings?.filter((b) => b.status === "PENDING") || [];
  const approvedBookings =
    bookings?.filter((b) => b.status === "APPROVED") || [];
  const rejectedBookings =
    bookings?.filter((b) => b.status === "REJECTED") || [];

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border rounded-xl bg-card hover:shadow-md transition-all duration-200 gap-4">
      <div className="space-y-4 w-full sm:flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <h3 className="font-semibold text-lg">
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
            className="uppercase text-xs w-fit"
          >
            {booking.status}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 shrink-0 mt-1" />
            <div className="space-y-1">
              <div>
                <span className="text-foreground font-medium">Start:</span>{" "}
                {format(new Date(booking.startTime), "PPP")} at{" "}
                {format(new Date(booking.startTime), "p")}
              </div>
              <div>
                <span className="text-foreground font-medium">End:</span>{" "}
                {format(new Date(booking.endTime), "PPP")} at{" "}
                {format(new Date(booking.endTime), "p")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              <span className="text-foreground font-medium">Duration:</span>{" "}
              {format(new Date(booking.startTime), "p")} -{" "}
              {format(new Date(booking.endTime), "p")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          My Bookings
        </h1>
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Total: {bookings?.length || 0}
          </Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            Pending: {pendingBookings.length}
          </Badge>
        </div>
      </div>

      {isLoadingBookings ? (
        <Card className="shadow-lg border-border/40">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : bookings && bookings.length > 0 ? (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="w-full sm:w-auto p-1">
            <TabsTrigger value="pending" className="flex-1 sm:flex-none">
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex-1 sm:flex-none">
              Approved ({approvedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 sm:flex-none">
              Rejected ({rejectedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="shadow-lg border-border/40">
              <CardHeader className="border-b bg-muted/50 px-6">
                <CardTitle className="text-xl">Pending Bookings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                    {pendingBookings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="mb-2 text-lg font-medium">
                          No pending bookings
                        </div>
                        <p className="text-sm">
                          Your pending bookings will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card className="shadow-lg border-border/40">
              <CardHeader className="border-b bg-muted/50 px-6">
                <CardTitle className="text-xl">Approved Bookings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-4">
                    {approvedBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                    {approvedBookings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="mb-2 text-lg font-medium">
                          No approved bookings
                        </div>
                        <p className="text-sm">
                          Your approved bookings will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card className="shadow-lg border-border/40">
              <CardHeader className="border-b bg-muted/50 px-6">
                <CardTitle className="text-xl">Rejected Bookings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-4">
                    {rejectedBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                    {rejectedBookings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="mb-2 text-lg font-medium">
                          No rejected bookings
                        </div>
                        <p className="text-sm">
                          Your rejected bookings will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="shadow-lg border-border/40">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-2 text-lg font-medium">No bookings found</div>
              <p className="text-sm">Start by booking an amenity!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
