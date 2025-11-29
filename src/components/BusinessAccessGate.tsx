import { useBusinessAccess } from "@/hooks/useBusinessAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface BusinessAccessGateProps {
  children: ReactNode;
  featureName: string;
}

export const BusinessAccessGate = ({ children, featureName }: BusinessAccessGateProps) => {
  const { isBusinessUser, isLoading } = useBusinessAccess();
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    // Navigate to settings page with billing tab selected
    navigate("/settings?tab=billing");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!isBusinessUser) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <CardTitle>Business Feature</CardTitle>
          </div>
          <CardDescription>
            {featureName} is available for business users only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 text-center space-y-4">
            <Sparkles className="w-12 h-12 mx-auto text-primary" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Upgrade to Business Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unlock advanced features to manage your properties like a pro
              </p>
              <ul className="text-sm text-left space-y-2 max-w-sm mx-auto">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>AI-powered predictive maintenance alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Comprehensive vendor management & ratings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Advanced analytics and reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Warranty tracking with expiration alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Multi-property portfolio management</span>
                </li>
              </ul>
            </div>
            <Button 
              size="lg" 
              className="w-full max-w-xs"
              onClick={handleUpgradeClick}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Business
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};