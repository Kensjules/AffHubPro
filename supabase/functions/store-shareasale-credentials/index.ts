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

    // Use service role key for server-side credential storage
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate user from their token
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    const { merchantId, apiToken, apiSecret } = await req.json();

    // Validate input
    if (!merchantId || !apiToken || !apiSecret) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate credential format
    if (
      typeof merchantId !== 'string' || merchantId.length < 3 || merchantId.length > 50 ||
      typeof apiToken !== 'string' || apiToken.length < 10 || apiToken.length > 200 ||
      typeof apiSecret !== 'string' || apiSecret.length < 10 || apiSecret.length > 200
    ) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credential format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store credentials using service role (bypasses RLS for secure storage)
    // The credentials are stored server-side only - never exposed to client
    const { data, error } = await supabaseAdmin
      .from("shareasale_accounts")
      .upsert({
        user_id: userId,
        merchant_id: merchantId.trim(),
        api_token_encrypted: apiToken.trim(),
        api_secret_encrypted: apiSecret.trim(),
        is_connected: true,
        sync_status: "pending",
      }, {
        onConflict: "user_id"
      })
      .select("id, user_id, merchant_id, is_connected, last_sync_at, sync_status, created_at, updated_at")
      .single();

    if (error) {
      console.error("Failed to store credentials");
      return new Response(
        JSON.stringify({ success: false, message: "Failed to store credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Store credentials error");
    return new Response(
      JSON.stringify({ success: false, message: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
