import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Booking, Amenity, User } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Bookings</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="space-y-4">
              <div className="h-12 w-full animate-pulse bg-muted rounded" />
              <div className="h-12 w-full animate-pulse bg-muted rounded" />
              <div className="h-12 w-full animate-pulse bg-muted rounded" />
            </div>
          ) : visibleBookings && visibleBookings.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {visibleBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {getAmenityName(booking.amenityId)}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          by {getUserName(booking.userId)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.startTime), "PPP p")} -{" "}
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

                    {booking.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
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
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
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
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
