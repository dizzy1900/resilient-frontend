import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Validation schema for coastal simulation
const requestSchema = z.object({
  lat: z.number().min(-90, "Latitude must be >= -90").max(90, "Latitude must be <= 90"),
  lon: z.number().min(-180, "Longitude must be >= -180").max(180, "Longitude must be <= 180"),
  mangrove_width: z.number().min(0, "Mangrove width must be >= 0").max(1000, "Mangrove width must be <= 1000"),
});

const RAILWAY_API_URL = "https://web-production-8ff9e.up.railway.app/predict-coastal";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("simulate-coastal: Request received");

  try {
    // 1. Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("simulate-coastal: Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("simulate-coastal: Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.log("simulate-coastal: Invalid token", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("simulate-coastal: User authenticated", { userId });

    // 2. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      console.log("simulate-coastal: Invalid JSON body");
      return new Response(
        JSON.stringify({ error: "Invalid request", message: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("simulate-coastal: Validation failed", validationResult.error.errors);
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid simulation parameters",
          details: validationResult.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lon, mangrove_width } = validationResult.data;
    console.log("simulate-coastal: Request from user", { userId, lat, lon, mangrove_width });

    // 3. Call Railway API
    const response = await fetch(RAILWAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lon, mangrove_width }),
    });

    if (!response.ok) {
      console.error("simulate-coastal: Railway API error", {
        status: response.status,
        statusText: response.statusText,
      });
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Simulation failed", message: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("simulate-coastal: Success for user", { userId });

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("simulate-coastal: Unexpected error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
