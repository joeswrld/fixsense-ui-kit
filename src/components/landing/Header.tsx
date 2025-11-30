import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Wrench, Settings, LogOut, User, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  full_name: string | null;
  email: string | null;
}

export const Header = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
    };

    getInitialUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      setMobileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getFirstName = (fullName: string | null | undefined): string => {
    if (!fullName) return "User";
    return fullName.trim().split(" ")[0];
  };

  const handleNavigation = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>FixSense</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/features" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link 
            to="/pricing" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url} 
                      alt={profile?.full_name || user.email || "User"} 
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile?.full_name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getFirstName(profile?.full_name || user.email)}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container px-4 py-4 space-y-3">
            <Link
              to="/features"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            
            <div className="pt-3 border-t space-y-2">
              {user ? (
                <>
                  <div className="py-2">
                    <p className="text-sm font-medium">{getFirstName(profile?.full_name || user.email)}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigation("/dashboard")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigation("/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => handleNavigation("/auth")}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleNavigation("/auth")}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};