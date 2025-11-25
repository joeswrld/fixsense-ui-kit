import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Video, Mic, FileText, Upload, ArrowLeft, Loader2, Lock, Crown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { AppHeader } from "@/components/AppHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useUsageEnforcement } from "@/hooks/useUsageEnforcement";

interface Property {
  id: string;
  name: string;
}

interface Appliance {
  id: string;
  name: string;
  property_id: string;
}

const Diagnose = () => {
  const [step, setStep] = useState(1);
  const [inputType, setInputType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedAppliance, setSelectedAppliance] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkUsage, isLoading: usageLoading, tier, refetchUsage } = useUsageEnforcement();

  useEffect(() => {
    fetchPropertiesAndAppliances();
  }, []);

  const fetchPropertiesAndAppliances = async () => {
    try {
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("id, name")
        .order("name");

      const { data: appliancesData } = await supabase
        .from("appliances")
        .select("id, name, property_id")
        .order("name");

      setProperties(propertiesData || []);
      setAppliances(appliancesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filteredAppliances = selectedProperty
    ? appliances.filter(a => a.property_id === selectedProperty)
    : [];

  const inputTypes = [
    { id: "photo", label: "Upload Photo", icon: Camera, description: "Take or upload a photo of the issue" },
    { id: "video", label: "Upload Video", icon: Video, description: "Record or upload a video showing the problem" },
    { id: "audio", label: "Upload Audio", icon: Mic, description: "Record unusual sounds or noises" },
    { id: "text", label: "Describe Manually", icon: FileText, description: "Write a detailed description" },
  ];

  const handleSelectType = (type: string) => {
    const check = checkUsage(type as 'photo' | 'video' | 'audio' | 'text');
    
    if (check.isLocked) {
      toast({
        title: "Feature Locked",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} diagnostics are not available on your current plan. Upgrade to unlock this feature.`,
        variant: "destructive",
      });
      return;
    }

    if (check.isAtLimit) {
      toast({
        title: "Monthly Limit Reached",
        description: `You've used all ${check.limit} ${type} diagnostics this month. Upgrade your plan or wait until next month.`,
        variant: "destructive",
      });
      return;
    }

    setInputType(type);
    setStep(2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    // Final usage check before submission
    const check = checkUsage(inputType as 'photo' | 'video' | 'audio' | 'text');
    
    if (!check.canUse) {
      toast({
        title: "Cannot Proceed",
        description: check.isLocked 
          ? "This diagnostic type is locked on your plan. Upgrade to continue."
          : "You've reached your monthly limit. Upgrade to continue or wait until next month.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to diagnose.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      let fileUrl = null;

      if (file && inputType !== "text") {
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('diagnostics')
          .upload(fileName, file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Failed to upload file");
        }

        fileUrl = `diagnostics/${fileName}`;
        setUploading(false);
      }

      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://nflwheveqglnxgfmimpq.supabase.co/functions/v1/diagnose-appliance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl,
            description,
            inputType,
            propertyId: selectedProperty || null,
            applianceId: selectedAppliance || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const { diagnostic } = await response.json();

      // Refetch usage after successful diagnostic
      refetchUsage();

      toast({
        title: "Analysis Complete",
        description: "Your diagnostic results are ready.",
      });

      navigate(`/result/${diagnostic.id}`);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const currentTypeCheck = inputType ? checkUsage(inputType as 'photo' | 'video' | 'audio' | 'text') : null;

  return (
    <div className="min-h-screen bg-accent/10">
      <AppHeader />

      <main className="container px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => step === 1 ? navigate("/dashboard") : setStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Choose Input Type</CardTitle>
                    <CardDescription>Select how you want to describe the problem</CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {tier} Plan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {inputTypes.map((type) => {
                    const usageCheck = checkUsage(type.id as 'photo' | 'video' | 'audio' | 'text');
                    const isDisabled = !usageCheck.canUse || usageLoading;

                    return (
                      <Card
                        key={type.id}
                        className={`border-2 transition-all ${
                          isDisabled 
                            ? 'opacity-60 cursor-not-allowed' 
                            : 'hover:border-primary/50 cursor-pointer'
                        }`}
                        onClick={() => !isDisabled && handleSelectType(type.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                              isDisabled ? 'bg-muted' : 'bg-primary/10'
                            }`}>
                              {usageCheck.isLocked ? (
                                <Lock className="w-7 h-7 text-muted-foreground" />
                              ) : (
                                <type.icon className={`w-7 h-7 ${isDisabled ? 'text-muted-foreground' : 'text-primary'}`} />
                              )}
                            </div>
                            <div className="w-full">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <h3 className="font-semibold">{type.label}</h3>
                                {usageCheck.isLocked && (
                                  <Lock className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                              
                              {usageCheck.isLocked ? (
                                <div className="mt-3 text-xs text-muted-foreground">
                                  <Lock className="w-3 h-3 inline mr-1" />
                                  Upgrade to unlock
                                </div>
                              ) : (
                                <div className={`mt-3 text-xs font-medium ${
                                  usageCheck.isAtLimit ? 'text-red-600' : 
                                  usageCheck.remaining <= 1 ? 'text-yellow-600' : 
                                  'text-muted-foreground'
                                }`}>
                                  {usageCheck.remaining} of {usageCheck.limit} remaining
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {tier === 'free' && (
                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Crown className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Unlock More Diagnostics</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Upgrade to Pro or Business for more monthly diagnostics and unlock video/audio features.
                        </p>
                        <Button size="sm" onClick={() => navigate('/settings?tab=billing')}>
                          <Crown className="w-3 h-3 mr-2" />
                          Upgrade Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 2 && currentTypeCheck && (
            <>
              {currentTypeCheck.isAtLimit && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <span className="text-red-800 font-medium">
                      You've reached your monthly limit for {inputType} diagnostics. Upgrade to continue.
                    </span>
                    <Button size="sm" onClick={() => navigate('/settings?tab=billing')}>
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Upload & Describe</CardTitle>
                      <CardDescription>
                        {inputType === "text" ? "Describe the problem in detail" : "Upload your file and add details"}
                      </CardDescription>
                    </div>
                    <Badge variant={currentTypeCheck.remaining <= 1 ? "destructive" : "outline"}>
                      {currentTypeCheck.remaining} remaining
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {inputType !== "text" && (
                    <div>
                      <Label>Upload File</Label>
                      <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all mt-2 ${
                        currentTypeCheck.isAtLimit 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:border-primary/50'
                      }`}>
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept={
                            inputType === "photo" ? "image/*" :
                            inputType === "video" ? "video/*" :
                            inputType === "audio" ? "audio/*" : ""
                          }
                          onChange={handleFileSelect}
                          disabled={currentTypeCheck.isAtLimit}
                        />
                        <label htmlFor="file-upload" className={currentTypeCheck.isAtLimit ? 'cursor-not-allowed' : 'cursor-pointer'}>
                          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          {file ? (
                            <p className="text-sm font-medium mb-1">{file.name}</p>
                          ) : (
                            <>
                              <p className="text-sm font-medium mb-1">
                                {currentTypeCheck.isAtLimit ? 'Upload disabled - limit reached' : 'Click to upload or drag and drop'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {inputType === "photo" && "JPG, PNG, WEBP (max 10MB)"}
                                {inputType === "video" && "MP4, MOV (max 50MB)"}
                                {inputType === "audio" && "MP3, WAV, M4A (max 20MB)"}
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                      {uploading && (
                        <div className="mt-4">
                          <Progress value={uploadProgress} className="mb-2" />
                          <p className="text-sm text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="property">Property (Optional)</Label>
                      <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="appliance">Appliance (Optional)</Label>
                      <Select 
                        value={selectedAppliance} 
                        onValueChange={setSelectedAppliance}
                        disabled={!selectedProperty}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select appliance" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredAppliances.map((appliance) => (
                            <SelectItem key={appliance.id} value={appliance.id}>
                              {appliance.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what's happening, when it started, any unusual behaviors..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      disabled={currentTypeCheck.isAtLimit}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleSubmit}
                    disabled={uploading || analyzing || currentTypeCheck.isAtLimit || (inputType !== "text" && !file)}
                  >
                    {currentTypeCheck.isAtLimit ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Monthly Limit Reached
                      </>
                    ) : analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Problem"
                    )}
                  </Button>

                  {currentTypeCheck.isAtLimit && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => navigate('/settings?tab=billing')}>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Continue
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Diagnose;