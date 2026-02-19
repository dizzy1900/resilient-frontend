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

  console.log("simulate-finance: Request received");

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
    const crop = String(body.crop ?? body.crop_type ?? "");

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
    if (!crop || crop.length > 50) {
      return new Response(
        JSON.stringify({ error: "Validation failed", message: "crop is required and must be <= 50 chars" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("simulate-finance: Validated", { lat, lon, crop });

    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, crop_type: crop }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("simulate-finance: API error", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Simulation failed", message: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("simulate-finance: Success");

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("simulate-finance: Unexpected error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
