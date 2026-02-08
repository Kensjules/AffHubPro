import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface EmailRequest {
  type: "welcome" | "password_reset" | "sync_failed" | "link_broken" | "link_recovered";
  to: string;
  data?: {
    name?: string;
    resetLink?: string;
    merchantName?: string;
    httpCode?: number;
    url?: string;
  };
}

const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to the Future of Your Affiliate Business! 🚀",
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
            .logo { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
            .logo-accent { color: #d4af37; }
            .content { padding: 40px; }
            h1 { color: #ffffff; font-size: 26px; font-weight: 600; margin: 0 0 16px; line-height: 1.3; }
            .gold-text { color: #d4af37; }
            p { color: #94a3b8; font-size: 16px; line-height: 1.7; margin: 0 0 16px; }
            .highlight-box { background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 12px; padding: 24px; margin: 24px 0; }
            .highlight-box p { margin: 0; color: #e2e8f0; }
            .feature-list { margin: 24px 0; padding: 0; list-style: none; }
            .feature-list li { color: #cbd5e1; font-size: 15px; padding: 10px 0; padding-left: 28px; position: relative; }
            .feature-list li::before { content: "✓"; position: absolute; left: 0; color: #d4af37; font-weight: 600; }
            .cta-wrapper { text-align: center; margin: 32px 0 16px; }
            .cta { display: inline-block; background: linear-gradient(135deg, #d4af37, #c5a028); color: #0a0a0a !important; font-weight: 600; font-size: 16px; padding: 16px 36px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3); }
            .divider { height: 1px; background: rgba(212, 175, 55, 0.1); margin: 32px 0; }
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
                
                <div class="divider"></div>
                <p style="font-size: 14px; text-align: center;">Need help getting started? We've got your back. Just reply to this email or check out our getting started guide.</p>
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
    subject: "Reset Your AffHubPro Password",
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
            .logo { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
            .logo-accent { color: #d4af37; }
            .content { padding: 40px; }
            h1 { color: #ffffff; font-size: 26px; font-weight: 600; margin: 0 0 16px; line-height: 1.3; }
            .gold-text { color: #d4af37; }
            p { color: #94a3b8; font-size: 16px; line-height: 1.7; margin: 0 0 16px; }
            .security-box { background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
            .security-box p { margin: 0; color: #93c5fd; font-size: 14px; }
            .cta-wrapper { text-align: center; margin: 32px 0 16px; }
            .cta { display: inline-block; background: linear-gradient(135deg, #d4af37, #c5a028); color: #0a0a0a !important; font-weight: 600; font-size: 16px; padding: 16px 36px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3); }
            .link-fallback { margin-top: 24px; padding: 16px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; }
            .link-fallback p { font-size: 13px; color: #64748b; margin: 0 0 8px; }
            .link-fallback a { color: #d4af37; word-break: break-all; font-size: 12px; }
            .divider { height: 1px; background: rgba(212, 175, 55, 0.1); margin: 32px 0; }
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
                <h1>Reset Your <span class="gold-text">Password</span></h1>
                <p>We received a request to reset your AffHubPro password. Click the button below to create a new password:</p>
                
                <div class="cta-wrapper">
                  <a href="${resetLink}" class="cta">Reset My Password →</a>
                </div>
                
                <div class="security-box">
                  <p>🔒 <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email—your password won't be changed.</p>
                </div>
                
                <div class="link-fallback">
                  <p>Button not working? Copy and paste this link into your browser:</p>
                  <a href="${resetLink}">${resetLink}</a>
                </div>
                
                <div class="divider"></div>
                <p style="font-size: 14px; text-align: center;">If you're having trouble, contact us at <a href="mailto:jules@affhubpro.com" style="color: #d4af37; text-decoration: none;">jules@affhubpro.com</a></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} AffHubPro. All rights reserved.</p>
                <p style="margin-top: 8px;"><a href="https://affhubpro.com">affhubpro.com</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  sync_failed: () => ({
    subject: "⚠️ ShareASale Sync Failed - Action Required",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background: #0a0a0a; }
            .wrapper { background: linear-gradient(180deg, #0a0a0a 0%, #0f172a 100%); padding: 48px 24px; }
            .container { max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9)); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05)); padding: 32px 40px; text-align: center; border-bottom: 1px solid rgba(239, 68, 68, 0.1); }
            .logo { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
            .logo-accent { color: #d4af37; }
            .content { padding: 40px; }
            h1 { color: #ffffff; font-size: 26px; font-weight: 600; margin: 0 0 16px; line-height: 1.3; }
            .error-text { color: #f87171; }
            p { color: #94a3b8; font-size: 16px; line-height: 1.7; margin: 0 0 16px; }
            .alert-box { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
            .alert-box p { margin: 0; color: #fca5a5; }
            .cta-wrapper { text-align: center; margin: 32px 0 16px; }
            .cta { display: inline-block; background: linear-gradient(135deg, #d4af37, #c5a028); color: #0a0a0a !important; font-weight: 600; font-size: 16px; padding: 16px 36px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3); }
            .footer { background: rgba(15, 23, 42, 0.5); padding: 24px 40px; text-align: center; border-top: 1px solid rgba(239, 68, 68, 0.1); }
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
                <h1><span class="error-text">Sync Failed</span> - Action Required</h1>
                <p>We were unable to sync your ShareASale data during our last scheduled update.</p>
                
                <div class="alert-box">
                  <p>⚠️ This could be due to expired API credentials, ShareASale API downtime, or connectivity issues.</p>
                </div>
                
                <p>To resolve this issue, please check your ShareASale API credentials in your settings and try syncing again.</p>
                
                <div class="cta-wrapper">
                  <a href="https://affhubpro.com/settings" class="cta">Check Settings →</a>
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} AffHubPro. All rights reserved.</p>
                <p style="margin-top: 8px;">Need help? <a href="mailto:jules@affhubpro.com">Contact Support</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  link_broken: (merchantName: string, httpCode: number, url: string) => ({
    subject: `⚠️ Your Affiliate Link is Broken – ${merchantName || "Unknown Merchant"}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background: #0a0a0a; }
            .wrapper { background: linear-gradient(180deg, #0a0a0a 0%, #0f172a 100%); padding: 48px 24px; }
            .container { max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9)); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.05)); padding: 32px 40px; text-align: center; border-bottom: 1px solid rgba(248, 113, 113, 0.1); }
            .logo { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
            .logo-accent { color: #d4af37; }
            .content { padding: 40px; }
            h1 { color: #ffffff; font-size: 26px; font-weight: 600; margin: 0 0 16px; line-height: 1.3; }
            .error-text { color: #f87171; }
            p { color: #94a3b8; font-size: 16px; line-height: 1.7; margin: 0 0 16px; }
            .alert-box { background: rgba(248, 113, 113, 0.08); border: 1px solid rgba(248, 113, 113, 0.15); border-radius: 12px; padding: 24px; margin: 24px 0; }
            .alert-box p { margin: 0; color: #fca5a5; }
            .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.1); }
            .info-label { color: #64748b; font-size: 14px; }
            .info-value { color: #e2e8f0; font-size: 14px; font-weight: 500; }
            .cta-wrapper { text-align: center; margin: 32px 0 16px; }
            .cta { display: inline-block; background: linear-gradient(135deg, #d4af37, #c5a028); color: #0a0a0a !important; font-weight: 600; font-size: 16px; padding: 16px 36px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3); }
            .divider { height: 1px; background: rgba(248, 113, 113, 0.1); margin: 32px 0; }
            .footer { background: rgba(15, 23, 42, 0.5); padding: 24px 40px; text-align: center; border-top: 1px solid rgba(248, 113, 113, 0.1); }
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
                <h1><span class="error-text">⚠️ Broken Link Detected</span></h1>
                <p>One of your affiliate links is no longer working. This could be affecting your commissions.</p>
                
                <div class="alert-box">
                  <p><strong style="color: #f87171;">Merchant:</strong> ${merchantName || "Unknown Merchant"}</p>
                  <p style="margin-top: 12px;"><strong style="color: #f87171;">HTTP Status:</strong> ${httpCode || "Unknown"}</p>
                  ${url ? `<p style="margin-top: 12px; word-break: break-all;"><strong style="color: #f87171;">URL:</strong> ${url}</p>` : ""}
                </div>
                
                <p><strong style="color: #e2e8f0;">Recommended Actions:</strong></p>
                <ul style="color: #94a3b8; padding-left: 20px; margin: 16px 0;">
                  <li style="margin-bottom: 8px;">Check if the merchant program is still active</li>
                  <li style="margin-bottom: 8px;">Verify your affiliate account status</li>
                  <li style="margin-bottom: 8px;">Update the link if the URL has changed</li>
                </ul>
                
                <div class="cta-wrapper">
                  <a href="https://affhubpro.com/settings" class="cta">Check Link Status →</a>
                </div>
                
                <div class="divider"></div>
                <p style="font-size: 14px; text-align: center; color: #64748b;">You won't receive another alert for this link for 24 hours.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} AffHubPro. All rights reserved.</p>
                <p style="margin-top: 8px;">Need help? <a href="mailto:jules@affhubpro.com">Contact Support</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  link_recovered: (merchantName: string, url: string) => ({
    subject: `✅ Good News – Your Affiliate Link is Back Online`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background: #0a0a0a; }
            .wrapper { background: linear-gradient(180deg, #0a0a0a 0%, #0f172a 100%); padding: 48px 24px; }
            .container { max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9)); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05)); padding: 32px 40px; text-align: center; border-bottom: 1px solid rgba(34, 197, 94, 0.1); }
            .logo { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
            .logo-accent { color: #d4af37; }
            .content { padding: 40px; }
            h1 { color: #ffffff; font-size: 26px; font-weight: 600; margin: 0 0 16px; line-height: 1.3; }
            .success-text { color: #22c55e; }
            p { color: #94a3b8; font-size: 16px; line-height: 1.7; margin: 0 0 16px; }
            .success-box { background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.15); border-radius: 12px; padding: 24px; margin: 24px 0; }
            .success-box p { margin: 0; color: #86efac; }
            .cta-wrapper { text-align: center; margin: 32px 0 16px; }
            .cta { display: inline-block; background: linear-gradient(135deg, #d4af37, #c5a028); color: #0a0a0a !important; font-weight: 600; font-size: 16px; padding: 16px 36px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3); }
            .divider { height: 1px; background: rgba(34, 197, 94, 0.1); margin: 32px 0; }
            .footer { background: rgba(15, 23, 42, 0.5); padding: 24px 40px; text-align: center; border-top: 1px solid rgba(34, 197, 94, 0.1); }
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
                <h1><span class="success-text">✅ Link Recovered!</span></h1>
                <p>Great news! Your affiliate link is back online and working properly.</p>
                
                <div class="success-box">
                  <p><strong style="color: #22c55e;">Merchant:</strong> ${merchantName || "Unknown Merchant"}</p>
                  <p style="margin-top: 12px;"><strong style="color: #22c55e;">Status:</strong> Active ✓</p>
                  ${url ? `<p style="margin-top: 12px; word-break: break-all;"><strong style="color: #22c55e;">URL:</strong> ${url}</p>` : ""}
                </div>
                
                <p>Your commissions are now flowing again. No action needed on your part.</p>
                
                <div class="cta-wrapper">
                  <a href="https://affhubpro.com/settings" class="cta">View Link Vault →</a>
                </div>
                
                <div class="divider"></div>
                <p style="font-size: 14px; text-align: center; color: #64748b;">Thanks for keeping your links healthy! 🚀</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} AffHubPro. All rights reserved.</p>
                <p style="margin-top: 8px;"><a href="https://affhubpro.com">affhubpro.com</a></p>
              </div>
            </div>
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
      case "link_broken":
        emailContent = emailTemplates.link_broken(
          data?.merchantName || "Unknown Merchant",
          data?.httpCode || 0,
          data?.url || ""
        );
        break;
      case "link_recovered":
        emailContent = emailTemplates.link_recovered(
          data?.merchantName || "Unknown Merchant",
          data?.url || ""
        );
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
