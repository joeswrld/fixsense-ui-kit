import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, ArrowLeft, Download, FileText, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const ResultDemo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-accent/10">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>FixSense</span>
          </Link>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate("/diagnose")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Diagnostic Result</h1>
              <p className="text-muted-foreground">Analysis completed successfully</p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span><strong>Urgency:</strong> Needs attention within 1-2 weeks</span>
                <Badge variant="destructive">Warning</Badge>
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Diagnosis Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">
                Based on the analysis, your air conditioning unit appears to have a <strong>refrigerant leak</strong> combined with a <strong>faulty compressor bearing</strong>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Probable Causes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Refrigerant line corrosion due to age (7-10 years typical lifespan)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Worn compressor bearing causing grinding noise</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Insufficient cooling performance indicates low refrigerant levels</span>
                </li>
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
              <div className="text-3xl font-bold text-primary mb-4">$450 - $850</div>
              <p className="text-sm text-muted-foreground">
                This includes refrigerant recharge, leak repair, and compressor bearing replacement. Prices may vary by location and technician.
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Scam Protection Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">⚠️</span>
                  <span>Avoid technicians who insist on full system replacement without proper diagnosis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">⚠️</span>
                  <span>Request itemized quotes - refrigerant recharge alone should not exceed $200</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">⚠️</span>
                  <span>Red flag: "Your whole system needs replacing" - get a second opinion</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Fix Instructions</CardTitle>
              <CardDescription>For professional technicians or experienced DIYers</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Turn off power to the AC unit at the breaker</li>
                <li>Use leak detector to identify exact location of refrigerant leak</li>
                <li>Repair or replace damaged refrigerant line section</li>
                <li>Vacuum the system to remove moisture and air</li>
                <li>Recharge system with correct refrigerant type and amount</li>
                <li>Inspect compressor bearing - replace if grinding persists</li>
                <li>Test system operation and monitor for 30 minutes</li>
              </ol>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button className="flex-1" onClick={() => navigate("/diagnose")}>
              Run Another Diagnostic
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultDemo;