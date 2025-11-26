import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, ArrowLeft, FileText, AlertTriangle, CheckCircle2, DollarSign, Loader2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { exportDiagnosticToPDF } from "@/lib/pdfExport";
import { useToast } from "@/hooks/use-toast";

import { AppHeader } from "@/components/AppHeader";

interface Diagnostic {
  id: string;
  diagnosis_summary: string;
  probable_causes: string[];
  estimated_cost_min: number;
  estimated_cost_max: number;
  urgency: string;
  scam_alerts: string[];
  fix_instructions: string;
  created_at: string;
}

const Result = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDiagnostic();
  }, [id]);

  const fetchDiagnostic = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("diagnostics")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setDiagnostic(data);
    } catch (error) {
      console.error("Error fetching diagnostic:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-accent/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!diagnostic) {
    return null;
  }

  const handleExportPDF = async () => {
    if (!diagnostic) return;
    
    setExporting(true);
    try {
      exportDiagnosticToPDF(diagnostic);
      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const urgencyConfig = {
    critical: { label: "Critical - Immediate attention needed", variant: "destructive" as const },
    warning: { label: "Warning - Needs attention within 1-2 weeks", variant: "destructive" as const },
    safe: { label: "Safe - Monitor for changes", variant: "default" as const },
  };

  const urgency = urgencyConfig[diagnostic.urgency as keyof typeof urgencyConfig] || urgencyConfig.safe;

  return (
    <div className="min-h-screen bg-accent/10">
      <AppHeader />

      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Diagnostic Result</h1>
              <p className="text-muted-foreground">
                Analysis completed on {new Date(diagnostic.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {diagnostic.urgency !== "safe" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span><strong>Urgency:</strong> {urgency.label}</span>
                  <Badge variant={urgency.variant}>{diagnostic.urgency.toUpperCase()}</Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Diagnosis Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">{diagnostic.diagnosis_summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Probable Causes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {diagnostic.probable_causes.map((cause, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Estimated Repair Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-4">
              ₦{diagnostic.estimated_cost_min} - ${diagnostic.estimated_cost_max}
              </div>
              <p className="text-sm text-muted-foreground">
                Prices may vary by location and technician. Always get multiple quotes.
              </p>
            </CardContent>
          </Card>

          {diagnostic.scam_alerts && diagnostic.scam_alerts.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Scam Protection Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {diagnostic.scam_alerts.map((alert, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-destructive">⚠️</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Repair Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-line">{diagnostic.fix_instructions}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            <Button onClick={() => navigate("/diagnose")}>
              Run Another Diagnostic
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Result;
