import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Home,
  CalendarDays,
  LogOut,
  Menu,
  Users,
  Calendar,
  Settings,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out successfully",
        });
      },
    });
  };

  const NavLinks = () => (
    <>
      <Link href="/">
        <Button variant="ghost" size="sm">
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/apartments">
        <Button variant="ghost" size="sm">
          <Building2 className="mr-2 h-4 w-4" />
          Apartments
        </Button>
      </Link>
      <Link href="/amenities">
        <Button variant="ghost" size="sm">
          <CalendarDays className="mr-2 h-4 w-4" />
          Amenities
        </Button>
      </Link>
      <Link href="/my-bookings">
        <Button variant="ghost" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          My Bookings
        </Button>
      </Link>
      {user.isAdmin && (
        <>
          <Link href="/users">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>
          </Link>
          <Link href="/manage-properties">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Manage Properties
            </Button>
          </Link>
          <Link href="/bookings">
            <Button variant="ghost" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Manage Bookings
            </Button>
          </Link>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:flex items-center justify-between px-6 h-16 bg-background border-b">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <h1 className="font-bold text-lg">Society Management</h1>
        </div>
        <nav className="flex items-center gap-2">
          <NavLinks />
        </nav>
      </header>

      {/* Mobile Navigation */}
      <header className="md:hidden flex items-center justify-between h-16 bg-background border-b px-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <h1 className="font-bold">Society Management</h1>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col gap-2 mt-8">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Content Padding */}
      <div className="pt-16" />
    </>
  );
}
