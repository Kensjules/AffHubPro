import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

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

    const { publisherId, apiToken } = await req.json();

    // Validate input
    if (!publisherId || !apiToken) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate credential format
    if (
      typeof publisherId !== 'string' || publisherId.length < 3 || publisherId.length > 50 ||
      typeof apiToken !== 'string' || apiToken.length < 10 || apiToken.length > 500
    ) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credential format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if integration already exists
    const { data: existing } = await supabaseAdmin
      .from("user_integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("integration_type", "awin")
      .maybeSingle();

    let data;
    let error;

    if (existing) {
      // Update existing integration
      const result = await supabaseAdmin
        .from("user_integrations")
        .update({
          publisher_id: publisherId.trim(),
          api_token_encrypted: apiToken.trim(),
          is_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id, user_id, publisher_id, is_connected, last_sync_at, created_at, updated_at")
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new integration
      const result = await supabaseAdmin
        .from("user_integrations")
        .insert({
          user_id: userId,
          integration_type: "awin",
          publisher_id: publisherId.trim(),
          api_token_encrypted: apiToken.trim(),
          is_connected: true,
        })
        .select("id, user_id, publisher_id, is_connected, last_sync_at, created_at, updated_at")
        .single();
      
      data = result.data;
      error = result.error;
    }

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
