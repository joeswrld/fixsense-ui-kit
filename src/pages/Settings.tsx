import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { GDPRSettings } from "@/components/settings/GDPRSettings";
import { BillingManagement } from "@/components/billing/BillingManagement";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { languages } from "@/i18n/config";

const COUNTRIES = [
  { code: "NG", name: "Nigeria", dialCode: "+234" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "NZ", name: "New Zealand", dialCode: "+64" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "KE", name: "Kenya", dialCode: "+254" },
  { code: "GH", name: "Ghana", dialCode: "+233" },
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "BR", name: "Brazil", dialCode: "+55" },
  { code: "MX", name: "Mexico", dialCode: "+52" },
  { code: "ES", name: "Spain", dialCode: "+34" },
  { code: "PT", name: "Portugal", dialCode: "+351" },
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
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
].sort((a, b) => a.name.localeCompare(b.name));

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    currency: "",
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Real-time subscription for profile updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('profile-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime profile update:', payload);
          const newData = payload.new;
          setProfileData({
            fullName: newData.full_name || "",
            email: newData.email || "",
            phone: newData.phone || "",
            country: newData.country || "",
            currency: newData.currency || "",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, country, currency")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfileData({
        fullName: profile?.full_name || "",
        email: profile?.email || user.email || "",
        phone: profile?.phone || "",
        country: profile?.country || "",
        currency: profile?.currency || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: t('common.error'),
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = useCallback(async (field: string, value: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating field:", error);
      toast({
        title: t('common.error'),
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  }, [toast, t]);

  const handleFieldChange = (field: string, dbField: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    updateField(dbField, value);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    toast({
      title: t('common.success'),
      description: "Language updated",
    });
  };

  const selectedCountry = COUNTRIES.find(c => c.code === profileData.country);

  return (
    <div className="min-h-screen bg-accent/10">
      <AppHeader />

      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
            <p className="text-muted-foreground">{t('settings.subtitle')}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">{t('settings.tabs.profile')}</TabsTrigger>
              <TabsTrigger value="billing">{t('settings.tabs.billing')}</TabsTrigger>
              <TabsTrigger value="notifications">{t('settings.tabs.notifications')}</TabsTrigger>
              <TabsTrigger value="privacy">{t('settings.tabs.privacy')}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.profile.title')}</CardTitle>
                    <CardDescription>{t('settings.profile.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('settings.profile.fullName')}</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={profileData.fullName}
                        onChange={(e) => handleFieldChange('fullName', 'full_name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('settings.profile.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={profileData.email}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">{t('settings.profile.language')}</Label>
                      <Select
                        value={i18n.language}
                        onValueChange={handleLanguageChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem key={language.code} value={language.code}>
                              {language.flag} {language.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">{t('settings.profile.country')}</Label>
                      <Select
                        value={profileData.country}
                        onValueChange={(value) => handleFieldChange('country', 'country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('settings.profile.phone')}</Label>
                      <div className="flex gap-2">
                        <div className="w-24">
                          <Input
                            value={selectedCountry?.dialCode || ""}
                            disabled
                            className="text-center bg-muted"
                          />
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="8012345678"
                          value={profileData.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, "");
                            handleFieldChange('phone', 'phone', value);
                          }}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter your phone number without country code
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">{t('settings.profile.currency')}</Label>
                      <Select
                        value={profileData.currency}
                        onValueChange={(value) => handleFieldChange('currency', 'currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        This will be used for cost estimates and billing
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Changes are saved automatically in real-time
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <BillingManagement />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationPreferences />
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <GDPRSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
