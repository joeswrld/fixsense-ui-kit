import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Video, Mic, FileText, TrendingUp, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UsageData {
  photo_usage: number;
  video_usage: number;
  audio_usage: number;
  text_usage: number;
  photo_limit: number;
  video_limit: number;
  audio_limit: number;
  text_limit: number;
  subscription_tier: string;
  current_period_start: string;
  current_period_end: string;
}

export const UsageLimitsCard = () => {
  const navigate = useNavigate();

  const { data: usage, isLoading } = useQuery({
    queryKey: ["user-usage"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_usage_summary")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as UsageData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-yellow-600";
    return "text-primary";
  };

  const getProgressColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-primary";
  };

  const diagnosticTypes = [
    { 
      type: "photo", 
      label: "Photo Diagnostics", 
      icon: Camera,
      used: usage?.photo_usage || 0,
      limit: usage?.photo_limit || 0
    },
    { 
      type: "video", 
      label: "Video Diagnostics", 
      icon: Video,
      used: usage?.video_usage || 0,
      limit: usage?.video_limit || 0
    },
    { 
      type: "audio", 
      label: "Audio Diagnostics", 
      icon: Mic,
      used: usage?.audio_usage || 0,
      limit: usage?.audio_limit || 0
    },
    { 
      type: "text", 
      label: "Text Diagnostics", 
      icon: FileText,
      used: usage?.text_usage || 0,
      limit: usage?.text_limit || 0
    },
  ];

  const isNearLimit = diagnosticTypes.some(dt => dt.used >= dt.limit * 0.75);
  const tier = usage?.subscription_tier || "free";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isNearLimit ? "border-yellow-500" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Usage This Month
            </CardTitle>
            <CardDescription>
              {usage?.current_period_start && usage?.current_period_end && (
                <>
                  {new Date(usage.current_period_start).toLocaleDateString()} - {new Date(usage.current_period_end).toLocaleDateString()}
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant={tier === "free" ? "secondary" : "default"} className="gap-1">
            {tier !== "free" && <Crown className="w-3 h-3" />}
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnosticTypes.map((dt) => {
          const Icon = dt.icon;
          const percentage = dt.limit > 0 ? (dt.used / dt.limit) * 100 : 0;
          const isDisabled = dt.limit === 0;

          return (
            <div key={dt.type} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{dt.label}</span>
                </div>
                <span className={isDisabled ? "text-muted-foreground" : getUsageColor(dt.used, dt.limit)}>
                  {isDisabled ? "Not available" : `${dt.used} / ${dt.limit}`}
                </span>
              </div>
              {!isDisabled && (
                <div className="relative">
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                  <div 
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(dt.used, dt.limit)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {tier === "free" && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade to unlock more diagnostics and advanced features
            </p>
            <Button 
              className="w-full" 
              onClick={() => navigate("/settings?tab=billing")}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        )}

        {tier !== "free" && isNearLimit && (
          <div className="pt-4 border-t">
            <p className="text-sm text-yellow-600">
              ⚠️ You're approaching your monthly limit. Your usage will reset on {usage?.current_period_end && new Date(usage.current_period_end).toLocaleDateString()}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};