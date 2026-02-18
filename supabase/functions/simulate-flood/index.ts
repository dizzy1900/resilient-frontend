import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RAILWAY_API_URL = "https://web-production-8ff9e.up.railway.app/predict-flood";

const validInterventionTypes = ["green_roof", "permeable_pavement", "bioswales", "rain_gardens"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  console.log("simulate-flood: Request received");

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request", message: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rain_intensity = Number(body.rain_intensity);
    const current_imperviousness = Number(body.current_imperviousness);
    const intervention_type = String(body.intervention_type ?? "green_roof");
    const slope_pct = Number(body.slope_pct ?? 2.0);
    const lat = body.lat != null ? Number(body.lat) : undefined;
    const lon = body.lon != null ? Number(body.lon) : undefined;
    const rain_intensity_pct = body.rain_intensity_pct != null ? Number(body.rain_intensity_pct) : undefined;

    if (isNaN(rain_intensity) || rain_intensity < 0 || rain_intensity > 500) {
      return new Response(
        JSON.stringify({ error: "Validation failed", message: "rain_intensity must be between 0 and 500" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (isNaN(current_imperviousness) || current_imperviousness < 0 || current_imperviousness > 1) {
      return new Response(
        JSON.stringify({ error: "Validation failed", message: "current_imperviousness must be between 0 and 1" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!validInterventionTypes.includes(intervention_type)) {
      return new Response(
        JSON.stringify({ error: "Validation failed", message: `intervention_type must be one of: ${validInterventionTypes.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: Record<string, unknown> = {
      rain_intensity,
      current_imperviousness,
      intervention_type,
      slope_pct,
    };
    if (lat !== undefined) payload.lat = lat;
    if (lon !== undefined) payload.lon = lon;
    if (rain_intensity_pct !== undefined) payload.rain_intensity_pct = rain_intensity_pct;

    console.log("simulate-flood: Validated", payload);

    const response = await fetch(RAILWAY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("simulate-flood: Railway API error", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Simulation failed", message: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("simulate-flood: Success");

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("simulate-flood: Unexpected error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
