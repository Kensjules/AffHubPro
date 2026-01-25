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
    subject: "Welcome to the Future of Affiliate Management!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background: #0a0a0a; }
            .wrapper { background: linear-gradient(180deg, #0a0a0a 0%, #0f172a 100%); padding: 48px 24px; }
            .container { max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9)); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05)); padding: 32px 40px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.1); }
            .logo { font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
            .logo-accent { background: linear-gradient(135deg, #d4af37, #f4d03f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .content { padding: 40px; }
            h1 { color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 16px; line-height: 1.3; }
            .gold-text { color: #d4af37; }
            p { color: #94a3b8; font-size: 16px; line-height: 1.7; margin: 0 0 16px; }
            .highlight-box { background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 12px; padding: 24px; margin: 24px 0; }
            .highlight-box p { margin: 0; color: #e2e8f0; }
            .feature-list { margin: 24px 0; padding: 0; list-style: none; }
            .feature-list li { color: #cbd5e1; font-size: 15px; padding: 8px 0; padding-left: 28px; position: relative; }
            .feature-list li::before { content: "✓"; position: absolute; left: 0; color: #d4af37; font-weight: 600; }
            .cta-wrapper { text-align: center; margin: 32px 0 16px; }
            .cta { display: inline-block; background: linear-gradient(135deg, #d4af37, #c5a028); color: #0a0a0a; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3); }
            .cta:hover { background: linear-gradient(135deg, #e4bf47, #d4af37); }
            .footer { background: rgba(15, 23, 42, 0.5); padding: 24px 40px; text-align: center; border-top: 1px solid rgba(212, 175, 55, 0.1); }
            .footer p { color: #64748b; font-size: 13px; margin: 0; }
            .footer a { color: #d4af37; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <div class="logo">Aff<span class="logo-accent">Hub</span>Pro</div>
              </div>
              <div class="content">
                <h1>Welcome to the Future, <span class="gold-text">${name || "Partner"}</span>!</h1>
                <p>You've just joined the most powerful affiliate management platform on the market. We're thrilled to have you on board.</p>
                
                <div class="highlight-box">
                  <p>🚀 <strong style="color: #d4af37;">Your dashboard is now active</strong> and ready for you to explore. Connect your affiliate accounts and start tracking your earnings in real-time.</p>
                </div>
                
                <p>Here's what you can do right now:</p>
                <ul class="feature-list">
                  <li>Connect your ShareASale account in seconds</li>
                  <li>View real-time revenue analytics</li>
                  <li>Export detailed transaction reports</li>
                  <li>Track performance across all your stores</li>
                </ul>
                
                <div class="cta-wrapper">
                  <a href="https://affhubpro.com/dashboard" class="cta">Go to Your Dashboard →</a>
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} AffHubPro. All rights reserved.</p>
                <p style="margin-top: 8px;">Questions? <a href="mailto:jules@affhubpro.com">Contact Support</a></p>
              </div>
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
        from: "Jules from AffHubPro <jules@affhubpro.com>",
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
