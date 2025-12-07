import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Database,
  Download,
  Trash2,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  MessageSquare,
  Bell,
  Megaphone,
  HardDrive,
  RefreshCw,
  SkipForward,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StorageStatus {
  currentPeriod: {
    month: number;
    year: number;
    isReminderPeriod: boolean;
    isCleanupDay: boolean;
    isPastCleanupDay: boolean;
    scheduledDate: string;
    reminderStartDate: string;
    cutoffDate: string;
  };
  preview: {
    bookings: number;
    visitors: number;
    complaints: number;
    notifications: number;
    notices: number;
    cutoffDate: string;
  };
  cleanupLog: {
    id: number;
    month: number;
    year: number;
    status: string;
    bookingsCsvDownloaded: boolean;
    visitorsCsvDownloaded: boolean;
    complaintsCsvDownloaded: boolean;
    notificationsCsvDownloaded: boolean;
    noticesCsvDownloaded: boolean;
    bookingsDeleted: number | null;
    visitorsDeleted: number | null;
    complaintsDeleted: number | null;
    notificationsDeleted: number | null;
    noticesDeleted: number | null;
    emailSentAt: string | null;
    emailSentTo: string | null;
    completedAt: string | null;
  };
  allDownloaded: boolean;
  shouldShowReminder: boolean;
}

interface CleanupHistory {
  id: number;
  month: number;
  year: number;
  status: string;
  bookingsDeleted: number | null;
  visitorsDeleted: number | null;
  complaintsDeleted: number | null;
  notificationsDeleted: number | null;
  noticesDeleted: number | null;
  completedAt: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function StorageManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  const { data: status, isLoading, refetch } = useQuery<StorageStatus>({
    queryKey: ["/api/storage/status"],
  });

  const { data: history } = useQuery<CleanupHistory[]>({
    queryKey: ["/api/storage/history"],
    enabled: showHistory,
  });

  // Check for reminder on mount
  useEffect(() => {
    if (status?.shouldShowReminder) {
      apiRequest("POST", "/api/storage/check-reminder");
    }
  }, [status?.shouldShowReminder]);

  const downloadMutation = useMutation({
    mutationFn: async (type: string) => {
      // Fetch the CSV file
      const response = await fetch(`/api/storage/export/${type}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${type}-cleanup.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return type;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storage/status"] });
      toast({
        title: "Download Started",
        description: "Your CSV file is being downloaded.",
      });
    },
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/storage/send-email");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/storage/status"] });
      toast({
        title: "Email Sent",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email. Check SMTP settings.",
        variant: "destructive",
      });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async (force: boolean = false) => {
      const res = await apiRequest("POST", "/api/storage/cleanup", { force });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/storage/status"] });
      toast({
        title: "Cleanup Complete",
        description: `Deleted: ${data.results.bookingsDeleted} bookings, ${data.results.visitorsDeleted} visitors, ${data.results.complaintsDeleted} complaints, ${data.results.notificationsDeleted} notifications, ${data.results.noticesDeleted} notices.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to perform cleanup.",
        variant: "destructive",
      });
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/storage/skip-cleanup");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storage/status"] });
      toast({
        title: "Cleanup Skipped",
        description: "This month's cleanup has been skipped.",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="container p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading storage management...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container p-6 text-center">
        <p className="text-muted-foreground">Failed to load storage status.</p>
      </div>
    );
  }

  const totalRecords =
    status.preview.bookings +
    status.preview.visitors +
    status.preview.complaints +
    status.preview.notifications +
    status.preview.notices;

  const downloadedCount = [
    status.cleanupLog.bookingsCsvDownloaded,
    status.cleanupLog.visitorsCsvDownloaded,
    status.cleanupLog.complaintsCsvDownloaded,
    status.cleanupLog.notificationsCsvDownloaded,
    status.cleanupLog.noticesCsvDownloaded,
  ].filter(Boolean).length;

  const downloadProgress = (downloadedCount / 5) * 100;

  const getStatusBadge = (statusValue: string) => {
    const badges: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      reminded: { variant: "default", label: "Reminder Sent" },
      downloaded: { variant: "default", label: "Downloaded" },
      completed: { variant: "default", label: "Completed" },
      skipped: { variant: "outline", label: "Skipped" },
    };
    const badge = badges[statusValue] || { variant: "secondary" as const, label: statusValue };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="container px-4 py-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
              <HardDrive className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Storage Management
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Monthly database cleanup and data export
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Reminder Alert */}
      {status.shouldShowReminder && (
        <motion.div variants={item}>
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Monthly Cleanup Reminder
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    The automatic cleanup is scheduled for the 25th of this month.
                    Please download all data backups before cleanup occurs.
                    {25 - new Date().getDate() > 0 && (
                      <span className="font-medium">
                        {" "}({25 - new Date().getDate()} days remaining)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Status Overview */}
      <motion.div variants={item} className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Current Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {monthNames[status.currentPeriod.month - 1]} {status.currentPeriod.year}
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div>Reminder: 20th - 24th</div>
              <div>Cleanup: 25th</div>
            </div>
            <div className="mt-3">
              {getStatusBadge(status.cleanupLog.status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data to Clean
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalRecords.toLocaleString()} records
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Older than 3 months
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Cutoff: {new Date(status.preview.cutoffDate).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {downloadedCount}/5
            </div>
            <Progress value={downloadProgress} className="mt-2" />
            <div className="text-sm text-muted-foreground mt-2">
              {status.allDownloaded ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  All downloaded
                </span>
              ) : (
                "Download all before cleanup"
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Categories */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>
              Download CSV backups for each data category before cleanup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Bookings */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Bookings</div>
                    <div className="text-sm text-muted-foreground">
                      {status.preview.bookings} records
                    </div>
                  </div>
                </div>
                <Button
                  variant={status.cleanupLog.bookingsCsvDownloaded ? "outline" : "default"}
                  size="sm"
                  onClick={() => downloadMutation.mutate("bookings")}
                  disabled={downloadMutation.isPending}
                >
                  {status.cleanupLog.bookingsCsvDownloaded ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Visitors */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Visitor Logs</div>
                    <div className="text-sm text-muted-foreground">
                      {status.preview.visitors} records
                    </div>
                  </div>
                </div>
                <Button
                  variant={status.cleanupLog.visitorsCsvDownloaded ? "outline" : "default"}
                  size="sm"
                  onClick={() => downloadMutation.mutate("visitors")}
                  disabled={downloadMutation.isPending}
                >
                  {status.cleanupLog.visitorsCsvDownloaded ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Complaints */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium">Resolved Complaints</div>
                    <div className="text-sm text-muted-foreground">
                      {status.preview.complaints} records
                    </div>
                  </div>
                </div>
                <Button
                  variant={status.cleanupLog.complaintsCsvDownloaded ? "outline" : "default"}
                  size="sm"
                  onClick={() => downloadMutation.mutate("complaints")}
                  disabled={downloadMutation.isPending}
                >
                  {status.cleanupLog.complaintsCsvDownloaded ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Bell className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      {status.preview.notifications} records
                    </div>
                  </div>
                </div>
                <Button
                  variant={status.cleanupLog.notificationsCsvDownloaded ? "outline" : "default"}
                  size="sm"
                  onClick={() => downloadMutation.mutate("notifications")}
                  disabled={downloadMutation.isPending}
                >
                  {status.cleanupLog.notificationsCsvDownloaded ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Notices */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Megaphone className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-medium">Expired Notices</div>
                    <div className="text-sm text-muted-foreground">
                      {status.preview.notices} records
                    </div>
                  </div>
                </div>
                <Button
                  variant={status.cleanupLog.noticesCsvDownloaded ? "outline" : "default"}
                  size="sm"
                  onClick={() => downloadMutation.mutate("notices")}
                  disabled={downloadMutation.isPending}
                >
                  {status.cleanupLog.noticesCsvDownloaded ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Manage your monthly cleanup process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Email Action */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Email Backup</div>
                    <div className="text-sm text-muted-foreground">
                      Send all CSVs to your email
                    </div>
                  </div>
                </div>
                {status.cleanupLog.emailSentAt && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Last sent: {new Date(status.cleanupLog.emailSentAt).toLocaleString()}
                    {status.cleanupLog.emailSentTo && ` to ${status.cleanupLog.emailSentTo}`}
                  </div>
                )}
                <Button
                  onClick={() => emailMutation.mutate()}
                  disabled={emailMutation.isPending}
                  className="w-full"
                >
                  {emailMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>

              {/* Skip Action */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <SkipForward className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Skip This Month</div>
                    <div className="text-sm text-muted-foreground">
                      Data will be included next month
                    </div>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={status.cleanupLog.status === "completed" || status.cleanupLog.status === "skipped"}
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip Cleanup
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Skip This Month's Cleanup?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The data scheduled for cleanup will be preserved and included in next month's cleanup instead.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => skipMutation.mutate()}>
                        Skip
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Separator />

            {/* Cleanup Action */}
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <div className="flex items-center gap-3 mb-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <div>
                  <div className="font-medium text-destructive">Perform Cleanup</div>
                  <div className="text-sm text-muted-foreground">
                    Permanently delete old data from database
                  </div>
                </div>
              </div>
              {status.cleanupLog.completedAt && (
                <div className="text-xs text-muted-foreground mb-2">
                  Last cleanup: {new Date(status.cleanupLog.completedAt).toLocaleString()}
                </div>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={
                      cleanupMutation.isPending ||
                      status.cleanupLog.status === "completed"
                    }
                  >
                    {cleanupMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Cleaning...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {status.cleanupLog.status === "completed"
                          ? "Cleanup Completed"
                          : "Run Cleanup Now"}
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Database Cleanup</AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-2">
                        <p>This will permanently delete the following data older than 3 months:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>{status.preview.bookings} booking records</li>
                          <li>{status.preview.visitors} visitor logs</li>
                          <li>{status.preview.complaints} resolved complaints</li>
                          <li>{status.preview.notifications} notifications</li>
                          <li>{status.preview.notices} expired notices</li>
                        </ul>
                        {!status.allDownloaded && (
                          <p className="text-yellow-600 font-medium mt-4">
                            Warning: Not all CSVs have been downloaded yet!
                          </p>
                        )}
                        <p className="font-medium mt-4">This action cannot be undone.</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cleanupMutation.mutate(!status.allDownloaded)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Delete Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cleanup History */}
      {showHistory && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Cleanup History
              </CardTitle>
              <CardDescription>Previous monthly cleanups</CardDescription>
            </CardHeader>
            <CardContent>
              {history && history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {monthNames[log.month - 1]} {log.year}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.completedAt
                            ? `Completed: ${new Date(log.completedAt).toLocaleDateString()}`
                            : "Not completed"}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(log.status)}
                        {log.status === "completed" && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {(log.bookingsDeleted || 0) +
                              (log.visitorsDeleted || 0) +
                              (log.complaintsDeleted || 0) +
                              (log.notificationsDeleted || 0) +
                              (log.noticesDeleted || 0)}{" "}
                            records deleted
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No cleanup history available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div variants={item}>
        <Card className="bg-muted/50">
          <CardContent className="p-4 md:p-6">
            <h3 className="font-semibold mb-2">How It Works</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Reminder Period (20th-24th):</strong> You'll receive notifications to download your data backups.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Download className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Export Data:</strong> Download CSV files for each category or send them all to your email.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Cleanup (25th):</strong> Data older than 3 months is automatically deleted to optimize storage.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Protected Data:</strong> User accounts, apartments, amenities, and active data are never deleted.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
