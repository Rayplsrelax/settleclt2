/**
 * Notification Service
 * Central place for triggering notifications across the app.
 * Checks user preferences before sending, and dispatches to in-app, email, and push channels.
 */
import { createNotification, isNotificationEnabled, getUserById, type NotificationCategory } from "./db";
import { notifyOwner } from "./_core/notification";
import { sendUserEmail, emailTemplates } from "./email-notifications";

type NotifyUserParams = {
  userId: number;
  category: NotificationCategory;
  title: string;
  body: string;
  actionUrl?: string;
  icon?: string;
  metadata?: Record<string, any>;
  /** Optional email template to send if email notifications are enabled */
  emailTemplate?: { subject: string; html: string };
};

/**
 * Send a notification to a user, respecting their preferences.
 * Dispatches to in-app, email, and push channels based on user settings.
 */
export async function notifyUser(params: NotifyUserParams): Promise<void> {
  try {
    // Check in-app preference
    const inAppEnabled = await isNotificationEnabled(params.userId, params.category, "inApp");
    if (inAppEnabled) {
      await createNotification(params);
    }

    // Email notifications
    if (params.emailTemplate) {
      const emailEnabled = await isNotificationEnabled(params.userId, params.category, "email");
      if (emailEnabled) {
        try {
          const user = await getUserById(params.userId);
          if (user?.email) {
            await sendUserEmail(user.email, params.emailTemplate);
          }
        } catch (e) {
          console.error("[NotificationService] Email send failed:", e);
        }
      }
    }

    // Push notifications would go here (check push preference)
    // const pushEnabled = await isNotificationEnabled(params.userId, params.category, "push");
    // if (pushEnabled) { ... }
  } catch (err) {
    console.error("[NotificationService] Failed to notify user:", params.userId, err);
  }
}

/**
 * Notify the site owner (admin) about important events.
 * Uses the built-in Manus notification service.
 */
export async function notifyAdmin(title: string, content: string): Promise<void> {
  try {
    await notifyOwner({ title, content });
  } catch (err) {
    console.error("[NotificationService] Failed to notify admin:", err);
  }
}

// ─── Pre-built notification triggers ─────────────────────────────

/** Notify user when their business claim is approved */
export async function notifyClaimApproved(userId: number, businessName: string, serviceKey: string) {
  await notifyUser({
    userId,
    category: "claim",
    title: "Business Claim Approved!",
    body: `Your claim for "${businessName}" has been approved. You can now manage your listing.`,
    actionUrl: "/my-business",
    icon: "CheckCircle",
    metadata: { serviceKey },
    emailTemplate: emailTemplates.claimApproved(businessName),
  });
}

/** Notify user when their business claim is rejected */
export async function notifyClaimRejected(userId: number, businessName: string, adminNotes?: string) {
  await notifyUser({
    userId,
    category: "claim",
    title: "Business Claim Update",
    body: `Your claim for "${businessName}" was not approved.${adminNotes ? ` Reason: ${adminNotes}` : ""} You can submit a new claim with additional verification.`,
    actionUrl: "/my-business",
    icon: "XCircle",
    emailTemplate: emailTemplates.claimRejected(businessName, adminNotes),
  });
}

/** Notify business owner when they receive a new review */
export async function notifyNewReview(userId: number, businessName: string, rating: number, serviceKey: string) {
  await notifyUser({
    userId,
    category: "review",
    title: "New Review Received",
    body: `Someone left a ${rating}-star review on "${businessName}".`,
    actionUrl: `/directory/${serviceKey}`,
    icon: "Star",
    metadata: { serviceKey, rating },
    emailTemplate: emailTemplates.newReview(businessName, rating),
  });
}

/** Notify user about successful payment */
export async function notifyPaymentSuccess(userId: number, tier: string, businessName: string) {
  await notifyUser({
    userId,
    category: "payment",
    title: "Payment Successful",
    body: `Your ${tier} subscription for "${businessName}" is now active. Enjoy your premium features!`,
    actionUrl: "/my-business",
    icon: "CreditCard",
    emailTemplate: emailTemplates.paymentSuccess(tier, businessName),
  });
}

/** Notify user about failed payment */
export async function notifyPaymentFailed(userId: number, businessName: string) {
  await notifyUser({
    userId,
    category: "payment",
    title: "Payment Failed",
    body: `We couldn't process your payment for "${businessName}". Please update your payment method to keep your premium features.`,
    actionUrl: "/my-business",
    icon: "AlertTriangle",
    emailTemplate: emailTemplates.paymentFailed(businessName),
  });
}

/** Notify user about a new event in Charlotte */
export async function notifyNewEvent(userId: number, eventTitle: string, eventSlug: string) {
  await notifyUser({
    userId,
    category: "event",
    title: "New Event in Charlotte",
    body: `Check out "${eventTitle}" — a new event just added to the calendar!`,
    actionUrl: `/events`,
    icon: "Calendar",
    metadata: { eventSlug },
  });
}

/** Notify user about bingo completion */
export async function notifyBingoComplete(userId: number, cardName: string) {
  await notifyUser({
    userId,
    category: "community",
    title: "Bingo Card Completed!",
    body: `Congratulations! You completed the "${cardName}" bingo card. Check the leaderboard to see your ranking!`,
    actionUrl: "/leaderboard",
    icon: "Trophy",
  });
}

/** Send a welcome notification to new users */
export async function notifyWelcome(userId: number, userName: string) {
  await notifyUser({
    userId,
    category: "system",
    title: "Welcome to Settle CLT!",
    body: `Hey ${userName || "there"}! Welcome to Charlotte's community guide. Explore neighborhoods, discover local businesses, and earn stamps on your CLT Passport.`,
    actionUrl: "/neighborhoods",
    icon: "Sparkles",
    emailTemplate: emailTemplates.welcome(userName),
  });
}

/** Notify about referral status update */
export async function notifyReferralUpdate(userId: number, status: string) {
  await notifyUser({
    userId,
    category: "community",
    title: "Referral Update",
    body: `Your real estate referral has been ${status}. ${status === "matched" ? "A local agent will be in touch soon!" : ""}`,
    actionUrl: "/find-your-home",
    icon: "Home",
  });
}
