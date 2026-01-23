import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface EmailRequest {
  type: "welcome" | "password_reset" | "sync_failed";
  to: string;
  data?: {
    name?: string;
    resetLink?: string;
  };
}

const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to AffiliateHub! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; }
            h1 { color: #ffffff; margin: 0 0 8px; }
            p { color: #a1a1aa; line-height: 1.6; }
            .cta { display: inline-block; background: linear-gradient(135deg, #a855f7, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 24px; }
            .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to AffiliateHub!</h1>
            </div>
            <p>Hey ${name || "there"},</p>
            <p>Thanks for signing up! We're excited to help you track and optimize your affiliate marketing performance.</p>
            <p>Here's what you can do next:</p>
            <ul style="color: #a1a1aa;">
              <li>Connect your ShareASale account</li>
              <li>View your earnings dashboard</li>
              <li>Export transaction reports</li>
            </ul>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AffiliateHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  password_reset: (resetLink: string) => ({
    subject: "Reset your AffiliateHub password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #ffffff; margin: 0 0 8px; }
            p { color: #a1a1aa; line-height: 1.6; }
            .cta { display: inline-block; background: linear-gradient(135deg, #a855f7, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 24px; }
            .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password Reset</h1>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <a href="${resetLink}" class="cta">Reset Password</a>
            <p style="margin-top: 24px; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AffiliateHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  sync_failed: () => ({
    subject: "ShareASale sync failed - Action required",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #ffffff; margin: 0 0 8px; }
            p { color: #a1a1aa; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Sync Failed</h1>
            <p>We were unable to sync your ShareASale data. This could be due to expired API credentials, ShareASale API downtime, or network issues.</p>
            <p>Please check your credentials and try again.</p>
          </div>
        </body>
      </html>
    `,
  }),
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const { type, to, data }: EmailRequest = await req.json();

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailContent;
    switch (type) {
      case "welcome":
        emailContent = emailTemplates.welcome(data?.name || "");
        break;
      case "password_reset":
        emailContent = emailTemplates.password_reset(data?.resetLink || "");
        break;
      case "sync_failed":
        emailContent = emailTemplates.sync_failed();
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid email type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Send email via Resend REST API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AffiliateHub <onboarding@resend.dev>",
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const result = await response.json();
    console.log("Email sent:", result);

    if (!response.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Email error");
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
