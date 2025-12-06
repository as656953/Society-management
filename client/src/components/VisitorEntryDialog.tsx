import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Loader2 } from "lucide-react";
import { Apartment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const visitorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  purpose: z.string().min(1, "Purpose is required"),
  apartmentId: z.number().min(1, "Apartment is required"),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

interface Tower {
  id: number;
  name: string;
}

export function VisitorEntryDialog() {
  const [open, setOpen] = useState(false);
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: ["/api/apartments"],
  });

  const { data: towers } = useQuery<Tower[]>({
    queryKey: ["/api/towers"],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      name: "",
      mobileNumber: "",
      purpose: "",
      apartmentId: 0,
      vehicleNumber: "",
      notes: "",
    },
  });

  const createVisitorMutation = useMutation({
    mutationFn: async (data: VisitorFormData) => {
      const res = await apiRequest("POST", "/api/visitors", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create visitor entry");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/today"] });
      toast({
        title: "Visitor logged",
        description: "The visitor has been logged successfully.",
      });
      reset();
      setSelectedTower(null);
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VisitorFormData) => {
    createVisitorMutation.mutate(data);
  };

  const filteredApartments = selectedTower
    ? apartments?.filter((a) => a.towerId === selectedTower)
    : apartments;

  const purposes = [
    { value: "personal", label: "Personal Visit" },
    { value: "delivery", label: "Delivery" },
    { value: "service", label: "Service (Plumber, Electrician, etc.)" },
    { value: "maintenance", label: "Maintenance" },
    { value: "family", label: "Family/Relative" },
    { value: "other", label: "Other" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-500" />
            Log Visitor Entry
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Visitor Name *</Label>
            <Input
              id="name"
              placeholder="Enter visitor name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number *</Label>
            <Input
              id="mobileNumber"
              placeholder="Enter mobile number"
              {...register("mobileNumber")}
            />
            {errors.mobileNumber && (
              <p className="text-sm text-destructive">{errors.mobileNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Visit *</Label>
            <Select
              onValueChange={(value) => setValue("purpose", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {purposes.map((purpose) => (
                  <SelectItem key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.purpose && (
              <p className="text-sm text-destructive">{errors.purpose.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tower</Label>
              <Select
                onValueChange={(value) => setSelectedTower(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tower" />
                </SelectTrigger>
                <SelectContent>
                  {towers?.map((tower) => (
                    <SelectItem key={tower.id} value={tower.id.toString()}>
                      {tower.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apartmentId">Apartment *</Label>
              <Select
                onValueChange={(value) => setValue("apartmentId", parseInt(value))}
                disabled={!selectedTower}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select apartment" />
                </SelectTrigger>
                <SelectContent>
                  {filteredApartments?.map((apt) => (
                    <SelectItem key={apt.id} value={apt.id.toString()}>
                      {apt.number} (Floor {apt.floor})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.apartmentId && (
                <p className="text-sm text-destructive">{errors.apartmentId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">Vehicle Number (Optional)</Label>
            <Input
              id="vehicleNumber"
              placeholder="e.g., MH12AB1234"
              {...register("vehicleNumber")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              {...register("notes")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedTower(null);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={createVisitorMutation.isPending}
            >
              {createVisitorMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Log Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
