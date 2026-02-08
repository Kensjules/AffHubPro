import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// 24 hours in milliseconds
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const { url, linkId } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ status: "unknown", error: "URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    let httpCode = 0;
    let finalUrl = url;

    try {
      // Try HEAD first (faster, less bandwidth)
      response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });
      httpCode = response.status;
      finalUrl = response.url;
    } catch (headError) {
      // Fallback to GET if HEAD is blocked
      try {
        response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
        });
        httpCode = response.status;
        finalUrl = response.url;
      } catch (getError) {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;

        // Network error or timeout
        return new Response(
          JSON.stringify({
            status: "error",
            httpCode: 0,
            responseTime,
            finalUrl: url,
            error: getError instanceof Error ? getError.message : "Network error",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;

    // Determine status based on HTTP code
    let newStatus: "active" | "error" | "unknown" = "unknown";
    if (httpCode >= 200 && httpCode < 400) {
      newStatus = "active";
    } else if (httpCode === 404 || httpCode === 410 || httpCode >= 500) {
      newStatus = "error";
    } else if (httpCode >= 400) {
      newStatus = "error";
    }

    // If linkId is provided, check for status changes and send alerts
    let alertSent = false;
    let alertType: "link_broken" | "link_recovered" | null = null;

    if (linkId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch current link data to detect status change
      const { data: currentLink, error: fetchError } = await supabase
        .from("affiliate_links")
        .select("status, last_alert_sent_at, merchant_name, user_id")
        .eq("id", linkId)
        .maybeSingle();

      if (!fetchError && currentLink) {
        const previousStatus = currentLink.status;
        const lastAlertAt = currentLink.last_alert_sent_at;
        const merchantName = currentLink.merchant_name || "Unknown Merchant";
        const userId = currentLink.user_id;

        // Check if we can send an alert (24h cooldown)
        const canSendAlert = !lastAlertAt || 
          (Date.now() - new Date(lastAlertAt).getTime() > ALERT_COOLDOWN_MS);

        // Determine if we should send an alert
        const isBreakingChange = previousStatus === "active" && newStatus === "error";
        const isRecovery = previousStatus === "error" && newStatus === "active";

        if (canSendAlert && (isBreakingChange || isRecovery)) {
          // Fetch user email from profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .maybeSingle();

          if (profile?.email) {
            alertType = isBreakingChange ? "link_broken" : "link_recovered";

            try {
              // Call send-email function
              const emailResponse = await fetch(
                `${SUPABASE_URL}/functions/v1/send-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  },
                  body: JSON.stringify({
                    type: alertType,
                    to: profile.email,
                    data: {
                      merchantName,
                      httpCode,
                      url,
                    },
                  }),
                }
              );

              if (emailResponse.ok) {
                alertSent = true;
                console.log(`Alert email sent: ${alertType} to ${profile.email}`);

                // Update last_alert_sent_at timestamp
                await supabase
                  .from("affiliate_links")
                  .update({ last_alert_sent_at: new Date().toISOString() })
                  .eq("id", linkId);
              } else {
                const errorData = await emailResponse.json();
                console.error("Failed to send alert email:", errorData);
              }
            } catch (emailError) {
              // Log error but don't block the scan result
              console.error("Error sending alert email:", emailError);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: newStatus,
        httpCode,
        responseTime,
        finalUrl,
        alertSent,
        alertType,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
