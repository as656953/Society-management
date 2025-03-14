import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Building2, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Booking, Apartment } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/user"],
  });

  const { data: apartments, isLoading: isLoadingApartments } = useQuery<
    Apartment[]
  >({
    queryKey: ["/api/apartments"],
  });

  const userApartment = apartments?.find((a) => a.id === user?.apartmentId);

  return (
    <div className="container p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Apartment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Your Apartment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingApartments ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : userApartment ? (
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Tower:</span>{" "}
                  {userApartment.towerId}
                </p>
                <p>
                  <span className="font-medium">Floor:</span>{" "}
                  {userApartment.floor}
                </p>
                <p>
                  <span className="font-medium">Apartment:</span>{" "}
                  {userApartment.number}
                </p>
                <p>
                  <span className="font-medium">Type:</span>{" "}
                  {userApartment.type}
                </p>
              </div>
            ) : (
              <div className="text-muted-foreground">
                No apartment assigned yet. Please contact the administrator.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/amenities">
              <Button className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Book Amenity
              </Button>
            </Link>
            <Link href="/apartments">
              <Button variant="outline" className="w-full">
                <Building2 className="mr-2 h-4 w-4" />
                View Directory
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBookings ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : bookings && bookings.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          Amenity ID: {booking.amenityId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.startTime), "PPP p")} -{" "}
                          {format(new Date(booking.endTime), "p")}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm ${
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
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found. Start by booking an amenity!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
