import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RAILWAY_API_URL = "https://web-production-8ff9e.up.railway.app/predict-coastal";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  console.log("simulate-coastal: Request received");

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

    const lat = Number(body.lat);
    const lon = Number(body.lon);
    const mangrove_width = Number(body.mangrove_width ?? 0);
    const sea_level_rise = Number(body.slr_projection ?? body.sea_level_rise ?? 0);
    const include_storm_surge = Boolean(body.include_storm_surge ?? false);
    const daily_revenue = body.daily_revenue != null ? Number(body.daily_revenue) : undefined;
    const expected_downtime_days = body.expected_downtime_days != null ? Number(body.expected_downtime_days) : undefined;
    const property_value = body.property_value != null ? Number(body.property_value) : undefined;
    const asset_lifespan = body.asset_lifespan != null ? Number(body.asset_lifespan) : undefined;
    const initial_lifespan_years = body.initial_lifespan_years != null ? Number(body.initial_lifespan_years) : undefined;
    const base_annual_opex = body.base_annual_opex != null ? Number(body.base_annual_opex) : undefined;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return new Response(
        JSON.stringify({ error: "Validation failed", message: "lat must be between -90 and 90" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return new Response(
        JSON.stringify({ error: "Validation failed", message: "lon must be between -180 and 180" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const railwayBody: Record<string, unknown> = { lat, lon, mangrove_width, sea_level_rise, include_storm_surge };
    if (daily_revenue !== undefined) railwayBody.daily_revenue = daily_revenue;
    if (expected_downtime_days !== undefined) railwayBody.expected_downtime_days = expected_downtime_days;
    if (property_value !== undefined) railwayBody.property_value = property_value;
    if (asset_lifespan !== undefined) railwayBody.asset_lifespan = asset_lifespan;
    if (initial_lifespan_years !== undefined) railwayBody.initial_lifespan_years = initial_lifespan_years;
    if (base_annual_opex !== undefined) railwayBody.base_annual_opex = base_annual_opex;

    console.log("simulate-coastal: Validated", railwayBody);

    const response = await fetch(RAILWAY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(railwayBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("simulate-coastal: Railway API error", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Simulation failed", message: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("simulate-coastal: Success");

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
