import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Amenity, insertBookingSchema } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { format, isBefore, addDays } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2,
  Users,
  Home,
  Dumbbell,
  CalendarDays,
  Clock,
  Users2,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function Amenities() {
  const { toast } = useToast();
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(
    addDays(new Date(), 1)
  );
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "capacity">("name");

  const { data: amenities, isLoading } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStartDate || !selectedEndDate || !selectedAmenity) return;

      if (isBefore(selectedEndDate, selectedStartDate)) {
        throw new Error("End date must be after start date");
      }

      const startTime = new Date(selectedStartDate);
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(selectedEndDate);
      endTime.setHours(21, 0, 0, 0);

      const bookingData = {
        amenityId: selectedAmenity.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "PENDING",
      };

      const res = await apiRequest("POST", "/api/bookings", bookingData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking request submitted",
        description: "Your booking request is pending approval.",
      });
      setSelectedAmenity(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getAmenityIcon = (type: string) => {
    switch (type) {
      case "GYM":
        return <Dumbbell className="h-6 w-6 text-blue-500" />;
      case "GUEST_HOUSE":
        return <Home className="h-6 w-6 text-green-500" />;
      case "CLUBHOUSE":
        return <Users2 className="h-6 w-6 text-purple-500" />;
      default:
        return null;
    }
  };

  const filteredAmenities = amenities?.filter((amenity) =>
    amenity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedAmenities = [...(filteredAmenities || [])].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return (b.maxCapacity || 0) - (a.maxCapacity || 0);
  });

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
                className="p-2 rounded-lg bg-primary/10"
              >
                <Sparkles className="h-6 w-6 text-primary" />
              </motion.div>
              <motion.h1
                className="text-3xl font-bold tracking-tight"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Amenities
              </motion.h1>
            </motion.div>
            <motion.p
              className="text-muted-foreground"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Book and enjoy our premium facilities
            </motion.p>
          </div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 hover:bg-primary/10 transition-colors"
                    onClick={() =>
                      setSortBy(sortBy === "name" ? "capacity" : "name")
                    }
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sort by {sortBy === "name" ? "capacity" : "name"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="relative group">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search amenities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px] focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </motion.div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sortedAmenities?.map((amenity) => (
              <motion.div key={amenity.id} variants={item}>
                <Card className="group hover:shadow-lg transition-all duration-300 border-border/40 overflow-hidden">
                  <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-transparent">
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        {getAmenityIcon(amenity.type)}
                        <span className="font-heading">{amenity.name}</span>
                      </CardTitle>
                      <Dialog
                        open={selectedAmenity?.id === amenity.id}
                        onOpenChange={(open) => {
                          if (!open) setSelectedAmenity(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedAmenity(amenity)}
                            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white transition-all duration-300"
                          >
                            Book Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {getAmenityIcon(amenity.type)}
                              Book {amenity.name}
                            </DialogTitle>
                            <div className="text-sm text-muted-foreground pt-2">
                              Select your booking dates below
                            </div>
                          </DialogHeader>
                          <div className="py-4">
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Start Date
                              </h4>
                              <div className="max-w-[calc(100vw-4rem)] sm:max-w-none overflow-x-auto">
                                <Calendar
                                  mode="single"
                                  selected={selectedStartDate}
                                  onSelect={setSelectedStartDate}
                                  className="rounded-md border"
                                  disabled={(date) =>
                                    isBefore(date, new Date())
                                  }
                                />
                              </div>
                            </div>
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                End Date
                              </h4>
                              <div className="max-w-[calc(100vw-4rem)] sm:max-w-none overflow-x-auto">
                                <Calendar
                                  mode="single"
                                  selected={selectedEndDate}
                                  onSelect={setSelectedEndDate}
                                  className="rounded-md border"
                                  disabled={(date) =>
                                    isBefore(
                                      date,
                                      selectedStartDate || new Date()
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Selected period:
                              </div>
                              <div>
                                From:{" "}
                                {selectedStartDate &&
                                  format(selectedStartDate, "PPP")}
                              </div>
                              <div>
                                To:{" "}
                                {selectedEndDate &&
                                  format(selectedEndDate, "PPP")}
                              </div>
                            </div>
                            <Button
                              className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white transition-all duration-300"
                              onClick={() => bookingMutation.mutate()}
                              disabled={
                                !selectedStartDate ||
                                !selectedEndDate ||
                                bookingMutation.isPending
                              }
                            >
                              {bookingMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Booking...
                                </>
                              ) : (
                                "Confirm Booking"
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4">
                      {amenity.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Max Capacity
                      </span>
                      <span className="font-medium">
                        {amenity.maxCapacity} people
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
