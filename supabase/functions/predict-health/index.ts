import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { lat, lon, workforce_size, daily_wage, temp_increase } = await req.json();

    const baseTemp = 28 + (Math.abs(lat) < 15 ? 4 : lat < 25 ? 2 : 0);
    const projectedTemp = baseTemp + (temp_increase ?? 0);

    const wbgt = projectedTemp * 0.7 + 8;

    let productivity_loss_pct = 0;
    if (wbgt > 25) {
      productivity_loss_pct = Math.min(50, Math.round((wbgt - 25) * 5));
    }

    const economic_loss_daily = Math.round(
      (workforce_size ?? 100) * (daily_wage ?? 15) * (productivity_loss_pct / 100)
    );

    let malaria_risk: "High" | "Medium" | "Low" = "Low";
    if (Math.abs(lat) < 25 && projectedTemp >= 22 && projectedTemp <= 33) {
      malaria_risk = projectedTemp >= 25 && projectedTemp <= 30 ? "High" : "Medium";
    }

    let dengue_risk: "High" | "Medium" | "Low" = "Low";
    if (Math.abs(lat) < 35 && projectedTemp >= 20) {
      dengue_risk = projectedTemp >= 25 && projectedTemp <= 35 ? "High" : "Medium";
    }

    return new Response(
      JSON.stringify({
        data: {
          productivity_loss_pct,
          economic_loss_daily,
          wbgt: Math.round(wbgt * 10) / 10,
          projected_temp: Math.round(projectedTemp * 10) / 10,
          malaria_risk,
          dengue_risk,
          workforce_size: workforce_size ?? 100,
          daily_wage: daily_wage ?? 15,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Health prediction error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
