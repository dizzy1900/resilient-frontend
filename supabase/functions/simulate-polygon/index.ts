import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_BASE_URL = "https://web-production-a1a6f3.up.railway.app";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  console.log("simulate-polygon: Request received");

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

    const geometry = body.geometry as { type?: string; coordinates?: unknown } | undefined;
    if (!geometry || geometry.type !== "Polygon" || !Array.isArray(geometry.coordinates)) {
      return new Response(
        JSON.stringify({ error: "Validation failed", message: "geometry must be a GeoJSON Polygon with coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mode = String(body.mode ?? "flood");
    const crop = body.crop ? String(body.crop) : undefined;

    const payload: Record<string, unknown> = {
      geometry,
      mode,
    };
    if (crop) payload.crop_type = crop;

    if (body.rain_intensity != null) payload.rain_intensity = Number(body.rain_intensity);
    if (body.rain_intensity_pct != null) payload.rain_intensity_pct = Number(body.rain_intensity_pct);
    if (body.current_imperviousness != null) payload.current_imperviousness = Number(body.current_imperviousness);
    if (body.intervention_type != null) payload.intervention_type = String(body.intervention_type);
    if (body.sea_level_rise != null) payload.sea_level_rise = Number(body.sea_level_rise);
    if (body.mangrove_width != null) payload.mangrove_width = Number(body.mangrove_width);

    console.log("simulate-polygon: Validated", { mode, coordsLength: (geometry.coordinates as unknown[][])[0]?.length });

    const response = await fetch(`${API_BASE_URL}/simulate/polygon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("simulate-polygon: API error", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Simulation failed", message: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("simulate-polygon: Success");

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("simulate-polygon: Unexpected error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
