import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, LogOut, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface Profile {
  subscription_tier: string;
  subscription_status: string;
}

export const AppHeader = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user: userData } } = await supabase.auth.getUser();
      setUser(userData);

      if (userData) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("subscription_tier, subscription_status")
          .eq("id", userData.id)
          .single();

        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const getSubscriptionBadge = () => {
    if (!profile) return null;
    
    const tier = profile.subscription_tier || "free";
    const isActive = profile.subscription_status === "active";

    if (tier === "free") {
      return (
        <Badge variant="secondary" className="text-xs">
          Free
        </Badge>
      );
    }

    if (tier === "pro") {
      return (
        <Badge variant="default" className="text-xs gap-1">
          <Crown className="w-3 h-3" />
          Pro
        </Badge>
      );
    }

    if (tier === "business") {
      return (
        <Badge variant="default" className="text-xs gap-1 bg-gradient-to-r from-purple-500 to-pink-500">
          <Crown className="w-3 h-3" />
          Business
        </Badge>
      );
    }

    return null;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>FixSense</span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <div className="flex items-center gap-2">
              {getSubscriptionBadge()}
            </div>
          </div>
          <div className="sm:hidden">
            {getSubscriptionBadge()}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            {t('common.signOut')}
          </Button>
        </div>
      </div>
    </header>
  );
};