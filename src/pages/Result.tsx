import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, ArrowLeft, FileText, AlertTriangle, CheckCircle2, DollarSign, Loader2, Download, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { exportDiagnosticToPDF } from "@/lib/pdfExport";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";
import { formatPriceRange } from "@/lib/currencyUtils";

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
  appliances?: {
    name: string;
    type: string;
  } | null;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
}

const Result = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [userCurrency, setUserCurrency] = useState<string>("NGN");

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

      // Fetch user's currency preference
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.id)
        .single();

      if (!profileError && profileData?.currency) {
        setUserCurrency(profileData.currency);
      }

      const { data, error } = await supabase
        .from("diagnostics")
        .select(`
          *,
          appliances (name, type)
        `)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setDiagnostic(data);
      
      // Fetch YouTube videos based on the diagnosis
      if (data) {
        fetchYouTubeVideos(data);
      }
    } catch (error) {
      console.error("Error fetching diagnostic:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchYouTubeVideos = async (diagnosticData: Diagnostic) => {
    setLoadingVideos(true);
    try {
      // Create a search query based on the diagnostic data
      const applianceType = diagnosticData.appliances?.type || "appliance";
      const mainCause = diagnosticData.probable_causes[0] || "repair";
      
      // Build search query
      const searchQuery = `how to fix ${applianceType} ${mainCause} repair tutorial`;
      
      // YouTube API endpoint (you'll need to add your API key)
      const API_KEY = "YOUR_YOUTUBE_API_KEY"; // Store this in environment variables
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=3&key=${API_KEY}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch YouTube videos");
      }

      const data = await response.json();
      
      // Transform the response to our format
      const videos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        duration: "" // We'll keep this empty or you can fetch it with an additional API call
      }));

      setYoutubeVideos(videos);
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      // Fail silently - the page will still work without videos
    } finally {
      setLoadingVideos(false);
    }
  };

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

          {/* YouTube Video Recommendations */}
          {youtubeVideos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-red-600" />
                  Recommended Repair Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingVideos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Finding helpful videos...</span>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {youtubeVideos.map((video) => (
                      <a
                        key={video.id}
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-lg overflow-hidden border hover:border-primary transition-all hover:shadow-lg"
                      >
                        <div className="relative aspect-video">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <PlayCircle className="w-12 h-12 text-white/90" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {video.channelTitle}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  💡 Watch these tutorials to learn how to fix the issue yourself
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Estimated Repair Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-4">
                {diagnostic.estimated_cost_min && diagnostic.estimated_cost_max
                  ? formatPriceRange(
                      diagnostic.estimated_cost_min,
                      diagnostic.estimated_cost_max,
                      userCurrency
                    )
                  : "Estimate unavailable"}
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