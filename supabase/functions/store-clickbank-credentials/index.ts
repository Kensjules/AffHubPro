import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
    }

    // Validate user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
    }

    const userId = claimsData.claims.sub;
    const body = await req.json();
    const { clerkApiKey, devApiKey, nickname, testOnly } = body;

    // Validate inputs
    if (!clerkApiKey || typeof clerkApiKey !== "string" || clerkApiKey.length < 10 || clerkApiKey.length > 500) {
      return new Response(JSON.stringify({ success: false, message: "Invalid Clerk API Key format" }), { status: 400, headers: jsonHeaders });
    }
    if (!devApiKey || typeof devApiKey !== "string" || devApiKey.length < 10 || devApiKey.length > 500) {
      return new Response(JSON.stringify({ success: false, message: "Invalid Developer API Key format" }), { status: 400, headers: jsonHeaders });
    }

    // Test connection by calling ClickBank API
    try {
      const testUrl = "https://api.clickbank.com/rest/1.3/orders/list";
      const testResponse = await fetch(testUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `${devApiKey.trim()}:${clerkApiKey.trim()}`,
        },
      });

      if (testResponse.status === 401 || testResponse.status === 403) {
        await testResponse.text();
        return new Response(
          JSON.stringify({ success: false, message: "Invalid API credentials. Please check your keys." }),
          { status: 200, headers: jsonHeaders }
        );
      }

      // Consume body
      await testResponse.text();
    } catch (fetchError) {
      console.error("ClickBank API test error:", fetchError);
      return new Response(
        JSON.stringify({ success: false, message: "Could not reach ClickBank API. Please try again." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // If test only, return success without storing
    if (testOnly) {
      return new Response(
        JSON.stringify({ success: true, message: "Connection verified successfully!" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Validate nickname for storage
    if (!nickname || typeof nickname !== "string" || nickname.trim().length < 1 || nickname.trim().length > 100) {
      return new Response(JSON.stringify({ success: false, message: "Nickname is required (max 100 chars)" }), { status: 400, headers: jsonHeaders });
    }

    // Store credentials using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for existing clickbank integration
    const { data: existing } = await supabaseAdmin
      .from("user_integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("integration_type", "clickbank")
      .maybeSingle();

    let data, error;

    if (existing) {
      const result = await supabaseAdmin
        .from("user_integrations")
        .update({
          nickname: nickname.trim(),
          api_token_encrypted: clerkApiKey.trim(),
          api_secret_encrypted: devApiKey.trim(),
          is_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id, user_id, nickname, is_connected, last_sync_at")
        .single();

      data = result.data;
      error = result.error;
    } else {
      const result = await supabaseAdmin
        .from("user_integrations")
        .insert({
          user_id: userId,
          integration_type: "clickbank",
          nickname: nickname.trim(),
          api_token_encrypted: clerkApiKey.trim(),
          api_secret_encrypted: devApiKey.trim(),
          is_connected: true,
        })
        .select("id, user_id, nickname, is_connected, last_sync_at")
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Failed to store ClickBank credentials");
      return new Response(JSON.stringify({ success: false, message: "Failed to store credentials" }), { status: 500, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: jsonHeaders });
  } catch (error) {
    console.error("Store ClickBank credentials error");
    return new Response(JSON.stringify({ success: false, message: "Internal error" }), { status: 500, headers: jsonHeaders });
  }
});
