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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get ClickBank credentials
    const { data: integration, error: intError } = await supabaseAdmin
      .from("user_integrations")
      .select("id, api_token_encrypted, api_secret_encrypted")
      .eq("user_id", userId)
      .eq("integration_type", "clickbank")
      .eq("is_connected", true)
      .maybeSingle();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ success: false, message: "No active ClickBank integration found" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const clerkKey = integration.api_token_encrypted;
    const devKey = integration.api_secret_encrypted;

    // Fetch orders from last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const apiUrl = `https://api.clickbank.com/rest/1.3/orders/list?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;

    console.log("Fetching ClickBank orders...");

    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
        "Authorization": `${devKey}:${clerkKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ClickBank API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, message: `ClickBank API returned status ${response.status}` }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const responseText = await response.text();
    let orders: any[] = [];

    try {
      const parsed = JSON.parse(responseText);
      // ClickBank returns { orderData: [...] } or similar structure
      if (parsed.orderData) {
        orders = Array.isArray(parsed.orderData) ? parsed.orderData : [parsed.orderData];
      } else if (Array.isArray(parsed)) {
        orders = parsed;
      }
    } catch {
      console.log("Response is not JSON, attempting XML parse or empty result");
      orders = [];
    }

    let upsertedCount = 0;
    const vendorNames = new Set<string>();

    for (const order of orders) {
      const receipt = order.receipt || order.transactionId || order.txnId;
      if (!receipt) continue;

      const vendorName = order.vendor || order.vendorNickName || "ClickBank";
      vendorNames.add(vendorName);

      const transactionData = {
        user_id: userId,
        shareasale_account_id: integration.id,
        transaction_id: `cb_${receipt}`,
        merchant_name: vendorName,
        amount: parseFloat(order.totalOrderAmount || order.amount || "0"),
        commission: parseFloat(order.totalAccountAmount || order.commission || "0"),
        status: order.status || order.txnType || "completed",
        transaction_date: order.transactionTime || order.date || new Date().toISOString(),
      };

      const { error: upsertError } = await supabaseAdmin
        .from("transactions_cache")
        .upsert(transactionData, { onConflict: "transaction_id,user_id" });

      if (!upsertError) upsertedCount++;
    }

    // Add vendor names to custom_brands
    for (const name of vendorNames) {
      await supabaseAdmin
        .from("custom_brands")
        .upsert(
          { user_id: userId, name },
          { onConflict: "user_id,name" }
        );
    }

    // Update last_sync_at
    await supabaseAdmin
      .from("user_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    console.log(`Synced ${upsertedCount} ClickBank transactions`);

    return new Response(
      JSON.stringify({ success: true, synced: upsertedCount, total: orders.length }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("Sync ClickBank error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal sync error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
