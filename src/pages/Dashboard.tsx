import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, FileSearch, Home, LogOut, Upload, History, Building2, DollarSign, AlertTriangle, Calendar, Shield, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Diagnostic {
  id: string;
  diagnosis_summary: string;
  urgency: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  scam_alerts: string[] | null;
  created_at: string;
  appliances: { name: string } | null;
}

interface MaintenanceReminder {
  id: string;
  name: string;
  type: string;
  next_maintenance_date: string;
  property: { name: string };
}

interface Profile {
  subscription_tier: string;
  subscription_status: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentDiagnostics, setRecentDiagnostics] = useState<Diagnostic[]>([]);
  const [maintenanceReminders, setMaintenanceReminders] = useState<MaintenanceReminder[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalDiagnostics: 0,
    scamAlertsSaved: 0,
    estimatedSavings: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchDashboardData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch user profile for subscription info
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch recent diagnostics
      const { data: diagnosticsData, error: diagnosticsError } = await supabase
        .from("diagnostics")
        .select(`
          *,
          appliances (name)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (diagnosticsError) throw diagnosticsError;

      setRecentDiagnostics(diagnosticsData || []);

      // Calculate stats
      const totalDiagnostics = diagnosticsData?.length || 0;
      const diagnosticsWithScamAlerts = diagnosticsData?.filter(d => d.scam_alerts && d.scam_alerts.length > 0).length || 0;
      
      // Estimate savings: assume each scam alert saved $200 on average
      const estimatedSavings = diagnosticsWithScamAlerts * 200;

      setStats({
        totalDiagnostics,
        scamAlertsSaved: diagnosticsWithScamAlerts,
        estimatedSavings,
      });

      // Fetch maintenance reminders (appliances needing maintenance soon)
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: appliancesData, error: appliancesError } = await supabase
        .from("appliances")
        .select(`
          id,
          name,
          type,
          next_maintenance_date,
          properties!inner (
            name,
            user_id
          )
        `)
        .eq("properties.user_id", userId)
        .gte("next_maintenance_date", today)
        .lte("next_maintenance_date", thirtyDaysFromNow)
        .order("next_maintenance_date", { ascending: true })
        .limit(5);

      if (appliancesError) throw appliancesError;

      setMaintenanceReminders(appliancesData?.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        next_maintenance_date: a.next_maintenance_date,
        property: a.properties as any,
      })) || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
    const isPaid = isActive && tier !== "free";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent/10">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>FixSense</span>
          </Link>

          <div className="flex items-center gap-3">
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
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! What would you like to do today?</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate("/diagnose")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Diagnose a Problem</CardTitle>
                <CardDescription>Upload photos, videos, or audio to get instant AI diagnosis</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate("/history")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <History className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>View Past Reports</CardTitle>
                <CardDescription>Access your diagnostic history and saved reports</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate("/calendar")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Maintenance Calendar</CardTitle>
                <CardDescription>View and manage scheduled maintenance dates</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate("/properties")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Manage Properties</CardTitle>
                <CardDescription>Track appliances and property assets</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer" onClick={() => navigate("/settings?tab=billing")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Billing & Plans</CardTitle>
                <CardDescription>Manage subscription and payment methods</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Diagnostics</CardDescription>
                <CardTitle className="text-3xl">{stats.totalDiagnostics}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">All time diagnostics run</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Scam Alerts Triggered</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Shield className="w-6 h-6 text-destructive" />
                  {stats.scamAlertsSaved}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Protected from potential scams</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Estimated Savings</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2 text-primary">
                  <DollarSign className="w-6 h-6" />
                  {stats.estimatedSavings}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Money saved avoiding scams</p>
              </CardContent>
            </Card>
          </div>

          {maintenanceReminders.length > 0 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Maintenance Reminders
                </CardTitle>
                <CardDescription>Appliances needing service in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {maintenanceReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                    <div>
                      <p className="font-medium">{reminder.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {reminder.property.name} • {reminder.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(reminder.next_maintenance_date).toLocaleDateString()}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due Soon
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate("/properties")}>
                  View All Appliances
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Diagnostics</CardTitle>
                  <CardDescription>Your latest diagnostic reports</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentDiagnostics.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileSearch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No diagnostics yet. Start by diagnosing your first problem!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDiagnostics.map((diagnostic) => (
                    <div
                      key={diagnostic.id}
                      className="flex items-center justify-between p-3 bg-accent/30 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/result/${diagnostic.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">
                          {diagnostic.appliances?.name || "General Diagnostic"}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {diagnostic.diagnosis_summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge
                          variant={diagnostic.urgency === "critical" || diagnostic.urgency === "warning" ? "destructive" : "default"}
                        >
                          {diagnostic.urgency}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(diagnostic.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;