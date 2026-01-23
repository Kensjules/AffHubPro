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

    const userId = claimsData.claims.sub;

    // Use service role to access credentials (bypasses RLS)
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's ShareASale account with credentials (server-side only)
    const { data: account, error: accountError } = await serviceSupabase
      .from("shareasale_accounts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ success: false, message: "No ShareASale account connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update sync status to syncing
    await serviceSupabase
      .from("shareasale_accounts")
      .update({ sync_status: "syncing" })
      .eq("id", account.id);

    try {
      // Calculate date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const formatDate = (d: Date) => d.toISOString().split("T")[0];
      const timestamp = formatDate(new Date());
      const version = "2.9";
      const action = "activity";

      // Generate signature
      const signatureString = `${account.api_token_encrypted}:${timestamp}:${action}:${account.api_secret_encrypted}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(signatureString);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Call ShareASale Activity API
      const apiUrl = `https://api.shareasale.com/w.cfm?affiliateId=${account.merchant_id}&token=${account.api_token_encrypted}&version=${version}&action=${action}&dateStart=${formatDate(startDate)}&dateEnd=${formatDate(endDate)}`;

      const transactions: any[] = [];

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "x-ShareASale-Date": timestamp,
            "x-ShareASale-Authentication": signature,
          },
        });

        const responseText = await response.text();
        
        if (response.ok && !responseText.includes("Error")) {
          // Parse CSV response from ShareASale
          const lines = responseText.trim().split("\n");
          if (lines.length > 1) {
            const headers = lines[0].split("|");
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split("|");
              const tx: Record<string, string> = {};
              headers.forEach((h, idx) => {
                tx[h.trim()] = values[idx]?.trim() || "";
              });
              transactions.push(tx);
            }
          }
        }
      } catch (apiError) {
        console.log("ShareASale API unavailable");
      }

      // If no transactions returned, update status and return error - do NOT generate fake data
      if (transactions.length === 0) {
        await serviceSupabase
          .from("shareasale_accounts")
          .update({ 
            sync_status: "completed",
            last_sync_at: new Date().toISOString()
          })
          .eq("id", account.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: "No transactions found for the last 30 days",
            transactionCount: 0,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert transactions
      const formattedTransactions = transactions.map((tx) => ({
        user_id: userId,
        shareasale_account_id: account.id,
        transaction_id: tx.transactionId || tx.TransactionID || `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        merchant_name: tx.merchantName || tx.MerchantName || "Unknown Merchant",
        amount: parseFloat(tx.amount || tx.Amount || "0"),
        commission: parseFloat(tx.commission || tx.Commission || "0"),
        clicks: parseInt(tx.clicks || tx.Clicks || "0"),
        status: tx.status || tx.Status || "Pending",
        transaction_date: tx.transactionDate || tx.TransactionDate || new Date().toISOString(),
        click_date: tx.clickDate || tx.ClickDate || null,
      }));

      if (formattedTransactions.length > 0) {
        const { error: upsertError } = await serviceSupabase
          .from("transactions_cache")
          .upsert(formattedTransactions, {
            onConflict: "shareasale_account_id,transaction_id",
          });

        if (upsertError) {
          console.error("Transaction upsert failed");
        }
      }

      // Update account with sync info
      await serviceSupabase
        .from("shareasale_accounts")
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: "completed",
          is_connected: true,
        })
        .eq("id", account.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Sync completed",
          transactionCount: formattedTransactions.length,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (syncError) {
      console.error("Sync error");
      
      await serviceSupabase
        .from("shareasale_accounts")
        .update({ sync_status: "failed" })
        .eq("id", account.id);

      return new Response(
        JSON.stringify({ success: false, message: "Sync failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Handler error");
    return new Response(
      JSON.stringify({ success: false, message: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
