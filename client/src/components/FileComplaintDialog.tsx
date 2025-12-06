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
import { AlertCircle, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

interface FileComplaintDialogProps {
  trigger?: React.ReactNode;
}

export function FileComplaintDialog({ trigger }: FileComplaintDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "medium",
    },
  });

  const createComplaintMutation = useMutation({
    mutationFn: async (data: ComplaintFormData) => {
      const res = await apiRequest("POST", "/api/complaints", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to file complaint");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints/my"] });
      toast({
        title: "Complaint filed",
        description: "Your complaint has been submitted successfully. We'll get back to you soon.",
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

  const onSubmit = (data: ComplaintFormData) => {
    createComplaintMutation.mutate(data);
  };

  const categories = [
    { value: "plumbing", label: "Plumbing", description: "Water leaks, drainage, pipes" },
    { value: "electrical", label: "Electrical", description: "Power issues, wiring, lights" },
    { value: "civil", label: "Civil", description: "Structural, walls, floors, doors" },
    { value: "housekeeping", label: "Housekeeping", description: "Cleaning, garbage, common areas" },
    { value: "security", label: "Security", description: "Safety concerns, unauthorized access" },
    { value: "parking", label: "Parking", description: "Vehicle issues, space disputes" },
    { value: "noise", label: "Noise", description: "Disturbances, construction" },
    { value: "other", label: "Other", description: "Miscellaneous issues" },
  ];

  const priorities = [
    { value: "low", label: "Low", description: "Can wait a few days" },
    { value: "medium", label: "Medium", description: "Should be addressed soon" },
    { value: "high", label: "High", description: "Needs attention today" },
    { value: "urgent", label: "Urgent", description: "Critical issue, needs immediate action" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
            <AlertCircle className="h-4 w-4 mr-2" />
            File Complaint
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            File a Complaint
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              onValueChange={(value) => setValue("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex flex-col">
                      <span>{cat.label}</span>
                      <span className="text-xs text-muted-foreground">{cat.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select
              defaultValue="medium"
              onValueChange={(value) => setValue("priority", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((pri) => (
                  <SelectItem key={pri.value} value={pri.value}>
                    <div className="flex flex-col">
                      <span className={
                        pri.value === "urgent" ? "text-red-600" :
                        pri.value === "high" ? "text-orange-600" :
                        pri.value === "medium" ? "text-yellow-600" :
                        "text-gray-600"
                      }>
                        {pri.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{pri.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-destructive">{errors.priority.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide detailed information about the issue, including location, when it started, and any other relevant details..."
              rows={5}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
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
              className="bg-red-600 hover:bg-red-700"
              disabled={createComplaintMutation.isPending}
            >
              {createComplaintMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Submit Complaint
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
