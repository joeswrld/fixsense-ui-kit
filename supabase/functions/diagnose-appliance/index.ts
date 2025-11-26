import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Updated usage limits to match the new FREE plan requirements
const USAGE_LIMITS = {
  free: { photo: 2, video: 0, audio: 0, text: 3 },
  pro: { photo: 30, video: 2, audio: 10, text: 40 },
  business: { photo: 60, video: 5, audio: 20, text: 150 },
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

    // Use the database function to check if user can create diagnostic
    const { data: canCreate, error: canCreateError } = await supabase.rpc(
      'can_create_diagnostic',
      {
        p_user_id: user.id,
        p_input_type: inputType
      }
    );

    if (canCreateError) {
      console.error('Error checking usage limits:', canCreateError);
      throw new Error('Failed to verify usage limits');
    }

    console.log('Can create diagnostic:', canCreate);

    // If user cannot create diagnostic, get their current usage for detailed error
    if (!canCreate) {
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usageError) {
        console.error('Error fetching usage summary:', usageError);
      }

      const tier = usageData?.subscription_tier || 'free';
      const tierLimits = USAGE_LIMITS[tier as keyof typeof USAGE_LIMITS];
      const inputLimit = tierLimits[inputType as keyof typeof tierLimits] || 0;
      
      let currentUsage = 0;
      if (usageData) {
        currentUsage = usageData[`${inputType}_usage`] || 0;
      }

      // Check if feature is locked (limit is 0)
      if (inputLimit === 0) {
        return new Response(
          JSON.stringify({
            error: 'Feature locked',
            details: {
              message: `${inputType.charAt(0).toUpperCase() + inputType.slice(1)} diagnostics are not available on the ${tier} plan.`,
              tier,
              limit: 0,
              used: 0,
              action: 'upgrade_required',
              upgradeMessage: 'Upgrade to Pro or Business to unlock this feature.'
            }
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // User has reached their limit
      return new Response(
        JSON.stringify({
          error: 'Monthly limit reached',
          details: {
            message: `You've used all ${inputLimit} ${inputType} diagnostics for this month.`,
            limit: inputLimit,
            used: currentUsage,
            tier,
            action: 'upgrade_or_wait',
            upgradeMessage: tier === 'free' 
              ? 'Upgrade to Pro or Business for more diagnostics, or wait until your quota resets next month.'
              : 'Your monthly limit has been reached. It will reset on the 1st of next month.'
          }
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the prompt for AI analysis
    const systemPrompt = `You are an expert appliance repair diagnostic AI. Analyze the provided input and return a detailed diagnosis in JSON format with the following structure:
{
  "diagnosis_summary": "A clear, concise summary of the issue (2-3 sentences)",
  "probable_causes": ["Most likely cause", "Second likely cause", "Third possible cause"],
  "estimated_cost_min": number (minimum repair cost in Naira),
  "estimated_cost_max": number (maximum repair cost in Naira),
  "urgency": "critical" | "warning" | "safe",
  "scam_alerts": ["Common scam alert 1", "Overpricing warning 2"],
  "fix_instructions": "Detailed step-by-step repair instructions with safety warnings"
}

Guidelines:
- Use Nigerian Naira (₦) for all cost estimates
- Be realistic about costs (research typical Nigerian appliance repair prices)
- Focus on common appliance issues: AC units, refrigerators, washing machines, microwaves, etc.
- Include scam protection warnings about overpricing or unnecessary replacements
- Urgency levels: critical (immediate danger/total failure), warning (needs attention soon), safe (minor issue)
- Provide practical DIY steps when safe, otherwise recommend professional help`;

    const userPrompt = description || "Diagnose the appliance issue shown in the provided media.";

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // If there's a file URL and it's an image, add it to the prompt
    if (fileUrl && inputType === 'photo') {
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

    console.log('Calling Lovable AI for analysis...');
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
        return new Response(JSON.stringify({ 
          error: 'AI service rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI service temporarily unavailable. Please contact support.' 
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received');

    let aiResult;
    try {
      aiResult = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Validate AI response structure
    const validatedResult = {
      diagnosis_summary: aiResult.diagnosis_summary || 'Unable to determine diagnosis',
      probable_causes: Array.isArray(aiResult.probable_causes) ? aiResult.probable_causes : ['Unknown cause'],
      estimated_cost_min: typeof aiResult.estimated_cost_min === 'number' ? aiResult.estimated_cost_min : 0,
      estimated_cost_max: typeof aiResult.estimated_cost_max === 'number' ? aiResult.estimated_cost_max : 0,
      urgency: ['critical', 'warning', 'safe'].includes(aiResult.urgency) ? aiResult.urgency : 'warning',
      scam_alerts: Array.isArray(aiResult.scam_alerts) ? aiResult.scam_alerts : [],
      fix_instructions: aiResult.fix_instructions || 'Please consult a professional technician.'
    };

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
        diagnosis_summary: validatedResult.diagnosis_summary,
        probable_causes: validatedResult.probable_causes,
        estimated_cost_min: validatedResult.estimated_cost_min,
        estimated_cost_max: validatedResult.estimated_cost_max,
        urgency: validatedResult.urgency,
        scam_alerts: validatedResult.scam_alerts,
        fix_instructions: validatedResult.fix_instructions,
        status: 'completed'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save diagnostic');
    }

    console.log('Diagnostic saved with ID:', diagnostic.id);

    // Track usage
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';

    const { error: usageTrackError } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        input_type: inputType,
        subscription_tier: tier,
        diagnostic_id: diagnostic.id
      });

    if (usageTrackError) {
      console.error('Error tracking usage:', usageTrackError);
      // Don't fail the request if usage tracking fails
    }

    // Get updated usage info
    const { data: updatedUsage } = await supabase
      .from('user_usage_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const tierLimits = USAGE_LIMITS[tier as keyof typeof USAGE_LIMITS];
    const inputLimit = tierLimits[inputType as keyof typeof tierLimits] || 0;
    const currentUsage = updatedUsage ? updatedUsage[`${inputType}_usage`] : 1;
    const remainingUsage = Math.max(0, inputLimit - currentUsage);
    
    return new Response(JSON.stringify({ 
      success: true, 
      diagnostic,
      usage: {
        used: currentUsage,
        limit: inputLimit,
        remaining: remainingUsage,
        tier
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in diagnose-appliance function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      message: 'Failed to process diagnostic. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});