import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ApartmentDirectory from "@/pages/apartment-directory";
import Amenities from "@/pages/amenities";
import Users from "@/pages/users";
import Bookings from "@/pages/bookings";
import MyBookings from "@/pages/my-bookings";
import ManageProperties from "@/pages/manage-properties";
import GuardDashboard from "@/pages/guard-dashboard";
import Visitors from "@/pages/visitors";
import Complaints from "@/pages/complaints";
import AdminComplaints from "@/pages/admin-complaints";
import Profile from "@/pages/profile";
import ManageAmenities from "@/pages/manage-amenities";
import Reports from "@/pages/reports";
import StorageManagement from "@/pages/storage-management";
import { ProtectedRoute } from "./lib/protected-route";
import Navigation from "@/components/navigation";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute path="/" component={Dashboard} />
      </Route>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/apartments" component={ApartmentDirectory} />
      <ProtectedRoute path="/amenities" component={Amenities} />
      <ProtectedRoute path="/my-bookings" component={MyBookings} />
      <ProtectedRoute path="/users" component={Users} isAdminOnly />
      <ProtectedRoute
        path="/manage-properties"
        component={ManageProperties}
        isAdminOnly
      />
      <ProtectedRoute path="/bookings" component={Bookings} isAdminOnly />
      <ProtectedRoute path="/guard-dashboard" component={GuardDashboard} />
      <ProtectedRoute path="/visitors" component={Visitors} />
      <ProtectedRoute path="/complaints" component={Complaints} />
      <ProtectedRoute path="/admin/complaints" component={AdminComplaints} isAdminOnly />
      <ProtectedRoute path="/manage-amenities" component={ManageAmenities} isAdminOnly />
      <ProtectedRoute path="/reports" component={Reports} isAdminOnly />
      <ProtectedRoute path="/storage-management" component={StorageManagement} isAdminOnly />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className={user ? "pt-14 md:pt-16" : ""}>
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
