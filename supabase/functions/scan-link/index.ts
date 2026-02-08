import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const { url } = await req.json();

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
    let status: "active" | "error" | "unknown" = "unknown";
    if (httpCode >= 200 && httpCode < 400) {
      status = "active";
    } else if (httpCode === 404 || httpCode === 410 || httpCode >= 500) {
      status = "error";
    } else if (httpCode >= 400) {
      status = "error";
    }

    return new Response(
      JSON.stringify({
        status,
        httpCode,
        responseTime,
        finalUrl,
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
