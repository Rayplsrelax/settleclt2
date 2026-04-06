/**
 * Email Notification Service
 * 
 * Currently uses the built-in notifyOwner for admin-facing emails.
 * For user-facing emails, this module provides templates and a send function
 * that can be connected to Resend, Mailgun, or any transactional email provider.
 * 
 * To enable user emails:
 * 1. Add RESEND_API_KEY or MAILGUN_API_KEY to secrets
 * 2. Uncomment the sendUserEmail implementation below
 * 3. The notification-service.ts will automatically use it
 */

import { notifyOwner } from "./_core/notification";

// ─── Email Templates ─────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0; }
    .body { padding: 32px 24px; }
    .body h2 { color: #1a1a1a; font-size: 20px; margin: 0 0 16px; }
    .body p { color: #4a4a4a; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .cta { display: inline-block; background: #0f766e; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .footer { padding: 24px; text-align: center; border-top: 1px solid #e5e5e5; }
    .footer p { color: #999; font-size: 12px; margin: 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef9c3; color: #854d0e; }
    .badge-info { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Settle CLT</h1>
      <p>Your Charlotte Community Guide</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Settle CLT &mdash; Helping you discover Charlotte, NC</p>
      <p style="margin-top: 8px;"><a href="https://settleclt.com/notifications" style="color: #0f766e; text-decoration: none;">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

export const emailTemplates = {
  claimApproved: (businessName: string) => ({
    subject: `Your claim for "${businessName}" has been approved!`,
    html: baseTemplate(`
      <h2>Great news! 🎉</h2>
      <p>Your business claim for <strong>${businessName}</strong> has been approved. You can now manage your listing, respond to reviews, and upgrade to a premium tier for more visibility.</p>
      <a href="https://settleclt.com/my-business" class="cta">Manage Your Business</a>
      <p>Premium listings get priority placement in search results, featured badges, and analytics on views and clicks.</p>
    `),
  }),

  claimRejected: (businessName: string, reason?: string) => ({
    subject: `Update on your claim for "${businessName}"`,
    html: baseTemplate(`
      <h2>Claim Update</h2>
      <p>Unfortunately, your claim for <strong>${businessName}</strong> was not approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>You can submit a new claim with additional verification documents. If you believe this was an error, please contact us.</p>
      <a href="https://settleclt.com/contact" class="cta">Contact Support</a>
    `),
  }),

  newReview: (businessName: string, rating: number) => ({
    subject: `New ${rating}-star review on "${businessName}"`,
    html: baseTemplate(`
      <h2>New Review ⭐</h2>
      <p>Someone left a <strong>${rating}-star review</strong> on your business <strong>${businessName}</strong>.</p>
      <a href="https://settleclt.com/my-business" class="cta">View Review</a>
      <p>Responding to reviews helps build trust with potential customers.</p>
    `),
  }),

  paymentSuccess: (tier: string, businessName: string) => ({
    subject: `Payment confirmed — ${tier} tier activated for "${businessName}"`,
    html: baseTemplate(`
      <h2>Payment Successful 💳</h2>
      <p>Your <span class="badge badge-success">${tier}</span> subscription for <strong>${businessName}</strong> is now active!</p>
      <p>Your listing now includes:</p>
      <ul style="color: #4a4a4a; font-size: 15px; line-height: 1.8;">
        ${tier === "Premium" ? "<li>Priority placement in search results</li><li>Featured badge on your listing</li><li>Analytics dashboard with views & clicks</li><li>Photo gallery (up to 10 photos)</li>" : "<li>Featured badge on your listing</li><li>Higher placement in search results</li><li>Basic analytics</li>"}
      </ul>
      <a href="https://settleclt.com/my-business" class="cta">Manage Your Listing</a>
    `),
  }),

  paymentFailed: (businessName: string) => ({
    subject: `Payment failed for "${businessName}" — action needed`,
    html: baseTemplate(`
      <h2>Payment Issue ⚠️</h2>
      <p>We couldn't process your latest payment for <strong>${businessName}</strong>. Your premium features may be affected if the payment isn't resolved.</p>
      <p>Please update your payment method to continue enjoying premium features.</p>
      <a href="https://settleclt.com/my-business" class="cta">Update Payment Method</a>
      <p style="font-size: 13px; color: #999;">Stripe will automatically retry the payment. If you've already resolved this, you can ignore this email.</p>
    `),
  }),

  welcome: (userName: string) => ({
    subject: `Welcome to Settle CLT, ${userName || "neighbor"}!`,
    html: baseTemplate(`
      <h2>Welcome to Charlotte! 🏙️</h2>
      <p>Hey ${userName || "there"}! Thanks for joining Settle CLT — your community guide to Charlotte, NC.</p>
      <p>Here's what you can do:</p>
      <ul style="color: #4a4a4a; font-size: 15px; line-height: 1.8;">
        <li><strong>Explore neighborhoods</strong> — find the perfect area for your lifestyle</li>
        <li><strong>Discover local businesses</strong> — restaurants, shops, services & more</li>
        <li><strong>Earn CLT Passport stamps</strong> — visit places and collect stamps</li>
        <li><strong>Play CLT Bingo</strong> — complete challenges and climb the leaderboard</li>
        <li><strong>Browse events</strong> — find what's happening around Charlotte</li>
      </ul>
      <a href="https://settleclt.com/neighborhoods" class="cta">Start Exploring</a>
    `),
  }),
};

/**
 * Send an email notification to a user.
 * Currently a no-op placeholder — will be activated when an email service is configured.
 * 
 * To activate: Add RESEND_API_KEY to secrets, then uncomment the implementation.
 */
export async function sendUserEmail(
  to: string,
  template: { subject: string; html: string }
): Promise<boolean> {
  // TODO: Activate when email service is configured
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'Settle CLT <hello@settleclt.com>',
  //   to,
  //   subject: template.subject,
  //   html: template.html,
  // });
  
  console.log(`[Email] Would send to ${to}: "${template.subject}" (email service not yet configured)`);
  return false;
}

/**
 * Send an admin notification email via the built-in Manus notification service.
 */
export async function sendAdminEmail(title: string, content: string): Promise<boolean> {
  return notifyOwner({ title, content });
}
