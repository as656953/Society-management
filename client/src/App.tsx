import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ApartmentDirectory from "@/pages/apartment-directory";
import Amenities from "@/pages/amenities";
import Users from "@/pages/users";
import Bookings from "@/pages/bookings";
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
      <ProtectedRoute path="/users" component={Users} isAdminOnly />
      <ProtectedRoute path="/bookings" component={Bookings} isAdminOnly />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main>
            <Router />
          </main>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
