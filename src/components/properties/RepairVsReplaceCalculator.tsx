import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, RefreshCw, DollarSign } from "lucide-react";

const REPLACEMENT_COST: Record<string, number> = {
  "Air Conditioner": 350000,
  "Refrigerator": 280000,
  "Washing Machine": 200000,
  "Dryer": 180000,
  "Dishwasher": 250000,
  "Oven": 150000,
  "Microwave": 45000,
  "Water Heater": 120000,
  "Generator": 500000,
  "Ceiling Fan": 25000,
  "Freezer": 200000,
  "Electric Cooker": 80000,
  "Iron": 15000,
  "Blender": 20000,
  "Television": 200000,
  "Other": 100000,
};

const EXPECTED_LIFESPAN: Record<string, number> = {
  "Air Conditioner": 15,
  "Refrigerator": 15,
  "Washing Machine": 12,
  "Dryer": 13,
  "Dishwasher": 10,
  "Oven": 15,
  "Microwave": 10,
  "Water Heater": 12,
  "Generator": 20,
  "Ceiling Fan": 15,
  "Freezer": 15,
  "Electric Cooker": 12,
  "Television": 8,
  "Other": 10,
};

interface RepairVsReplaceCalculatorProps {
  applianceType: string;
  totalRepairCost: number;
  purchaseDate: string | null;
}

export const RepairVsReplaceCalculator = ({
  applianceType,
  totalRepairCost,
  purchaseDate,
}: RepairVsReplaceCalculatorProps) => {
  const replacementCost = REPLACEMENT_COST[applianceType] || 100000;
  const lifespan = EXPECTED_LIFESPAN[applianceType] || 10;

  const ageYears = purchaseDate
    ? Math.round((Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25) * 10) / 10
    : null;

  const repairToReplaceRatio = Math.round((totalRepairCost / replacementCost) * 100);
  const remainingLifeYears = ageYears !== null ? Math.max(0, lifespan - ageYears) : null;

  // 50% rule: if repair costs exceed 50% of replacement, consider replacing
  const shouldReplace = repairToReplaceRatio >= 50 || (ageYears !== null && ageYears >= lifespan * 0.85);

  const annualRepairCost = ageYears && ageYears > 0 ? Math.round(totalRepairCost / ageYears) : 0;
  const annualReplacementCost = remainingLifeYears && remainingLifeYears > 0
    ? Math.round(replacementCost / remainingLifeYears)
    : replacementCost;

  const recommendation = shouldReplace
    ? "Consider replacing this appliance. Continued repairs may not be cost-effective."
    : "Keep repairing. Total repair costs are still well below replacement cost.";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Repair vs Replace
            </CardTitle>
            <CardDescription>Cost analysis to help you decide</CardDescription>
          </div>
          <Badge variant={shouldReplace ? "destructive" : "default"}>
            {shouldReplace ? "Consider Replacing" : "Keep Repairing"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-accent/30 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total Repairs</p>
            <p className="font-bold text-lg">₦{totalRepairCost.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/30 text-center">
            <RefreshCw className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Est. Replacement</p>
            <p className="font-bold text-lg">₦{replacementCost.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Repair cost vs replacement</span>
            <span className={`font-medium ${repairToReplaceRatio >= 50 ? "text-destructive" : repairToReplaceRatio >= 30 ? "text-yellow-500" : "text-green-500"}`}>
              {repairToReplaceRatio}%
            </span>
          </div>
          <Progress value={Math.min(100, repairToReplaceRatio)} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            The 50% rule: if repairs exceed 50% of replacement cost, consider replacing.
          </p>
        </div>

        {ageYears !== null && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Avg Annual Repair Cost</p>
              <p className="font-semibold">₦{annualRepairCost.toLocaleString()}/yr</p>
            </div>
            <div>
              <p className="text-muted-foreground">Replacement Cost/Remaining Yr</p>
              <p className="font-semibold">₦{annualReplacementCost.toLocaleString()}/yr</p>
            </div>
          </div>
        )}

        <div className={`p-3 rounded-lg flex items-start gap-2 ${shouldReplace ? "bg-destructive/10" : "bg-green-500/10"}`}>
          {shouldReplace ? (
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-sm">{recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
};
