import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { merchantId, apiToken, apiSecret } = await req.json();

    if (!merchantId || !apiToken || !apiSecret) {
      return new Response(
        JSON.stringify({ valid: false, message: "Missing required credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate credentials format
    if (merchantId.length < 3 || apiToken.length < 10 || apiSecret.length < 10) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid credential format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create ShareASale API signature
    const timestamp = new Date().toISOString().split("T")[0];
    const version = "2.9";
    const action = "merchantTimespan";
    
    // Generate signature: Token + ":" + DateStamp + ":" + Action + ":" + ApiSecret
    const signatureString = `${apiToken}:${timestamp}:${action}:${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Call ShareASale API to validate
    const apiUrl = `https://api.shareasale.com/w.cfm?affiliateId=${merchantId}&token=${apiToken}&version=${version}&action=${action}&dateStart=${timestamp}&dateEnd=${timestamp}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-ShareASale-Date": timestamp,
          "x-ShareASale-Authentication": signature,
        },
      });

      const responseText = await response.text();

      // Check for error responses from ShareASale
      if (responseText.includes("Error") || responseText.includes("Invalid") || response.status !== 200) {
        console.log("ShareASale validation failed");
        return new Response(
          JSON.stringify({ 
            valid: false, 
            message: "Could not validate credentials. Please check your Merchant ID, API Token, and API Secret." 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, message: "Credentials validated successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (apiError) {
      console.error("ShareASale API connection failed");
      // Do NOT accept credentials when API is unreachable - require successful validation
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: "Unable to reach ShareASale API. Please try again later." 
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ valid: false, message: "Validation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
