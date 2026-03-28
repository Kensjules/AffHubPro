import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all active integrations
    const { data: integrations, error: fetchError } = await supabaseAdmin
      .from("user_integrations")
      .select("id, user_id, integration_type, publisher_id, api_token_encrypted, api_secret_encrypted, nickname")
      .eq("is_connected", true);

    if (fetchError) {
      console.error("Failed to fetch integrations:", fetchError.message);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to fetch integrations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active integrations to sync", synced: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; type: string; success: boolean; error?: string }[] = [];

    for (const integration of integrations) {
      try {
        if (integration.integration_type === "clickbank") {
          await syncClickBank(supabaseAdmin, integration);
          results.push({ id: integration.id, type: "clickbank", success: true });
        } else if (integration.integration_type === "awin") {
          // Awin sync — update last_sync_at (actual API fetch can be expanded)
          await supabaseAdmin
            .from("user_integrations")
            .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("id", integration.id);
          results.push({ id: integration.id, type: "awin", success: true });
        }
      } catch (err: any) {
        console.error(`Sync failed for integration ${integration.id}:`, err.message);
        results.push({ id: integration.id, type: integration.integration_type, success: false, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: results.filter(r => r.success).length, total: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Sync all accounts error:", error.message);
    return new Response(
      JSON.stringify({ success: false, message: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function syncClickBank(
  supabase: any,
  integration: { id: string; user_id: string; api_token_encrypted: string | null; api_secret_encrypted: string | null }
) {
  const clerkKey = integration.api_token_encrypted;
  const devKey = integration.api_secret_encrypted;

  if (!clerkKey || !devKey) {
    throw new Error("Missing ClickBank credentials");
  }

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const apiUrl = `https://api.clickbank.com/rest/1.3/orders/list?startDate=${startDate}&endDate=${endDate}`;

  const response = await fetch(apiUrl, {
    headers: {
      "Accept": "application/json",
      "Authorization": `${devKey}:${clerkKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`ClickBank API returned ${response.status}`);
  }

  const data = await response.json();
  const orders = data?.orderData || [];

  for (const order of orders) {
    const transactionId = order.receipt || `cb-${order.transactionTime}-${Math.random().toString(36).slice(2, 8)}`;

    await supabase
      .from("transactions_cache")
      .upsert(
        {
          user_id: integration.user_id,
          shareasale_account_id: integration.id,
          transaction_id: transactionId,
          amount: parseFloat(order.totalOrderAmount || order.amount || "0"),
          commission: parseFloat(order.totalOrderAmount || order.amount || "0"),
          status: order.status || "completed",
          transaction_date: order.transactionTime || new Date().toISOString(),
          merchant_name: order.vendor || order.site || "ClickBank",
        },
        { onConflict: "transaction_id" }
      );
  }

  // Update last_sync_at
  await supabase
    .from("user_integrations")
    .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", integration.id);
}
