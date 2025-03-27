import { Notice } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

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

  // Auto-delete expired notices after a grace period
  useEffect(() => {
    if (isExpired && user?.isAdmin) {
      const graceHours = 24; // Keep expired notices for 24 hours before auto-deletion
      const expiryTime = new Date(notice.expiresAt!).getTime();
      const deleteTime = expiryTime + graceHours * 60 * 60 * 1000;

      if (Date.now() > deleteTime) {
        deleteNoticeMutation.mutate();
      } else {
        // Schedule deletion after grace period
        const timeoutId = setTimeout(() => {
          deleteNoticeMutation.mutate();
        }, deleteTime - Date.now());

        return () => clearTimeout(timeoutId);
      }
    }
  }, [isExpired, notice.expiresAt, user?.isAdmin]);

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isExpired ? "opacity-50 hover:opacity-80" : "opacity-100",
        "group hover:shadow-md"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-2">
          <CardTitle className={cn(isExpired && "text-muted-foreground")}>
            {notice.title}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                priorityColors[notice.priority],
                isExpired && "opacity-50"
              )}
            >
              {notice.priority} Priority
            </Badge>
            {notice.expiresAt && (
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1",
                  isExpired
                    ? "bg-red-100 text-red-800 border-red-300"
                    : "bg-blue-100 text-blue-800 border-blue-300"
                )}
              >
                <Clock className="w-3 h-3" />
                {isExpired
                  ? "Expired"
                  : `Expires ${formatDistanceToNow(
                      new Date(notice.expiresAt)
                    )}`}
              </Badge>
            )}
          </div>
        </div>
        {user?.isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteNoticeMutation.mutate()}
            disabled={deleteNoticeMutation.isPending}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "whitespace-pre-wrap mb-2",
            isExpired && "text-muted-foreground"
          )}
        >
          {notice.content}
        </p>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          Posted on {format(new Date(notice.createdAt), "PPP")}
          {isExpired && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
              This notice has expired
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
