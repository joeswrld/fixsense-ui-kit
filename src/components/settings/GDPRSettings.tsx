import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Download, Trash2, Loader2, Shield, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const GDPRSettings = () => {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch all user data
      const [profileRes, propertiesRes, appliancesRes, diagnosticsRes, maintenanceRes, warrantiesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("properties").select("*").eq("user_id", user.id),
        supabase.from("appliances").select("*, properties!inner(user_id)").eq("properties.user_id", user.id),
        supabase.from("diagnostics").select("*").eq("user_id", user.id),
        supabase.from("maintenance_history").select("*").eq("user_id", user.id),
        supabase.from("warranties").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profileRes.data,
        properties: propertiesRes.data,
        appliances: appliancesRes.data,
        diagnostics: diagnosticsRes.data,
        maintenanceHistory: maintenanceRes.data,
        warranties: warrantiesRes.data,
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fixsense-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete user data in order (respecting foreign keys)
      await supabase.from("usage_tracking").delete().eq("user_id", user.id);
      await supabase.from("notification_logs").delete().eq("user_id", user.id);
      await supabase.from("vendor_ratings").delete().eq("user_id", user.id);
      await supabase.from("vendor_bookings").delete().eq("user_id", user.id);
      await supabase.from("vendors").delete().eq("user_id", user.id);
      await supabase.from("warranties").delete().eq("user_id", user.id);
      await supabase.from("maintenance_history").delete().eq("user_id", user.id);
      await supabase.from("diagnostics").delete().eq("user_id", user.id);
      
      // Get properties to delete appliances
      const { data: properties } = await supabase
        .from("properties")
        .select("id")
        .eq("user_id", user.id);
      
      if (properties && properties.length > 0) {
        const propertyIds = properties.map(p => p.id);
        await supabase.from("predictive_alerts").delete().in("appliance_id", 
          (await supabase.from("appliances").select("id").in("property_id", propertyIds)).data?.map(a => a.id) || []
        );
        await supabase.from("appliances").delete().in("property_id", propertyIds);
      }
      
      await supabase.from("properties").delete().eq("user_id", user.id);
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      
      // Anonymize profile instead of deleting (for audit trail)
      await supabase.from("profiles").update({
        full_name: "Deleted User",
        email: `deleted-${user.id}@anonymized.local`,
        phone: null,
        country: null,
        currency: null,
      }).eq("id", user.id);

      // Sign out
      await supabase.auth.signOut();

      toast({
        title: "Account deleted",
        description: "Your account and data have been deleted.",
      });

      navigate("/");
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete your account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Data Privacy & GDPR
          </CardTitle>
          <CardDescription>
            Manage your personal data in compliance with GDPR regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Export Your Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download a copy of all your personal data stored in FixSense, including your profile, 
                properties, appliances, diagnostics, and maintenance history.
              </p>
              <Button onClick={handleExportData} disabled={exporting} variant="outline">
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export My Data
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium mb-2 text-destructive">Delete Account</h3>
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action is permanent and cannot be undone. All your data will be deleted, 
                  including properties, appliances, diagnostics, and maintenance records.
                </AlertDescription>
              </Alert>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete My Account
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account 
                      and remove all your data from our servers, including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Your profile information</li>
                        <li>All properties and appliances</li>
                        <li>All diagnostic reports</li>
                        <li>All maintenance history</li>
                        <li>All warranty documents</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Rights Under GDPR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p><strong>Right to Access:</strong> You can export all your data at any time.</p>
          <p><strong>Right to Rectification:</strong> You can update your profile information in Settings.</p>
          <p><strong>Right to Erasure:</strong> You can delete your account and all associated data.</p>
          <p><strong>Right to Data Portability:</strong> Your exported data is in a machine-readable JSON format.</p>
          <p>
            For any data privacy concerns, contact us at{" "}
            <a href="mailto:privacy@fixsense.com" className="text-primary hover:underline">
              privacy@fixsense.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
