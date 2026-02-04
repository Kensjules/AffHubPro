import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AffiliateLink {
  id: string;
  url: string;
  merchant_name: string | null;
  network: string;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's affiliate links (limit to 50 for rate limiting)
    const { data: links, error: fetchError } = await supabase
      .from("affiliate_links")
      .select("id, url, merchant_name, network, status")
      .eq("user_id", user.id)
      .neq("status", "ignored")
      .limit(50);

    if (fetchError) {
      console.error("Error fetching links:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch links" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!links || links.length === 0) {
      return new Response(
        JSON.stringify({ message: "No links to scan", scanned: 0, broken: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = {
      scanned: 0,
      broken: 0,
      recovered: 0,
      errors: [] as string[],
    };

    // Check each link
    for (const link of links as AffiliateLink[]) {
      try {
        results.scanned++;

        // Perform HEAD request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        let httpStatus = 0;
        let isBroken = false;

        try {
          const response = await fetch(link.url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
          });
          clearTimeout(timeoutId);
          httpStatus = response.status;
          isBroken = httpStatus === 404 || httpStatus === 410;
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          // Network error or timeout - mark as potentially broken
          httpStatus = 0;
          isBroken = true;
        }

        // Update link status
        const newStatus = isBroken ? "broken" : "active";
        
        // Generate recovery suggestion for broken links
        let recoverySuggestion: string | null = null;
        if (isBroken && link.merchant_name) {
          // Simple suggestion: search for alternative link from same merchant
          recoverySuggestion = `Search for updated ${link.merchant_name} affiliate link on ${link.network}`;
        }

        await supabase
          .from("affiliate_links")
          .update({
            status: newStatus,
            http_status_code: httpStatus || null,
            last_checked_at: new Date().toISOString(),
            recovery_suggestion: isBroken ? recoverySuggestion : null,
          })
          .eq("id", link.id);

        if (isBroken) {
          results.broken++;
        }

        // Rate limiting: wait 500ms between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (linkError) {
        console.error(`Error checking link ${link.id}:`, linkError);
        results.errors.push(link.id);
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scan error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
