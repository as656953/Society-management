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
  User,
  Shield,
  UserCheck,
  AlertCircle,
  BarChart3,
  ChevronDown,
  HardDrive,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "./NotificationBell";

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

  // Desktop Navigation Links (horizontal with dropdowns)
  const DesktopNavLinks = () => (
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
      {user.apartmentId && user.role !== "guard" && (
        <Link href="/visitors">
          <Button variant="ghost" size="sm" className="relative group">
            <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
            <UserCheck className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="relative font-heading font-medium">Visitors</span>
          </Button>
        </Link>
      )}
      {user.apartmentId && user.role !== "guard" && (
        <Link href="/complaints">
          <Button variant="ghost" size="sm" className="relative group">
            <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
            <AlertCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="relative font-heading font-medium">Complaints</span>
          </Button>
        </Link>
      )}
      {(user.role === "guard" || user.role === "admin" || user.isAdmin) && (
        <Link href="/guard-dashboard">
          <Button variant="ghost" size="sm" className="relative group">
            <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
            <Shield className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="relative font-heading font-medium">Security</span>
          </Button>
        </Link>
      )}
      {/* Admin Dropdown */}
      {user.isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative group">
              <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
              <Settings className="mr-2 h-4 w-4" />
              <span className="relative font-heading font-medium">Admin</span>
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Management</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/users">
              <DropdownMenuItem className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Users
              </DropdownMenuItem>
            </Link>
            <Link href="/manage-properties">
              <DropdownMenuItem className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                Properties
              </DropdownMenuItem>
            </Link>
            <Link href="/bookings">
              <DropdownMenuItem className="cursor-pointer">
                <Calendar className="mr-2 h-4 w-4" />
                Bookings
              </DropdownMenuItem>
            </Link>
            <Link href="/admin/complaints">
              <DropdownMenuItem className="cursor-pointer">
                <AlertCircle className="mr-2 h-4 w-4" />
                Complaints
              </DropdownMenuItem>
            </Link>
            <Link href="/manage-amenities">
              <DropdownMenuItem className="cursor-pointer">
                <CalendarDays className="mr-2 h-4 w-4" />
                Amenities
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <Link href="/reports">
              <DropdownMenuItem className="cursor-pointer">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reports
              </DropdownMenuItem>
            </Link>
            <Link href="/storage-management">
              <DropdownMenuItem className="cursor-pointer">
                <HardDrive className="mr-2 h-4 w-4" />
                Storage
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {/* User Menu Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative group">
            <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
            <User className="mr-2 h-4 w-4" />
            <span className="relative font-heading font-medium">Account</span>
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-red-500 focus:text-red-500"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  // Mobile Navigation Links (vertical with sections)
  const MobileNavLinks = () => (
    <>
      {/* Main Section */}
      <div className="px-2 py-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Main</p>
      </div>
      <Link href="/" onClick={() => setOpen(false)}>
        <Button variant="ghost" size="sm" className="w-full justify-start h-9">
          <Home className="mr-2 h-4 w-4" />
          <span className="text-sm">Dashboard</span>
        </Button>
      </Link>
      <Link href="/apartments" onClick={() => setOpen(false)}>
        <Button variant="ghost" size="sm" className="w-full justify-start h-9">
          <Building2 className="mr-2 h-4 w-4" />
          <span className="text-sm">Apartments</span>
        </Button>
      </Link>
      <Link href="/amenities" onClick={() => setOpen(false)}>
        <Button variant="ghost" size="sm" className="w-full justify-start h-9">
          <CalendarDays className="mr-2 h-4 w-4" />
          <span className="text-sm">Amenities</span>
        </Button>
      </Link>
      <Link href="/my-bookings" onClick={() => setOpen(false)}>
        <Button variant="ghost" size="sm" className="w-full justify-start h-9">
          <Calendar className="mr-2 h-4 w-4" />
          <span className="text-sm">My Bookings</span>
        </Button>
      </Link>

      {/* Resident Section */}
      {user.apartmentId && user.role !== "guard" && (
        <>
          <div className="px-2 py-1 mt-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Resident</p>
          </div>
          <Link href="/visitors" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <UserCheck className="mr-2 h-4 w-4" />
              <span className="text-sm">My Visitors</span>
            </Button>
          </Link>
          <Link href="/complaints" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span className="text-sm">Complaints</span>
            </Button>
          </Link>
        </>
      )}

      {/* Security Section */}
      {(user.role === "guard" || user.role === "admin" || user.isAdmin) && (
        <>
          <div className="px-2 py-1 mt-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Security</p>
          </div>
          <Link href="/guard-dashboard" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <Shield className="mr-2 h-4 w-4" />
              <span className="text-sm">Guard Dashboard</span>
            </Button>
          </Link>
        </>
      )}

      {/* Admin Section */}
      {user.isAdmin && (
        <>
          <div className="px-2 py-1 mt-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Admin</p>
          </div>
          <Link href="/users" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <Users className="mr-2 h-4 w-4" />
              <span className="text-sm">Users</span>
            </Button>
          </Link>
          <Link href="/manage-properties" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <Settings className="mr-2 h-4 w-4" />
              <span className="text-sm">Properties</span>
            </Button>
          </Link>
          <Link href="/bookings" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <Calendar className="mr-2 h-4 w-4" />
              <span className="text-sm">Bookings</span>
            </Button>
          </Link>
          <Link href="/admin/complaints" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span className="text-sm">Complaints</span>
            </Button>
          </Link>
          <Link href="/manage-amenities" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <CalendarDays className="mr-2 h-4 w-4" />
              <span className="text-sm">Amenities</span>
            </Button>
          </Link>
          <Link href="/reports" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span className="text-sm">Reports</span>
            </Button>
          </Link>
          <Link href="/storage-management" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9">
              <HardDrive className="mr-2 h-4 w-4" />
              <span className="text-sm">Storage</span>
            </Button>
          </Link>
        </>
      )}

      {/* Account Section */}
      <div className="px-2 py-1 mt-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Account</p>
      </div>
      <Link href="/profile" onClick={() => setOpen(false)}>
        <Button variant="ghost" size="sm" className="w-full justify-start h-9">
          <User className="mr-2 h-4 w-4" />
          <span className="text-sm">Profile</span>
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => {
          setOpen(false);
          handleLogout();
        }}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span className="text-sm">Logout</span>
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans font-medium tracking-wide">
              {user.profilePicture ? (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.profilePicture} alt={user.name} />
                  <AvatarFallback className="text-[10px]">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : null}
              <span>
                Welcome back,{" "}
                <span className="font-semibold text-primary/90">{user.name}</span>
              </span>
            </div>
          </div>
        </motion.div>
        <nav className="flex items-center gap-1">
          <NotificationBell />
          <DesktopNavLinks />
        </nav>
      </motion.header>

      {/* Mobile Navigation */}
      <header className="md:hidden flex items-center justify-between h-14 bg-background/95 backdrop-blur-md border-b px-3 fixed w-full top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <motion.div whileHover={{ rotate: 12 }} whileTap={{ scale: 0.9 }} className="flex-shrink-0">
            {user.profilePicture ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profilePicture} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Building2 className="h-5 w-5 text-primary" />
            )}
          </motion.div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-display font-bold text-sm tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
              Society Management
            </h1>
            <span className="text-[10px] text-muted-foreground font-sans font-medium tracking-wide truncate">
              Hi, <span className="font-semibold text-primary/90">{user.name.split(' ')[0]}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <NotificationBell />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative group">
                <span className="absolute inset-0 w-0 bg-primary/10 group-hover:w-full transition-all duration-300 rounded-md" />
                <Menu className="h-5 w-5 transition-transform group-hover:scale-110" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
              <div className="flex flex-col h-full">
                {/* Sheet Header */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </div>
                </div>
                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-2 px-2">
                  <div className="flex flex-col gap-0.5">
                    <MobileNavLinks />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
