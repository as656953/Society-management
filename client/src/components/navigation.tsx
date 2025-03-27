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
import { motion } from "framer-motion";

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
        <Button variant="ghost" size="sm" className="relative group">
          <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
          <Home className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="relative font-heading font-medium">Dashboard</span>
        </Button>
      </Link>
      <Link href="/apartments">
        <Button variant="ghost" size="sm" className="relative group">
          <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
          <Building2 className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="relative font-heading font-medium">Apartments</span>
        </Button>
      </Link>
      <Link href="/amenities">
        <Button variant="ghost" size="sm" className="relative group">
          <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
          <CalendarDays className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="relative font-heading font-medium">Amenities</span>
        </Button>
      </Link>
      <Link href="/my-bookings">
        <Button variant="ghost" size="sm" className="relative group">
          <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
          <Calendar className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="relative font-heading font-medium">My Bookings</span>
        </Button>
      </Link>
      {user.isAdmin && (
        <>
          <Link href="/users">
            <Button
              variant="ghost"
              className="w-full justify-start relative group"
            >
              <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
              <Users className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="relative font-heading font-medium">Users</span>
            </Button>
          </Link>
          <Link href="/manage-properties">
            <Button
              variant="ghost"
              className="w-full justify-start relative group"
            >
              <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
              <Settings className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
              <span className="relative font-heading font-medium">
                Manage Properties
              </span>
            </Button>
          </Link>
          <Link href="/bookings">
            <Button
              variant="ghost"
              className="w-full justify-start relative group"
            >
              <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
              <Calendar className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="relative font-heading font-medium">
                Manage Bookings
              </span>
            </Button>
          </Link>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-600 hover:bg-red-50 relative group"
        onClick={handleLogout}
      >
        <span className="absolute inset-0 w-0 bg-red-50 group-hover:w-full transition-all duration-300 rounded-md" />
        <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span className="relative font-heading font-medium">Logout</span>
      </Button>
    </>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="hidden md:flex items-center justify-between px-6 h-16 bg-background border-b backdrop-blur-sm bg-background/80 fixed w-full top-0 z-50"
      >
        <motion.div
          className="flex items-center gap-3 group cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Building2 className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Society Management
            </h1>
            <span className="text-xs text-muted-foreground font-sans font-medium tracking-wide">
              Welcome back,{" "}
              <span className="font-semibold text-primary/90">{user.name}</span>
            </span>
          </div>
        </motion.div>
        <nav className="flex items-center gap-2">
          <NavLinks />
        </nav>
      </motion.header>

      {/* Mobile Navigation */}
      <header className="md:hidden flex items-center justify-between h-16 bg-background/80 backdrop-blur-sm border-b px-4 fixed w-full top-0 z-50">
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ rotate: 12 }} whileTap={{ scale: 0.9 }}>
            <Building2 className="h-6 w-6 text-primary" />
          </motion.div>
          <div className="flex flex-col">
            <h1 className="font-display font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Society Management
            </h1>
            <span className="text-xs text-muted-foreground font-sans font-medium tracking-wide">
              Welcome back,{" "}
              <span className="font-semibold text-primary/90">{user.name}</span>
            </span>
          </div>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group">
              <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
              <Menu className="h-5 w-5 transition-transform group-hover:scale-110" />
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
