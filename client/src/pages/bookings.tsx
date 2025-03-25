import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Booking, Amenity, User } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User as UserIcon } from "lucide-react";

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
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Manage Bookings
        </h1>
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Total: {visibleBookings?.length || 0}
          </Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            Pending:{" "}
            {visibleBookings?.filter((b) => b.status === "PENDING").length || 0}
          </Badge>
        </div>
      </div>

      <Card className="shadow-lg border-border/40">
        <CardHeader className="border-b bg-muted/50 px-6">
          <CardTitle className="text-xl">All Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoadingBookings ? (
            <div className="space-y-4 p-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 w-full animate-pulse bg-muted rounded-lg"
                />
              ))}
            </div>
          ) : visibleBookings && visibleBookings.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              <div className="space-y-4">
                {visibleBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border rounded-xl bg-card hover:shadow-md transition-all duration-200 gap-4"
                  >
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
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {getUserName(booking.userId)}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 shrink-0 mt-1" />
                          <div className="space-y-1">
                            <div>
                              <span className="text-foreground font-medium">
                                Start:
                              </span>{" "}
                              {format(new Date(booking.startTime), "PPP")} at{" "}
                              {format(new Date(booking.startTime), "p")}
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
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0" />
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
                          className="flex-1 sm:flex-initial bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
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
                          className="flex-1 sm:flex-initial bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
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
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="mb-2 text-lg font-medium">No bookings found</div>
              <p className="text-sm">
                When new bookings are made, they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
