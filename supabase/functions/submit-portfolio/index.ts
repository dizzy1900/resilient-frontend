import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Validation schemas
const assetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  lat: z.number().min(-90, "Latitude must be >= -90").max(90, "Latitude must be <= 90"),
  lon: z.number().min(-180, "Longitude must be >= -180").max(180, "Longitude must be <= 180"),
  value: z.number().min(0, "Value must be positive").max(999999999999, "Value exceeds maximum"),
});

const requestSchema = z.object({
  assets: z.array(assetSchema).min(1, "At least one asset required").max(10000, "Maximum 10,000 assets per batch"),
});

const RAILWAY_API_URL = "https://primary-production-679e.up.railway.app/webhook/start-batch";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("submit-portfolio: Request received");

  try {
    // 1. Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("submit-portfolio: Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("submit-portfolio: Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.log("submit-portfolio: Invalid token", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("submit-portfolio: User authenticated", { userId });

    // 2. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      console.log("submit-portfolio: Invalid JSON body");
      return new Response(
        JSON.stringify({ error: "Invalid request", message: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("submit-portfolio: Validation failed", validationResult.error.errors);
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid portfolio data",
          details: validationResult.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { assets } = validationResult.data;
    console.log("submit-portfolio: Validated assets", { count: assets.length });

    // 3. Create batch job
    const { data: jobData, error: jobError } = await supabase
      .from("batch_jobs")
      .insert({
        status: "pending",
        total_assets: assets.length,
        processed_assets: 0,
        user_id: userId,
      })
      .select()
      .single();

    if (jobError) {
      console.error("submit-portfolio: Failed to create batch job", jobError);
      return new Response(
        JSON.stringify({ error: "Database error", message: "Failed to create batch job" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobId = jobData.id;
    console.log("submit-portfolio: Created batch job", { jobId });

    // 4. Insert portfolio assets
    const assetsToInsert = assets.map((asset) => ({
      job_id: jobId,
      name: asset.name,
      lat: asset.lat,
      lon: asset.lon,
      value: asset.value,
      user_id: userId,
    }));

    const { error: assetsError } = await supabase
      .from("portfolio_assets")
      .insert(assetsToInsert);

    if (assetsError) {
      console.error("submit-portfolio: Failed to insert assets", assetsError);
      // Clean up the batch job
      await supabase.from("batch_jobs").delete().eq("id", jobId);
      return new Response(
        JSON.stringify({ error: "Database error", message: "Failed to save portfolio assets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("submit-portfolio: Inserted assets", { count: assets.length });

    // 5. Call Railway API to start batch processing
    try {
      const railwayResponse = await fetch(RAILWAY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ job_id: jobId }),
      });

      if (!railwayResponse.ok) {
        console.error("submit-portfolio: Railway API error", {
          status: railwayResponse.status,
          statusText: railwayResponse.statusText,
        });
        // Don't fail the request - the job is created, processing can be retried
      } else {
        console.log("submit-portfolio: Railway API triggered successfully");
      }
    } catch (railwayError) {
      console.error("submit-portfolio: Railway API call failed", railwayError);
      // Don't fail the request - the job is created, processing can be retried
    }

    // 6. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        assets_count: assets.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("submit-portfolio: Unexpected error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
