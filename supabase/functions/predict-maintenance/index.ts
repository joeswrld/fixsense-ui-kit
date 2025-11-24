import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applianceId } = await req.json();

    // Fetch appliance details
    const { data: appliance, error: applianceError } = await supabase
      .from("appliances")
      .select(`
        *,
        properties!inner (
          name,
          user_id
        )
      `)
      .eq("id", applianceId)
      .single();

    if (applianceError || !appliance) {
      throw new Error("Appliance not found");
    }

    // Fetch maintenance history
    const { data: maintenanceHistory, error: historyError } = await supabase
      .from("maintenance_history")
      .select("*")
      .eq("appliance_id", applianceId)
      .order("maintenance_date", { ascending: false });

    if (historyError) {
      console.error("Error fetching maintenance history:", historyError);
    }

    // Fetch diagnostics history
    const { data: diagnostics, error: diagnosticsError } = await supabase
      .from("diagnostics")
      .select("*")
      .eq("appliance_id", applianceId)
      .order("created_at", { ascending: false });

    if (diagnosticsError) {
      console.error("Error fetching diagnostics:", diagnosticsError);
    }

    // Prepare data summary for AI
    const applianceAge = appliance.purchase_date 
      ? Math.floor((Date.now() - new Date(appliance.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : "unknown";

    const maintenanceSummary = maintenanceHistory?.map(m => ({
      type: m.maintenance_type,
      date: m.maintenance_date,
      cost: m.cost,
    })) || [];

    const diagnosticsSummary = diagnostics?.map(d => ({
      summary: d.diagnosis_summary,
      urgency: d.urgency,
      date: d.created_at,
    })) || [];

    const prompt = `You are an AI maintenance prediction expert. Analyze the following appliance data and predict potential failures or maintenance needs.

Appliance Details:
- Type: ${appliance.type}
- Brand: ${appliance.brand || "Unknown"}
- Model: ${appliance.model || "Unknown"}
- Age: ${applianceAge} years
- Current Status: ${appliance.status || "good"}

Maintenance History (${maintenanceHistory?.length || 0} records):
${JSON.stringify(maintenanceSummary, null, 2)}

Diagnostic History (${diagnostics?.length || 0} records):
${JSON.stringify(diagnosticsSummary, null, 2)}

Based on this data, provide a JSON response with the following structure:
{
  "predictions": [
    {
      "type": "string (e.g., 'Filter Replacement', 'Component Failure')",
      "confidence": number (0-100),
      "predictedDate": "YYYY-MM-DD",
      "severity": "low|medium|high|critical",
      "recommendation": "detailed recommendation text"
    }
  ]
}

Consider:
1. Appliance age and typical lifespan
2. Maintenance frequency and patterns
3. Previous diagnostic issues
4. Common failure patterns for this appliance type
5. Cost and urgency trends

Provide 1-3 most relevant predictions. Return ONLY the JSON, no additional text.`;

    console.log("Sending request to Lovable AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No response from AI");
    }

    console.log("AI Response:", aiContent);

    // Parse AI response
    let predictions;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0]).predictions;
      } else {
        predictions = JSON.parse(aiContent).predictions;
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Failed to parse AI predictions");
    }

    // Store predictions in database
    const alerts = [];
    for (const prediction of predictions) {
      const { error: insertError } = await supabase
        .from("predictive_alerts")
        .insert({
          appliance_id: applianceId,
          user_id: appliance.properties.user_id,
          prediction_type: prediction.type,
          confidence_score: prediction.confidence,
          predicted_failure_date: prediction.predictedDate,
          recommendation: prediction.recommendation,
          severity: prediction.severity,
        });

      if (insertError) {
        console.error("Error inserting alert:", insertError);
      } else {
        alerts.push(prediction);
      }
    }

    return new Response(
      JSON.stringify({ success: true, predictions: alerts }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in predict-maintenance:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
