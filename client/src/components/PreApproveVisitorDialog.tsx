import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, UserPlus, Loader2 } from "lucide-react";
import { format, isBefore, startOfToday } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const preApproveSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobileNumber: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  expectedDate: z.date({ required_error: "Expected date is required" }),
  expectedTimeFrom: z.string().optional(),
  expectedTimeTo: z.string().optional(),
  numberOfPersons: z.number().min(1, "At least 1 person required").default(1),
  notes: z.string().optional(),
});

type PreApproveFormData = z.infer<typeof preApproveSchema>;

export function PreApproveVisitorDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PreApproveFormData>({
    resolver: zodResolver(preApproveSchema),
    defaultValues: {
      name: "",
      mobileNumber: "",
      purpose: "",
      expectedTimeFrom: "",
      expectedTimeTo: "",
      numberOfPersons: 1,
      notes: "",
    },
  });

  const selectedDate = watch("expectedDate");

  const createPreApprovalMutation = useMutation({
    mutationFn: async (data: PreApproveFormData) => {
      const res = await apiRequest("POST", "/api/pre-approved-visitors", {
        ...data,
        expectedDate: data.expectedDate.toISOString(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create pre-approval");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pre-approved-visitors/my"] });
      toast({
        title: "Pre-approval created",
        description: "Your visitor has been pre-approved. The guard will be notified.",
      });
      reset();
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

  const onSubmit = (data: PreApproveFormData) => {
    createPreApprovalMutation.mutate(data);
  };

  const purposes = [
    { value: "personal", label: "Personal Visit" },
    { value: "delivery", label: "Delivery" },
    { value: "service", label: "Service (Plumber, Electrician, etc.)" },
    { value: "maintenance", label: "Maintenance" },
    { value: "family", label: "Family/Relative" },
    { value: "other", label: "Other" },
  ];

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          Pre-Approve Visitor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-purple-500" />
            Pre-Approve Visitor
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
            <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
            <Input
              id="mobileNumber"
              placeholder="Enter mobile number"
              {...register("mobileNumber")}
            />
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

          <div className="space-y-2">
            <Label>Expected Date *</Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setValue("expectedDate", date)}
                  disabled={(date) => isBefore(date, startOfToday())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.expectedDate && (
              <p className="text-sm text-destructive">{errors.expectedDate.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expected Time From</Label>
              <Select
                onValueChange={(value) => setValue("expectedTimeFrom", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expected Time To</Label>
              <Select
                onValueChange={(value) => setValue("expectedTimeTo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfPersons">Number of Persons</Label>
            <Input
              id="numberOfPersons"
              type="number"
              min="1"
              defaultValue={1}
              {...register("numberOfPersons", { valueAsNumber: true })}
            />
            {errors.numberOfPersons && (
              <p className="text-sm text-destructive">{errors.numberOfPersons.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions for the guard..."
              {...register("notes")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={createPreApprovalMutation.isPending}
            >
              {createPreApprovalMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Pre-Approve
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
