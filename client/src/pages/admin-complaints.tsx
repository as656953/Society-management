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
  Filter,
  User as UserIcon,
  Home,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Complaint, ComplaintComment, User, Apartment, Tower } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

function AdminComplaintCard({
  complaint,
  users,
  apartments,
  towers,
}: {
  complaint: Complaint;
  users: User[];
  apartments: Apartment[];
  towers: Tower[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
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

  const updateComplaintMutation = useMutation({
    mutationFn: async (data: Partial<Complaint>) => {
      const res = await apiRequest("PATCH", `/api/complaints/${complaint.id}`, data);
      if (!res.ok) throw new Error("Failed to update complaint");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({
        title: "Complaint updated",
        description: "The complaint has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update complaint",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ commentText, internal }: { commentText: string; internal: boolean }) => {
      const res = await apiRequest("POST", `/api/complaints/${complaint.id}/comments`, {
        comment: commentText,
        isInternal: internal,
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

  const getApartmentInfo = (apartmentId: number) => {
    const apt = apartments?.find((a) => a.id === apartmentId);
    if (!apt) return `Apt #${apartmentId}`;
    const tower = towers?.find((t) => t.id === apt.towerId);
    return tower ? `${tower.name} - ${apt.number}` : apt.number;
  };

  const getUserWithApartment = (userId: number) => {
    const foundUser = users?.find((u) => u.id === userId);
    if (!foundUser) return { name: "Unknown User", apartment: "" };

    let apartmentInfo = "";
    if (foundUser.apartmentId) {
      const apt = apartments?.find((a) => a.id === foundUser.apartmentId);
      if (apt) {
        const tower = towers?.find((t) => t.id === apt.towerId);
        apartmentInfo = tower ? `${tower.name} - ${apt.number}` : apt.number;
      }
    }
    return { name: foundUser.name, apartment: apartmentInfo };
  };

  const createdByUser = users.find((u) => u.id === complaint.createdBy);

  return (
    <Card className={`overflow-hidden ${complaint.priority === "urgent" ? "border-red-300 border-2" : ""}`}>
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
                {complaint.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(complaint.priority)}>
                {complaint.priority.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {complaint.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <UserIcon className="h-3 w-3" />
                <span className="font-medium text-foreground">{createdByUser?.name || "Unknown"}</span>
                {createdByUser?.username && (
                  <span className="text-muted-foreground">(@{createdByUser.username})</span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                <span className="font-medium text-primary">{getApartmentInfo(complaint.apartmentId)}</span>
              </span>
              <span>{format(new Date(complaint.createdAt), "PPP")}</span>
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

              {/* Admin Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select
                    value={complaint.status}
                    onValueChange={(value) => updateComplaintMutation.mutate({ status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Priority</label>
                  <Select
                    value={complaint.priority}
                    onValueChange={(value) => updateComplaintMutation.mutate({ priority: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Assign To</label>
                  <Select
                    value={complaint.assignedTo?.toString() || "unassigned"}
                    onValueChange={(value) =>
                      updateComplaintMutation.mutate({ assignedTo: value === "unassigned" ? null : parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users
                        .filter((u) => u.role === "admin" || u.isAdmin)
                        .map((admin) => (
                          <SelectItem key={admin.id} value={admin.id.toString()}>
                            {admin.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resolution Notes */}
              {(complaint.status === "resolved" || complaint.status === "closed" || complaint.status === "rejected") && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Resolution Notes</label>
                  <Textarea
                    placeholder="Add resolution notes..."
                    defaultValue={complaint.resolutionNotes || ""}
                    onBlur={(e) => {
                      if (e.target.value !== complaint.resolutionNotes) {
                        updateComplaintMutation.mutate({ resolutionNotes: e.target.value });
                      }
                    }}
                    rows={3}
                  />
                </div>
              )}

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
                          c.isInternal
                            ? "bg-yellow-50 border border-yellow-200"
                            : c.userId === user?.id
                            ? "bg-primary/10 ml-4"
                            : "bg-muted mr-4"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {getUserName(c.userId)}
                            </span>
                            {c.isInternal && (
                              <Badge variant="outline" className="text-xs bg-yellow-100">
                                Internal Note
                              </Badge>
                            )}
                          </div>
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
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="flex-1"
                      rows={2}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          if (comment.trim()) {
                            addCommentMutation.mutate({ commentText: comment.trim(), internal: isInternal });
                          }
                        }}
                        disabled={!comment.trim() || addCommentMutation.isPending}
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-muted-foreground">Internal note (not visible to resident)</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function AdminComplaints() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: complaints, isLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: ["/api/apartments"],
  });

  const { data: towers } = useQuery<Tower[]>({
    queryKey: ["/api/towers"],
  });

  // Check if user is admin
  if (user?.role !== "admin" && !user?.isAdmin) {
    return (
      <div className="container p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter complaints
  const filteredComplaints = complaints?.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const createdByUser = users?.find((u) => u.id === c.createdBy);
      const apt = apartments?.find((a) => a.id === c.apartmentId);
      return (
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        createdByUser?.name.toLowerCase().includes(query) ||
        apt?.number.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: complaints?.length || 0,
    open: complaints?.filter((c) => c.status === "open").length || 0,
    inProgress: complaints?.filter((c) => c.status === "in_progress").length || 0,
    resolved: complaints?.filter((c) => c.status === "resolved" || c.status === "closed").length || 0,
    urgent: complaints?.filter((c) => c.priority === "urgent" && c.status !== "resolved" && c.status !== "closed").length || 0,
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="container p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent flex items-center gap-3">
          <AlertCircle className="h-10 w-10 text-red-500" />
          Complaint Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage and resolve resident complaints
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-100 text-sm">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.open}</div>
            <div className="text-blue-100 text-sm">Open</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <div className="text-yellow-100 text-sm">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <div className="text-green-100 text-sm">Resolved</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.urgent}</div>
            <div className="text-red-100 text-sm">Urgent</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="civil">Civil</SelectItem>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="parking">Parking</SelectItem>
                  <SelectItem value="noise">Noise</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              {(statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setCategoryFilter("all");
                    setPriorityFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Complaints List */}
      <motion.div variants={item}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : filteredComplaints && filteredComplaints.length > 0 ? (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <AdminComplaintCard
                key={complaint.id}
                complaint={complaint}
                users={users || []}
                apartments={apartments || []}
                towers={towers || []}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No complaints found</p>
              <p className="text-sm mt-1">
                {statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all" || searchQuery
                  ? "Try adjusting your filters"
                  : "No complaints have been filed yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
