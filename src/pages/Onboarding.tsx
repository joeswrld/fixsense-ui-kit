import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wrench, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Country to currency mapping
const CURRENCY_MAP: Record<string, string> = {
  NG: "NGN", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD",
  ZA: "ZAR", KE: "KES", GH: "GHS", TZ: "TZS", UG: "UGX", RW: "RWF",
  IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR",
  AE: "AED", SA: "SAR", EG: "EGP", MA: "MAD", DZ: "DZD",
  JP: "JPY", CN: "CNY", KR: "KRW", SG: "SGD", MY: "MYR",
  EU: "EUR", // Eurozone countries
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", PT: "EUR", IE: "EUR", GR: "EUR",
  FI: "EUR", LU: "EUR", SI: "EUR", CY: "EUR", MT: "EUR",
  SK: "EUR", EE: "EUR", LV: "EUR", LT: "EUR",
  BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP", CO: "COP",
};

const COUNTRIES = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234" },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", dialCode: "+64" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dialCode: "+233" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52" },
].sort((a, b) => a.name.localeCompare(b.name));

const CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
].sort((a, b) => a.name.localeCompare(b.name));

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if onboarding is already completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, full_name, phone, country, currency")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        navigate("/dashboard");
        return;
      }

      // Pre-fill name from auth metadata or profile
      const name = user.user_metadata?.full_name || profile?.full_name || "";
      setFullName(name);

      // Auto-detect country via IP
      await detectCountry();
      
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      toast({
        title: "Error",
        description: "Failed to load onboarding data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const detectCountry = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      
      if (data.country_code) {
        const countryCode = data.country_code;
        setCountry(countryCode);
        
        // Auto-map currency
        const detectedCurrency = CURRENCY_MAP[countryCode] || "USD";
        setCurrency(detectedCurrency);
      } else {
        // Default to Nigeria if detection fails
        setCountry("NG");
        setCurrency("NGN");
      }
    } catch (error) {
      console.error("Error detecting country:", error);
      // Default to Nigeria
      setCountry("NG");
      setCurrency("NGN");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!country) {
      newErrors.country = "Please select a country";
    }

    if (!currency) {
      newErrors.currency = "Please select a currency";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCountryChange = (countryCode: string) => {
    setCountry(countryCode);
    // Auto-update currency when country changes
    const newCurrency = CURRENCY_MAP[countryCode] || currency || "USD";
    setCurrency(newCurrency);
    setErrors({ ...errors, country: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Update profile with onboarding data
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          country,
          currency,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Track analytics event
      try {
        // You can integrate with your analytics provider here
        console.log("Analytics: onboarding_completed", {
          country,
          currency,
          timestamp: new Date().toISOString(),
        });
      } catch (analyticsError) {
        console.error("Analytics error:", analyticsError);
      }

      toast({
        title: "Welcome to FixSense! 🎉",
        description: "Your account is ready. Let's get started!",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = fullName.trim() && phone.trim() && country && currency;
  const selectedCountry = COUNTRIES.find(c => c.code === country);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent/10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 font-bold text-2xl">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-6 h-6 text-primary-foreground" />
            </div>
            <span>FixSense</span>
          </div>
          <CardTitle className="text-2xl">Let's set up your FixSense account</CardTitle>
          <CardDescription>
            This helps us personalize your experience and provide accurate diagnostics
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors({ ...errors, fullName: "" });
                }}
                className={errors.fullName ? "border-destructive" : ""}
                disabled={submitting}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={country} 
                onValueChange={handleCountryChange}
                disabled={submitting}
              >
                <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="w-24">
                  <Input
                    value={selectedCountry?.dialCode || ""}
                    disabled
                    className="text-center"
                  />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="8012345678"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, "");
                    setPhone(value);
                    setErrors({ ...errors, phone: "" });
                  }}
                  className={errors.phone ? "border-destructive flex-1" : "flex-1"}
                  disabled={submitting}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter your phone number without country code
              </p>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">
                Preferred Currency <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={currency} 
                onValueChange={(value) => {
                  setCurrency(value);
                  setErrors({ ...errors, currency: "" });
                }}
                disabled={submitting}
              >
                <SelectTrigger className={errors.currency ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name} ({curr.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This will be used for cost estimates and billing
              </p>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={!isFormValid || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up your account...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Continue to Dashboard
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;