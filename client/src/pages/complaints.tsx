import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Complaint, ComplaintComment, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileComplaintDialog } from "@/components/FileComplaintDialog";

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

interface ComplaintWithComments extends Complaint {
  comments?: ComplaintComment[];
}

function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: comments, isLoading: isLoadingComments } = useQuery<ComplaintComment[]>({
    queryKey: ["/api/complaints", complaint.id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/complaints/${complaint.id}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: expanded,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.isAdmin || user?.role === "admin",
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const res = await apiRequest("POST", `/api/complaints/${complaint.id}/comments`, {
        comment: commentText,
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints", complaint.id, "comments"] });
      setComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      plumbing: "🔧",
      electrical: "⚡",
      civil: "🏗️",
      housekeeping: "🧹",
      security: "🔒",
      parking: "🚗",
      noise: "🔊",
      other: "📋",
    };
    return icons[category] || "📋";
  };

  const getUserName = (userId: number) => {
    const foundUser = users?.find((u) => u.id === userId);
    return foundUser?.name || "Unknown User";
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{getCategoryIcon(complaint.category)}</span>
              <h3 className="font-semibold">{complaint.title}</h3>
              <Badge className={getStatusColor(complaint.status)}>
                {getStatusIcon(complaint.status)}
                <span className="ml-1 capitalize">{complaint.status.replace("_", " ")}</span>
              </Badge>
              <Badge variant="outline" className={getPriorityColor(complaint.priority)}>
                {complaint.priority.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {complaint.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Filed on {format(new Date(complaint.createdAt), "PPP")}</span>
              <span className="capitalize">{complaint.category}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t p-4 space-y-4 bg-muted/30">
              {/* Full Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>

              {/* Resolution Notes */}
              {complaint.resolutionNotes && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Resolution Notes</h4>
                  <p className="text-sm text-green-700">{complaint.resolutionNotes}</p>
                </div>
              )}

              {/* Timeline info */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span>{format(new Date(complaint.createdAt), "PPp")}</span>
                </div>
                {complaint.updatedAt !== complaint.createdAt && (
                  <div>
                    <span className="text-muted-foreground">Updated: </span>
                    <span>{format(new Date(complaint.updatedAt), "PPp")}</span>
                  </div>
                )}
                {complaint.resolvedAt && (
                  <div>
                    <span className="text-muted-foreground">Resolved: </span>
                    <span>{format(new Date(complaint.resolvedAt), "PPp")}</span>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </h4>

                {isLoadingComments ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-lg ${
                          c.userId === user?.id
                            ? "bg-primary/10 ml-4"
                            : "bg-muted mr-4"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {c.userId === user?.id ? "You" : getUserName(c.userId)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(c.createdAt), "PPp")}
                          </span>
                        </div>
                        <p className="text-sm">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">No comments yet</p>
                )}

                {/* Add Comment */}
                {complaint.status !== "closed" && complaint.status !== "rejected" && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="flex-1"
                      rows={2}
                    />
                    <Button
                      onClick={() => {
                        if (comment.trim()) {
                          addCommentMutation.mutate(comment.trim());
                        }
                      }}
                      disabled={!comment.trim() || addCommentMutation.isPending}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function Complaints() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: complaints, isLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints/my"],
  });

  // Check if user has an apartment assigned
  if (!user?.apartmentId) {
    return (
      <div className="container p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">No Apartment Assigned</h2>
            <p className="text-muted-foreground">
              You need to have an apartment assigned to file complaints. Please contact the administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openComplaints = complaints?.filter(
    (c) => c.status === "open" || c.status === "in_progress"
  );
  const resolvedComplaints = complaints?.filter(
    (c) => c.status === "resolved" || c.status === "closed" || c.status === "rejected"
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="container px-4 py-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={item}
        className="flex flex-col gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent flex items-center gap-2 md:gap-3">
            <AlertCircle className="h-7 w-7 md:h-10 md:w-10 text-red-500" />
            My Complaints
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            File and track maintenance complaints
          </p>
        </div>
        <FileComplaintDialog />
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-3 md:p-4">
            <AlertCircle className="h-5 w-5 md:h-6 md:w-6 mb-1.5 md:mb-2 opacity-75" />
            <div className="text-xl md:text-2xl font-bold">
              {complaints?.filter((c) => c.status === "open").length || 0}
            </div>
            <div className="text-blue-100 text-xs md:text-sm">Open</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-3 md:p-4">
            <Clock className="h-5 w-5 md:h-6 md:w-6 mb-1.5 md:mb-2 opacity-75" />
            <div className="text-xl md:text-2xl font-bold">
              {complaints?.filter((c) => c.status === "in_progress").length || 0}
            </div>
            <div className="text-yellow-100 text-xs md:text-sm">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-3 md:p-4">
            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 mb-1.5 md:mb-2 opacity-75" />
            <div className="text-xl md:text-2xl font-bold">
              {complaints?.filter((c) => c.status === "resolved" || c.status === "closed").length || 0}
            </div>
            <div className="text-green-100 text-xs md:text-sm">Resolved</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <CardContent className="p-3 md:p-4">
            <MessageSquare className="h-5 w-5 md:h-6 md:w-6 mb-1.5 md:mb-2 opacity-75" />
            <div className="text-xl md:text-2xl font-bold">{complaints?.length || 0}</div>
            <div className="text-gray-100 text-xs md:text-sm">Total</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Complaints List */}
      <motion.div variants={item}>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9 md:h-10">
            <TabsTrigger value="active" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Active ({openComplaints?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Resolved ({resolvedComplaints?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 md:mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : openComplaints && openComplaints.length > 0 ? (
              <div className="space-y-4">
                {openComplaints.map((complaint) => (
                  <ComplaintCard key={complaint.id} complaint={complaint} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active complaints</p>
                  <p className="text-sm mt-1">
                    All your complaints have been resolved or you haven't filed any yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-4 md:mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : resolvedComplaints && resolvedComplaints.length > 0 ? (
              <div className="space-y-4">
                {resolvedComplaints.map((complaint) => (
                  <ComplaintCard key={complaint.id} complaint={complaint} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No resolved complaints yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
