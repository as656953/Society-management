import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart3,
  Users,
  Building2,
  Calendar,
  AlertTriangle,
  UserCheck,
  Download,
  TrendingUp,
  Home,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";

interface DashboardStats {
  users: {
    total: number;
    residents: number;
    guards: number;
    admins: number;
    withApartment: number;
    withoutApartment: number;
  };
  apartments: {
    total: number;
    occupied: number;
    forRent: number;
    forSale: number;
    occupancyRate: number;
  };
  bookings: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  complaints: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  visitors: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    currentlyInside: number;
  };
  notices: {
    active: number;
  };
}

interface VisitorReports {
  total: number;
  checkedOut: number;
  currentlyInside: number;
  avgDurationMinutes: number;
  byPurpose: { name: string; value: number }[];
  byTower: { name: string; value: number }[];
  byHour: { hour: number; count: number }[];
  byDayOfWeek: { day: string; count: number }[];
  trend: { date: string; count: number }[];
}

interface BookingReports {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  byAmenity: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  byMonth: { month: string; count: number }[];
  popularAmenities: { name: string; count: number }[];
}

interface ComplaintReports {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  resolutionRate: number;
  avgResolutionHours: number;
  byCategory: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
  trend: { date: string; count: number }[];
  aging: {
    lessThan24h: number;
    oneToThreeDays: number;
    threeToSevenDays: number;
    moreThanWeek: number;
  };
}

interface OccupancyReports {
  total: number;
  occupied: number;
  forRent: number;
  forSale: number;
  occupancyRate: number;
  avgResidentsPerApartment: string;
  byStatus: { name: string; value: number }[];
  byTower: { tower: string; occupied: number; forRent: number; forSale: number; total: number }[];
  byType: { name: string; value: number }[];
  forRentListings: { id: number; tower: string; number: string; floor: number; type: string; rent: string }[];
  forSaleListings: { id: number; tower: string; number: string; floor: number; type: string; price: string }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: dashboard, isLoading: isLoadingDashboard } = useQuery<DashboardStats>({
    queryKey: ["/api/reports/dashboard"],
  });

  const { data: visitorReports, isLoading: isLoadingVisitors } = useQuery<VisitorReports>({
    queryKey: ["/api/reports/visitors"],
    enabled: activeTab === "visitors",
  });

  const { data: bookingReports, isLoading: isLoadingBookings } = useQuery<BookingReports>({
    queryKey: ["/api/reports/bookings"],
    enabled: activeTab === "bookings",
  });

  const { data: complaintReports, isLoading: isLoadingComplaints } = useQuery<ComplaintReports>({
    queryKey: ["/api/reports/complaints"],
    enabled: activeTab === "complaints",
  });

  const { data: occupancyReports, isLoading: isLoadingOccupancy } = useQuery<OccupancyReports>({
    queryKey: ["/api/reports/occupancy"],
    enabled: activeTab === "occupancy",
  });

  const handleExport = (type: string) => {
    window.open(`/api/reports/export/${type}`, '_blank');
  };

  if (!user?.isAdmin) {
    return (
      <div className="container p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="container px-4 py-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <div>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Comprehensive insights into your society's operations
          </p>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="overview" className="text-[10px] md:text-sm px-1 md:px-3 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="visitors" className="text-[10px] md:text-sm px-1 md:px-3 py-1.5">Visitors</TabsTrigger>
          <TabsTrigger value="bookings" className="text-[10px] md:text-sm px-1 md:px-3 py-1.5">Bookings</TabsTrigger>
          <TabsTrigger value="complaints" className="text-[10px] md:text-sm px-1 md:px-3 py-1.5">Complaints</TabsTrigger>
          <TabsTrigger value="occupancy" className="text-[10px] md:text-sm px-1 md:px-3 py-1.5">Occupancy</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          {isLoadingDashboard ? (
            <div className="text-center py-8 text-muted-foreground">Loading dashboard...</div>
          ) : dashboard ? (
            <>
              {/* Key Metrics */}
              <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold">{dashboard.users.total}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Users</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                        <Building2 className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold">{dashboard.apartments.occupancyRate}%</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Occupancy</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-yellow-100 rounded-lg">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold">{dashboard.bookings.pending}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold">{dashboard.complaints.open}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Open</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Secondary Stats */}
              <motion.div variants={item} className="grid md:grid-cols-3 gap-3 md:gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Visitors Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{dashboard.visitors.today}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {dashboard.visitors.currentlyInside} currently inside
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>This Week</span>
                        <span className="font-medium">{dashboard.visitors.thisWeek}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>This Month</span>
                        <span className="font-medium">{dashboard.visitors.thisMonth}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Booking Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{dashboard.bookings.total}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total bookings</div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Pending
                        </span>
                        <span className="font-medium">{dashboard.bookings.pending}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Approved
                        </span>
                        <span className="font-medium">{dashboard.bookings.approved}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Rejected
                        </span>
                        <span className="font-medium">{dashboard.bookings.rejected}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Apartment Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{dashboard.apartments.total}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total apartments</div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Occupied
                        </span>
                        <span className="font-medium">{dashboard.apartments.occupied}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          For Rent
                        </span>
                        <span className="font-medium">{dashboard.apartments.forRent}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          For Sale
                        </span>
                        <span className="font-medium">{dashboard.apartments.forSale}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* User Breakdown */}
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>Breakdown of users by role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Residents', value: dashboard.users.residents },
                              { name: 'Guards', value: dashboard.users.guards },
                              { name: 'Admins', value: dashboard.users.admins },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {PIE_COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : null}
        </TabsContent>

        {/* Visitors Tab */}
        <TabsContent value="visitors" className="space-y-6">
          {isLoadingVisitors ? (
            <div className="text-center py-8 text-muted-foreground">Loading visitor reports...</div>
          ) : visitorReports ? (
            <>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleExport('visitors')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary">{visitorReports.total}</div>
                    <div className="text-sm text-muted-foreground">Total Visitors</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{visitorReports.checkedOut}</div>
                    <div className="text-sm text-muted-foreground">Checked Out</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-600">{visitorReports.currentlyInside}</div>
                    <div className="text-sm text-muted-foreground">Currently Inside</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{visitorReports.avgDurationMinutes} min</div>
                    <div className="text-sm text-muted-foreground">Avg Visit Duration</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Visitors by Purpose */}
                <Card>
                  <CardHeader>
                    <CardTitle>Visitors by Purpose</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={visitorReports.byPurpose}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {visitorReports.byPurpose.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Visitors by Tower */}
                <Card>
                  <CardHeader>
                    <CardTitle>Visitors by Tower</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visitorReports.byTower}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visitor Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Visitor Trend (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={visitorReports.trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Peak Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Peak Visiting Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={visitorReports.byHour}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="hour"
                          tickFormatter={(value) => `${value}:00`}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => `${value}:00 - ${value}:59`}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          {isLoadingBookings ? (
            <div className="text-center py-8 text-muted-foreground">Loading booking reports...</div>
          ) : bookingReports ? (
            <>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleExport('bookings')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary">{bookingReports.total}</div>
                    <div className="text-sm text-muted-foreground">Total Bookings</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-600">{bookingReports.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{bookingReports.approved}</div>
                    <div className="text-sm text-muted-foreground">Approved</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{bookingReports.approvalRate}%</div>
                    <div className="text-sm text-muted-foreground">Approval Rate</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Bookings by Amenity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Bookings by Amenity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bookingReports.byAmenity} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Popular Amenities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 5 Popular Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bookingReports.popularAmenities.map((amenity, index) => (
                        <div key={amenity.name} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{amenity.name}</div>
                            <div className="text-sm text-muted-foreground">{amenity.count} bookings</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Booking Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Trend (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bookingReports.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="space-y-6">
          {isLoadingComplaints ? (
            <div className="text-center py-8 text-muted-foreground">Loading complaint reports...</div>
          ) : complaintReports ? (
            <>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleExport('complaints')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary">{complaintReports.total}</div>
                    <div className="text-sm text-muted-foreground">Total Complaints</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{complaintReports.open + complaintReports.inProgress}</div>
                    <div className="text-sm text-muted-foreground">Pending Resolution</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{complaintReports.resolutionRate}%</div>
                    <div className="text-sm text-muted-foreground">Resolution Rate</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{complaintReports.avgResolutionHours}h</div>
                    <div className="text-sm text-muted-foreground">Avg Resolution Time</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Complaints by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Complaints by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={complaintReports.byCategory}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {complaintReports.byCategory.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Complaints by Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle>Complaints by Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={complaintReports.byPriority}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {complaintReports.byPriority.map((entry, index) => {
                              const colors: Record<string, string> = {
                                low: '#84cc16',
                                medium: '#f59e0b',
                                high: '#f97316',
                                urgent: '#ef4444',
                              };
                              return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#3b82f6'} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Complaint Aging */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Complaints Aging</CardTitle>
                  <CardDescription>How long open complaints have been pending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{complaintReports.aging.lessThan24h}</div>
                      <div className="text-sm text-muted-foreground">&lt; 24 hours</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{complaintReports.aging.oneToThreeDays}</div>
                      <div className="text-sm text-muted-foreground">1-3 days</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{complaintReports.aging.threeToSevenDays}</div>
                      <div className="text-sm text-muted-foreground">3-7 days</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{complaintReports.aging.moreThanWeek}</div>
                      <div className="text-sm text-muted-foreground">&gt; 1 week</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complaint Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Complaint Trend (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={complaintReports.trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Area type="monotone" dataKey="count" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Occupancy Tab */}
        <TabsContent value="occupancy" className="space-y-6">
          {isLoadingOccupancy ? (
            <div className="text-center py-8 text-muted-foreground">Loading occupancy reports...</div>
          ) : occupancyReports ? (
            <>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleExport('apartments')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary">{occupancyReports.total}</div>
                    <div className="text-sm text-muted-foreground">Total Apartments</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{occupancyReports.occupancyRate}%</div>
                    <div className="text-sm text-muted-foreground">Occupancy Rate</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{occupancyReports.forRent}</div>
                    <div className="text-sm text-muted-foreground">For Rent</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">{occupancyReports.forSale}</div>
                    <div className="text-sm text-muted-foreground">For Sale</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Apartments by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Apartments by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={occupancyReports.byStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#f59e0b" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Apartments by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Apartments by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={occupancyReports.byType}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tower-wise Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Tower-wise Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyReports.byTower}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tower" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="occupied" name="Occupied" fill="#10b981" stackId="a" />
                        <Bar dataKey="forRent" name="For Rent" fill="#3b82f6" stackId="a" />
                        <Bar dataKey="forSale" name="For Sale" fill="#f59e0b" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Listings */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* For Rent Listings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary">For Rent</Badge>
                      {occupancyReports.forRentListings.length} listings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {occupancyReports.forRentListings.length > 0 ? (
                      <div className="space-y-3">
                        {occupancyReports.forRentListings.slice(0, 5).map((listing) => (
                          <div key={listing.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <div className="font-medium">{listing.tower} - {listing.number}</div>
                              <div className="text-sm text-muted-foreground">{listing.type} | Floor {listing.floor}</div>
                            </div>
                            {listing.rent && (
                              <div className="text-green-600 font-medium">Rs. {listing.rent}/mo</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">No apartments for rent</div>
                    )}
                  </CardContent>
                </Card>

                {/* For Sale Listings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary">For Sale</Badge>
                      {occupancyReports.forSaleListings.length} listings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {occupancyReports.forSaleListings.length > 0 ? (
                      <div className="space-y-3">
                        {occupancyReports.forSaleListings.slice(0, 5).map((listing) => (
                          <div key={listing.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <div className="font-medium">{listing.tower} - {listing.number}</div>
                              <div className="text-sm text-muted-foreground">{listing.type} | Floor {listing.floor}</div>
                            </div>
                            {listing.price && (
                              <div className="text-orange-600 font-medium">Rs. {listing.price}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">No apartments for sale</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
