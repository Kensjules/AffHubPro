// Shared CORS configuration with origin validation
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  
  // Allowed origins for the application
  const allowedOrigins = [
    // Production custom domain
    "https://affhubpro.com",
    "https://www.affhubpro.com",
    // Lovable preview URLs
    "https://id-preview--77fd7ca0-a1c1-4217-8651-093413cd8088.lovable.app",
    // Supabase URL
    Deno.env.get("SUPABASE_URL") || "",
    // Development
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ].filter(Boolean);

  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.endsWith(".lovable.app"));
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Handle OPTIONS preflight requests
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}
