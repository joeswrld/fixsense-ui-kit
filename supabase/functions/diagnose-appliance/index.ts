import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, description, inputType, propertyId, applianceId } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }

    console.log('Processing diagnostic for user:', user.id);
    console.log('Input type:', inputType);
    console.log('File URL:', fileUrl);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the prompt for AI analysis
    let systemPrompt = `You are an expert appliance repair diagnostic AI. Analyze the provided input and return a detailed diagnosis in JSON format with the following structure:
{
  "diagnosis_summary": "Brief summary of the issue",
  "probable_causes": ["cause 1", "cause 2", "cause 3"],
  "estimated_cost_min": number,
  "estimated_cost_max": number,
  "urgency": "critical" | "warning" | "safe",
  "scam_alerts": ["alert 1", "alert 2"],
  "fix_instructions": "Step-by-step repair instructions"
}

Be specific about costs, causes, and repair steps. Focus on common appliance issues like AC units, refrigerators, washing machines, etc. Include scam protection warnings about overpricing or unnecessary replacements.`;

    let userPrompt = description || "Diagnose the appliance issue shown in the image/video.";

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // If there's a file URL and it's an image or video, add it to the prompt
    if (fileUrl && (inputType === 'photo' || inputType === 'video')) {
      // Get the signed URL for the file
      const filePath = fileUrl.split('/').slice(-2).join('/');
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('diagnostics')
        .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
      } else if (signedUrlData?.signedUrl) {
        messages[1] = {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: signedUrlData.signedUrl } }
          ]
        };
      }
    }

    console.log('Calling Lovable AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received');

    const aiResult = JSON.parse(aiData.choices[0].message.content);

    // Save the diagnostic to the database
    const { data: diagnostic, error: dbError } = await supabase
      .from('diagnostics')
      .insert({
        user_id: user.id,
        property_id: propertyId || null,
        appliance_id: applianceId || null,
        input_type: inputType,
        file_url: fileUrl || null,
        description: description || null,
        diagnosis_summary: aiResult.diagnosis_summary,
        probable_causes: aiResult.probable_causes,
        estimated_cost_min: aiResult.estimated_cost_min,
        estimated_cost_max: aiResult.estimated_cost_max,
        urgency: aiResult.urgency,
        scam_alerts: aiResult.scam_alerts,
        fix_instructions: aiResult.fix_instructions
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save diagnostic');
    }

    console.log('Diagnostic saved with ID:', diagnostic.id);

    return new Response(JSON.stringify({ 
      success: true, 
      diagnostic 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in diagnose-appliance function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
