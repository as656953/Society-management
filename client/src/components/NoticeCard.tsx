import { Notice } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 border-red-300",
  NORMAL: "bg-green-100 text-green-800 border-green-300",
  LOW: "bg-gray-100 text-gray-800 border-gray-300",
};

interface NoticeCardProps {
  notice: Notice;
}

export function NoticeCard({ notice }: NoticeCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteNoticeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notices/${notice.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete notice");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notices"] });
      toast({
        title: "Notice deleted",
        description: "The notice has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the notice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isExpired = notice.expiresAt
    ? isPast(new Date(notice.expiresAt))
    : false;

  return (
    <Card className={cn("transition-opacity", isExpired && "opacity-50")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-2">
          <CardTitle>{notice.title}</CardTitle>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className={priorityColors[notice.priority]}
            >
              {notice.priority} Priority
            </Badge>
            {notice.expiresAt &&
              (isExpired ? (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 border-red-300"
                >
                  Expired
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 border-blue-300"
                >
                  Expires {formatDistanceToNow(new Date(notice.expiresAt))}
                </Badge>
              ))}
          </div>
        </div>
        {user?.isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteNoticeMutation.mutate()}
            disabled={deleteNoticeMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap mb-2">{notice.content}</p>
        <p className="text-sm text-muted-foreground">
          Posted on {format(new Date(notice.createdAt), "PPP")}
        </p>
      </CardContent>
    </Card>
  );
}
