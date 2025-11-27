import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, ArrowLeft, FileText, AlertTriangle, CheckCircle2, DollarSign, Loader2, Download, PlayCircle, Info, MapPin, TrendingUp } from "lucide-react";
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

// ============================================================
// COUNTRY-NATIVE PRICING CONFIGURATION
// ============================================================

const REPAIR_COMPLEXITY = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  MAJOR: 'major'
} as const;

type RepairComplexity = typeof REPAIR_COMPLEXITY[keyof typeof REPAIR_COMPLEXITY];

interface CountryPricing {
  currency: string;
  symbol: string;
  name: string;
  prices: {
    minor: { min: number; max: number };
    moderate: { min: number; max: number };
    major: { min: number; max: number };
  };
}

// Country-native pricing: Real local market rates in local currencies
const COUNTRY_NATIVE_PRICING: Record<string, CountryPricing> = {
  // West Africa
  NG: {
    currency: 'NGN',
    symbol: '₦',
    name: 'Nigeria',
    prices: {
      minor: { min: 5000, max: 15000 },
      moderate: { min: 18000, max: 45000 },
      major: { min: 60000, max: 150000 }
    }
  },
  GH: {
    currency: 'GHS',
    symbol: '₵',
    name: 'Ghana',
    prices: {
      minor: { min: 120, max: 300 },
      moderate: { min: 350, max: 900 },
      major: { min: 1200, max: 3000 }
    }
  },
  
  // East Africa
  KE: {
    currency: 'KES',
    symbol: 'KSh',
    name: 'Kenya',
    prices: {
      minor: { min: 2000, max: 6000 },
      moderate: { min: 7000, max: 18000 },
      major: { min: 25000, max: 60000 }
    }
  },
  TZ: {
    currency: 'TZS',
    symbol: 'TSh',
    name: 'Tanzania',
    prices: {
      minor: { min: 50000, max: 150000 },
      moderate: { min: 180000, max: 450000 },
      major: { min: 600000, max: 1500000 }
    }
  },
  UG: {
    currency: 'UGX',
    symbol: 'USh',
    name: 'Uganda',
    prices: {
      minor: { min: 80000, max: 200000 },
      moderate: { min: 250000, max: 600000 },
      major: { min: 800000, max: 2000000 }
    }
  },
  
  // Southern Africa
  ZA: {
    currency: 'ZAR',
    symbol: 'R',
    name: 'South Africa',
    prices: {
      minor: { min: 350, max: 800 },
      moderate: { min: 1000, max: 2500 },
      major: { min: 3500, max: 8000 }
    }
  },
  
  // North America
  US: {
    currency: 'USD',
    symbol: '$',
    name: 'United States',
    prices: {
      minor: { min: 90, max: 180 },
      moderate: { min: 250, max: 600 },
      major: { min: 700, max: 1500 }
    }
  },
  CA: {
    currency: 'CAD',
    symbol: 'C$',
    name: 'Canada',
    prices: {
      minor: { min: 110, max: 220 },
      moderate: { min: 300, max: 750 },
      major: { min: 900, max: 1900 }
    }
  },
  
  // Europe
  GB: {
    currency: 'GBP',
    symbol: '£',
    name: 'United Kingdom',
    prices: {
      minor: { min: 60, max: 120 },
      moderate: { min: 150, max: 350 },
      major: { min: 400, max: 900 }
    }
  },
  DE: {
    currency: 'EUR',
    symbol: '€',
    name: 'Germany',
    prices: {
      minor: { min: 70, max: 140 },
      moderate: { min: 180, max: 420 },
      major: { min: 500, max: 1100 }
    }
  },
  FR: {
    currency: 'EUR',
    symbol: '€',
    name: 'France',
    prices: {
      minor: { min: 70, max: 140 },
      moderate: { min: 180, max: 420 },
      major: { min: 500, max: 1100 }
    }
  },
  IT: {
    currency: 'EUR',
    symbol: '€',
    name: 'Italy',
    prices: {
      minor: { min: 65, max: 130 },
      moderate: { min: 170, max: 400 },
      major: { min: 480, max: 1000 }
    }
  },
  ES: {
    currency: 'EUR',
    symbol: '€',
    name: 'Spain',
    prices: {
      minor: { min: 60, max: 120 },
      moderate: { min: 160, max: 380 },
      major: { min: 450, max: 950 }
    }
  },
  
  // Asia
  IN: {
    currency: 'INR',
    symbol: '₹',
    name: 'India',
    prices: {
      minor: { min: 500, max: 1500 },
      moderate: { min: 2000, max: 5000 },
      major: { min: 7000, max: 15000 }
    }
  },
  PK: {
    currency: 'PKR',
    symbol: 'Rs',
    name: 'Pakistan',
    prices: {
      minor: { min: 2000, max: 5000 },
      moderate: { min: 6000, max: 15000 },
      major: { min: 20000, max: 45000 }
    }
  },
  BD: {
    currency: 'BDT',
    symbol: '৳',
    name: 'Bangladesh',
    prices: {
      minor: { min: 800, max: 2000 },
      moderate: { min: 2500, max: 6000 },
      major: { min: 8000, max: 18000 }
    }
  }
};

// Regional fallback pricing (when specific country not found)
const REGIONAL_FALLBACKS: Record<string, CountryPricing> = {
  'west-africa': {
    currency: 'USD',
    symbol: '$',
    name: 'West Africa (Regional Average)',
    prices: {
      minor: { min: 8, max: 25 },
      moderate: { min: 30, max: 75 },
      major: { min: 100, max: 250 }
    }
  },
  'east-africa': {
    currency: 'USD',
    symbol: '$',
    name: 'East Africa (Regional Average)',
    prices: {
      minor: { min: 12, max: 35 },
      moderate: { min: 40, max: 100 },
      major: { min: 140, max: 350 }
    }
  },
  'europe': {
    currency: 'EUR',
    symbol: '€',
    name: 'Europe (Regional Average)',
    prices: {
      minor: { min: 65, max: 130 },
      moderate: { min: 170, max: 400 },
      major: { min: 480, max: 1000 }
    }
  },
  'global': {
    currency: 'USD',
    symbol: '$',
    name: 'Global Average',
    prices: {
      minor: { min: 50, max: 100 },
      moderate: { min: 120, max: 300 },
      major: { min: 400, max: 900 }
    }
  }
};

// ============================================================
// PRICING UTILITIES
// ============================================================

const getCountryPricing = (countryCode: string): { pricing: CountryPricing; isRegional: boolean } => {
  // Direct country match
  if (COUNTRY_NATIVE_PRICING[countryCode]) {
    return { pricing: COUNTRY_NATIVE_PRICING[countryCode], isRegional: false };
  }
  
  // Regional fallbacks based on country code patterns
  const westAfricaCodes = ['BJ', 'BF', 'CI', 'GM', 'GW', 'LR', 'ML', 'NE', 'SN', 'SL', 'TG'];
  const eastAfricaCodes = ['ET', 'RW', 'SO', 'SS', 'SD'];
  const europeCodes = ['AT', 'BE', 'DK', 'FI', 'GR', 'IE', 'NL', 'NO', 'PL', 'PT', 'SE', 'CH'];
  
  if (westAfricaCodes.includes(countryCode)) {
    return { pricing: REGIONAL_FALLBACKS['west-africa'], isRegional: true };
  }
  if (eastAfricaCodes.includes(countryCode)) {
    return { pricing: REGIONAL_FALLBACKS['east-africa'], isRegional: true };
  }
  if (europeCodes.includes(countryCode)) {
    return { pricing: REGIONAL_FALLBACKS['europe'], isRegional: true };
  }
  
  // Global fallback
  return { pricing: REGIONAL_FALLBACKS['global'], isRegional: true };
};

const roundToMarketPrice = (value: number, currency: string): number => {
  // High-value currencies: round to nearest 5 or 10
  if (['USD', 'EUR', 'GBP', 'CAD'].includes(currency)) {
    if (value < 100) return Math.round(value / 5) * 5;
    return Math.round(value / 10) * 10;
  }
  
  // Medium-value currencies: round to nearest 50
  if (['ZAR'].includes(currency)) {
    return Math.round(value / 50) * 50;
  }
  
  // Lower-value currencies: round to nearest 100, 1000, etc
  if (value > 100000) return Math.round(value / 10000) * 10000;
  if (value > 10000) return Math.round(value / 1000) * 1000;
  if (value > 1000) return Math.round(value / 100) * 100;
  return Math.round(value / 50) * 50;
};

const formatCurrency = (value: number, currency: string): string => {
  if (['USD', 'GBP', 'CAD'].includes(currency)) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (['EUR'].includes(currency)) {
    return value.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const calculateRepairCost = (complexity: RepairComplexity, countryCode: string) => {
  const { pricing, isRegional } = getCountryPricing(countryCode);
  const priceRange = pricing.prices[complexity];
  
  return {
    min: roundToMarketPrice(priceRange.min, pricing.currency),
    max: roundToMarketPrice(priceRange.max, pricing.currency),
    currency: pricing.currency,
    symbol: pricing.symbol,
    countryName: pricing.name,
    isRegionalFallback: isRegional
  };
};

const determineComplexity = (diagnostic: Diagnostic): RepairComplexity => {
  const summary = (diagnostic.diagnosis_summary || '').toLowerCase();
  const causes = (diagnostic.probable_causes || []).join(' ').toLowerCase();
  const instructions = (diagnostic.fix_instructions || '').toLowerCase();
  
  const allText = `${summary} ${causes} ${instructions}`;
  
  const minorKeywords = ['clean', 'reset', 'loose', 'tighten', 'adjust', 'reconnect', 'cable', 'filter', 'dust'];
  const majorKeywords = ['replace', 'component', 'motor', 'compressor', 'circuit', 'board', 'electrical', 'mechanical', 'wiring'];
  
  const minorCount = minorKeywords.filter(kw => allText.includes(kw)).length;
  const majorCount = majorKeywords.filter(kw => allText.includes(kw)).length;
  
  if (majorCount >= 2) return REPAIR_COMPLEXITY.MAJOR;
  if (minorCount >= 2 && majorCount === 0) return REPAIR_COMPLEXITY.MINOR;
  return REPAIR_COMPLEXITY.MODERATE;
};

// ============================================================
// REPAIR COST COMPONENT
// ============================================================

const RepairCostEstimate = ({ diagnostic, userCountry }: { diagnostic: Diagnostic; userCountry: string }) => {
  const complexity = determineComplexity(diagnostic);
  const costData = calculateRepairCost(complexity, userCountry);

  const complexityLabels = {
    minor: { label: 'Minor Repair', color: 'text-green-600', bg: 'bg-green-50' },
    moderate: { label: 'Moderate Repair', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    major: { label: 'Major Repair', color: 'text-red-600', bg: 'bg-red-50' }
  };

  const complexityInfo = complexityLabels[complexity];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Estimated Repair Cost
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{costData.countryName}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Complexity Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${complexityInfo.bg}`}>
          <TrendingUp className={`w-4 h-4 ${complexityInfo.color}`} />
          <span className={`text-sm font-medium ${complexityInfo.color}`}>
            {complexityInfo.label}
          </span>
        </div>

        {/* Cost Range */}
        <div className="text-3xl font-bold text-primary mb-4">
          {costData.symbol}{formatCurrency(costData.min, costData.currency)} - {costData.symbol}{formatCurrency(costData.max, costData.currency)}
        </div>
        
        <p className="text-sm text-muted-foreground">
          Based on average technician pricing in {costData.countryName}
        </p>

        {/* Regional fallback warning */}
        {costData.isRegionalFallback && (
          <Alert className="border-blue-500 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Showing regional average pricing. Local rates may vary.
            </AlertDescription>
          </Alert>
        )}

        {/* Transparency Note */}
        <Alert className="border-blue-500 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 space-y-2">
            <p className="font-medium">💡 Pricing considerations:</p>
            <ul className="text-sm space-y-1 ml-4 list-disc">
              <li>Repair complexity: {complexityInfo.label}</li>
              <li>Typical local technician rates</li>
              <li>Parts availability in your area</li>
            </ul>
            <p className="text-xs mt-2 border-t border-blue-200 pt-2">
              Actual costs may vary by technician and location. Always get multiple quotes before proceeding.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// ============================================================
// MAIN RESULT COMPONENT
// ============================================================

const Result = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [userCountry, setUserCountry] = useState<string>('NG');

  useEffect(() => {
    fetchDiagnostic();
    fetchUserCountry();
  }, [id]);

  const fetchUserCountry = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("country")
        .eq("id", user.id)
        .single();

      if (profile?.country) {
        setUserCountry(profile.country);
      }
    } catch (error) {
      console.error("Error fetching user country:", error);
    }
  };

  const fetchDiagnostic = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
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
      const applianceType = diagnosticData.appliances?.type || "appliance";
      const mainCause = diagnosticData.probable_causes[0] || "repair";
      
      const searchQuery = `how to fix ${applianceType} ${mainCause} repair tutorial`;
      
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      
      if (!API_KEY) {
        console.log("YouTube API key not configured");
        return;
      }
      
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=3&key=${API_KEY}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch YouTube videos");
      }

      const data = await response.json();
      
      const videos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        duration: ""
      }));

      setYoutubeVideos(videos);
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
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

          {/* Country-Native Repair Cost */}
          <RepairCostEstimate diagnostic={diagnostic} userCountry={userCountry} />

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