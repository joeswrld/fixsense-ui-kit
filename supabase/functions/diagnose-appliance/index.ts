import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fileUrl, description, inputType, propertyId, applianceId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!, 
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User:", user.id, "Input:", inputType);

    // -----------------------------
    // 1️⃣ CHECK USAGE LIMITS
    // -----------------------------
    const { data: canCreate, error: checkError } = await supabase.rpc(
      "can_create_diagnostic",
      {
        p_user_id: user.id,
        p_input_type: inputType,
      }
    );

    if (checkError) {
      console.error("RPC error:", checkError);
      return new Response(
        JSON.stringify({
          error: "Failed to check usage limits",
          details: checkError.message,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!canCreate) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();

      return new Response(
        JSON.stringify({
          error: "Monthly limit reached",
          message: `You've reached your monthly ${inputType} diagnostic limit.`,
          tier: profile?.subscription_tier || "free",
          action: "upgrade_required",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // -----------------------------
    // 2️⃣ CREATE DIAGNOSTIC (INITIAL RECORD)
    // -----------------------------
    const { data: diagnostic, error: diagnosticError } = await supabase
      .from("diagnostics")
      .insert({
        user_id: user.id,
        property_id: propertyId || null,
        appliance_id: applianceId || null,
        input_type: inputType,
        file_url: fileUrl || null,
        description: description || null,
        status: "analyzing",
      })
      .select()
      .single();

    if (diagnosticError) {
      console.error("Diagnostic creation error:", diagnosticError);
      throw new Error("Failed to create diagnostic record");
    }

    // -----------------------------
    // 3️⃣ TRACK USAGE IMMEDIATELY
    // -----------------------------
    const { error: trackingError } = await supabase
      .from("usage_tracking")
      .insert({
        user_id: user.id,
        input_type: inputType,
        diagnostic_id: diagnostic.id,
      });

    if (trackingError) console.error("Usage tracking error:", trackingError);

    // -----------------------------
    // 4️⃣ GENERATE AI PROMPT
    // -----------------------------
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `
You are an expert appliance repair diagnostic AI. Provide structured JSON:
{
  "diagnosis_summary": "",
  "probable_causes": [],
  "estimated_cost_min": 0,
  "estimated_cost_max": 0,
  "urgency": "",
  "scam_alerts": [],
  "fix_instructions": ""
}
    `.trim();

    let messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: description || "Analyze this appliance issue." },
    ];

    // Signed URL for media
    if (fileUrl && (inputType === "photo" || inputType === "video")) {
      const filePath = fileUrl.split("/").slice(-2).join("/");

      const { data: signedData, error: signedErr } = await supabase.storage
        .from("diagnostics")
        .createSignedUrl(filePath, 3600);

      if (!signedErr && signedData?.signedUrl) {
        messages[1] = {
          role: "user",
          content: [
            { type: "text", text: description },
            { type: "image_url", image_url: { url: signedData.signedUrl } },
          ],
        };
      }
    }

    // -----------------------------
    // 5️⃣ CALL LOVABLE AI
    // -----------------------------
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      console.log("AI Error:", await aiResponse.text());
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const aiResult = JSON.parse(aiData.choices[0].message.content);

    // -----------------------------
    // 6️⃣ UPDATE DIAGNOSTIC WITH AI RESULTS
    // -----------------------------
    const { error: updateError } = await supabase
      .from("diagnostics")
      .update({
        diagnosis_summary: aiResult.diagnosis_summary,
        probable_causes: aiResult.probable_causes,
        estimated_cost_min: aiResult.estimated_cost_min,
        estimated_cost_max: aiResult.estimated_cost_max,
        urgency: aiResult.urgency,
        scam_alerts: aiResult.scam_alerts,
        fix_instructions: aiResult.fix_instructions,
        status: "completed",
      })
      .eq("id", diagnostic.id);

    if (updateError) {
      console.error("Diagnostic update error:", updateError);
      throw new Error("Failed to update diagnostic with AI results");
    }

    // -----------------------------
    // 7️⃣ RETURN SUCCESS
    // -----------------------------
    return new Response(
      JSON.stringify({
        success: true,
        diagnostic_id: diagnostic.id,
        message: "Diagnostic created successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
