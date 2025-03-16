import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Booking, Amenity } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-1">
        <p className="font-medium">{getAmenityName(booking.amenityId)}</p>
        <p className="text-sm text-muted-foreground">
          Start: {format(new Date(booking.startTime), "PPP")} at{" "}
          {format(new Date(booking.startTime), "p")}
          <br />
          End: {format(new Date(booking.endTime), "PPP")} at{" "}
          {format(new Date(booking.endTime), "p")}
        </p>
        <div
          className={`inline-block px-2 py-1 rounded-full text-sm ${
            booking.status === "APPROVED"
              ? "bg-green-100 text-green-800"
              : booking.status === "PENDING"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {booking.status}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      {isLoadingBookings ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : bookings && bookings.length > 0 ? (
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                    {pendingBookings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No pending bookings
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {approvedBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                    {approvedBookings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No approved bookings
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {rejectedBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                    {rejectedBookings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No rejected bookings
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No bookings found. Start by booking an amenity!
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
