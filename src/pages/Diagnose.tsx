import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Video, Mic, FileText, Upload, ArrowLeft, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Diagnose = () => {
  const [step, setStep] = useState(1);
  const [inputType, setInputType] = useState<string>("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const inputTypes = [
    { id: "photo", label: "Upload Photo", icon: Camera, description: "Take or upload a photo of the issue" },
    { id: "video", label: "Upload Video", icon: Video, description: "Record or upload a video showing the problem" },
    { id: "audio", label: "Upload Audio", icon: Mic, description: "Record unusual sounds or noises" },
    { id: "text", label: "Describe Manually", icon: FileText, description: "Write a detailed description" },
  ];

  const handleSelectType = (type: string) => {
    setInputType(type);
    setStep(2);
  };

  const handleSubmit = () => {
    toast({
      title: "Diagnostic Started",
      description: "Our AI is analyzing your input. This may take a moment...",
    });
    // In a real app, this would submit to an AI endpoint
    setTimeout(() => {
      navigate("/result-demo");
    }, 2000);
  };

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
        <div className="max-w-3xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => step === 1 ? navigate("/dashboard") : setStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Input Type</CardTitle>
                <CardDescription>Select how you want to describe the problem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {inputTypes.map((type) => (
                    <Card
                      key={type.id}
                      className="border-2 hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => handleSelectType(type.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                            <type.icon className="w-7 h-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{type.label}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload & Describe</CardTitle>
                <CardDescription>
                  {inputType === "text" ? "Describe the problem in detail" : "Upload your file and add details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {inputType !== "text" && (
                  <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-all cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">
                      {inputType === "photo" && "JPG, PNG, WEBP (max 10MB)"}
                      {inputType === "video" && "MP4, MOV, AVI (max 50MB)"}
                      {inputType === "audio" && "MP3, WAV, M4A (max 20MB)"}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Notes (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what's happening, when it started, any unusual behaviors..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button className="w-full" size="lg" onClick={handleSubmit}>
                  Analyze Problem
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Diagnose;