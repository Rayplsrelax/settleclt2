import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Unit tests for notification-service.ts ───

// Mock dependencies before importing
const mockCreateNotification = vi.fn().mockResolvedValue({ id: 1 });
const mockIsNotificationEnabled = vi.fn().mockResolvedValue(true);
const mockGetUserById = vi.fn().mockResolvedValue({ id: 1, email: "test@example.com", name: "Test User" });
const mockNotifyOwner = vi.fn().mockResolvedValue(true);
const mockSendUserEmail = vi.fn().mockResolvedValue(false);

vi.mock("./db", () => ({
  createNotification: (...args: any[]) => mockCreateNotification(...args),
  isNotificationEnabled: (...args: any[]) => mockIsNotificationEnabled(...args),
  getUserById: (...args: any[]) => mockGetUserById(...args),
  // Stubs for other db imports
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  deleteNotification: vi.fn(),
  getNotificationPreferences: vi.fn(),
  upsertNotificationPreference: vi.fn(),
  savePushSubscription: vi.fn(),
  getUserPushSubscriptions: vi.fn(),
  removePushSubscription: vi.fn(),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: (...args: any[]) => mockNotifyOwner(...args),
}));

vi.mock("./email-notifications", () => ({
  sendUserEmail: (...args: any[]) => mockSendUserEmail(...args),
  emailTemplates: {
    claimApproved: (name: string) => ({ subject: `Claim approved: ${name}`, html: "<p>Approved</p>" }),
    claimRejected: (name: string, reason?: string) => ({ subject: `Claim rejected: ${name}`, html: "<p>Rejected</p>" }),
    newReview: (name: string, rating: number) => ({ subject: `New review: ${name}`, html: "<p>Review</p>" }),
    paymentSuccess: (tier: string, name: string) => ({ subject: `Payment: ${name}`, html: "<p>Payment</p>" }),
    paymentFailed: (name: string) => ({ subject: `Failed: ${name}`, html: "<p>Failed</p>" }),
    welcome: (name: string) => ({ subject: `Welcome ${name}`, html: "<p>Welcome</p>" }),
  },
}));

// Import after mocks
import {
  notifyUser,
  notifyAdmin,
  notifyClaimApproved,
  notifyClaimRejected,
  notifyNewReview,
  notifyPaymentSuccess,
  notifyPaymentFailed,
  notifyWelcome,
  notifyBingoComplete,
  notifyNewEvent,
  notifyReferralUpdate,
} from "./notification-service";

beforeEach(() => {
  vi.clearAllMocks();
  mockIsNotificationEnabled.mockResolvedValue(true);
  mockGetUserById.mockResolvedValue({ id: 1, email: "test@example.com", name: "Test User" });
});

describe("Notification Service - notifyUser", () => {
  it("creates in-app notification when inApp is enabled", async () => {
    await notifyUser({
      userId: 1,
      category: "system",
      title: "Test",
      body: "Test body",
    });

    expect(mockIsNotificationEnabled).toHaveBeenCalledWith(1, "system", "inApp");
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        category: "system",
        title: "Test",
        body: "Test body",
      })
    );
  });

  it("skips in-app notification when disabled", async () => {
    mockIsNotificationEnabled.mockResolvedValue(false);

    await notifyUser({
      userId: 1,
      category: "system",
      title: "Test",
      body: "Test body",
    });

    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("sends email when email template is provided and email is enabled", async () => {
    await notifyUser({
      userId: 1,
      category: "claim",
      title: "Claim Approved",
      body: "Your claim was approved",
      emailTemplate: { subject: "Approved", html: "<p>Approved</p>" },
    });

    expect(mockGetUserById).toHaveBeenCalledWith(1);
    expect(mockSendUserEmail).toHaveBeenCalledWith("test@example.com", {
      subject: "Approved",
      html: "<p>Approved</p>",
    });
  });

  it("skips email when email preference is disabled", async () => {
    mockIsNotificationEnabled.mockImplementation(async (_userId, _cat, channel) => {
      return channel !== "email";
    });

    await notifyUser({
      userId: 1,
      category: "claim",
      title: "Test",
      body: "Test",
      emailTemplate: { subject: "Test", html: "<p>Test</p>" },
    });

    expect(mockSendUserEmail).not.toHaveBeenCalled();
  });

  it("skips email when user has no email address", async () => {
    mockGetUserById.mockResolvedValue({ id: 1, email: null, name: "No Email User" });

    await notifyUser({
      userId: 1,
      category: "claim",
      title: "Test",
      body: "Test",
      emailTemplate: { subject: "Test", html: "<p>Test</p>" },
    });

    expect(mockSendUserEmail).not.toHaveBeenCalled();
  });

  it("does not throw if notification creation fails", async () => {
    mockCreateNotification.mockRejectedValueOnce(new Error("DB error"));

    await expect(
      notifyUser({ userId: 1, category: "system", title: "Test", body: "Test" })
    ).resolves.not.toThrow();
  });
});

describe("Notification Service - notifyAdmin", () => {
  it("calls notifyOwner with title and content", async () => {
    await notifyAdmin("Test Title", "Test Content");
    expect(mockNotifyOwner).toHaveBeenCalledWith({
      title: "Test Title",
      content: "Test Content",
    });
  });

  it("does not throw if notifyOwner fails", async () => {
    mockNotifyOwner.mockRejectedValueOnce(new Error("Service down"));
    await expect(notifyAdmin("Test", "Content")).resolves.not.toThrow();
  });
});

describe("Notification Triggers", () => {
  it("notifyClaimApproved creates correct notification", async () => {
    await notifyClaimApproved(1, "Best Coffee Shop", "best-coffee-shop");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        category: "claim",
        title: "Business Claim Approved!",
        body: expect.stringContaining("Best Coffee Shop"),
        actionUrl: "/my-business",
      })
    );
  });

  it("notifyClaimRejected includes admin notes in body", async () => {
    await notifyClaimRejected(1, "Fake Business", "Insufficient verification");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "claim",
        body: expect.stringContaining("Insufficient verification"),
      })
    );
  });

  it("notifyNewReview creates review notification with rating", async () => {
    await notifyNewReview(1, "Great Restaurant", 5, "great-restaurant");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "review",
        title: "New Review Received",
        body: expect.stringContaining("5-star"),
        actionUrl: "/directory/great-restaurant",
      })
    );
  });

  it("notifyPaymentSuccess creates payment notification", async () => {
    await notifyPaymentSuccess(1, "Premium", "My Business");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "payment",
        title: "Payment Successful",
        body: expect.stringContaining("Premium"),
      })
    );
  });

  it("notifyPaymentFailed creates payment failure notification", async () => {
    await notifyPaymentFailed(1, "My Business");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "payment",
        title: "Payment Failed",
        body: expect.stringContaining("My Business"),
      })
    );
  });

  it("notifyWelcome creates welcome notification", async () => {
    await notifyWelcome(1, "Rayshaud");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "system",
        title: "Welcome to Settle CLT!",
        body: expect.stringContaining("Rayshaud"),
        actionUrl: "/neighborhoods",
      })
    );
  });

  it("notifyBingoComplete creates bingo notification", async () => {
    await notifyBingoComplete(1, "CLT Explorer");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "community",
        title: "Bingo Card Completed!",
        body: expect.stringContaining("CLT Explorer"),
        actionUrl: "/leaderboard",
      })
    );
  });

  it("notifyNewEvent creates event notification", async () => {
    await notifyNewEvent(1, "Jazz Festival", "jazz-festival");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "event",
        title: "New Event in Charlotte",
        body: expect.stringContaining("Jazz Festival"),
        actionUrl: "/events",
      })
    );
  });

  it("notifyReferralUpdate creates referral notification", async () => {
    await notifyReferralUpdate(1, "matched");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "community",
        title: "Referral Update",
        body: expect.stringContaining("matched"),
      })
    );
  });
});

describe("Email Templates", () => {
  it("sends email template with claim approved notification", async () => {
    await notifyClaimApproved(1, "Test Business", "test-business");

    expect(mockSendUserEmail).toHaveBeenCalledWith(
      "test@example.com",
      expect.objectContaining({
        subject: expect.stringContaining("Test Business"),
      })
    );
  });

  it("sends email template with welcome notification", async () => {
    await notifyWelcome(1, "NewUser");

    expect(mockSendUserEmail).toHaveBeenCalledWith(
      "test@example.com",
      expect.objectContaining({
        subject: expect.stringContaining("NewUser"),
      })
    );
  });
});

describe("timeUtils", () => {
  it("formats recent time as 'just now'", async () => {
    // Dynamic import to avoid module resolution issues in test
    const { formatDistanceToNow } = await import("../client/src/lib/timeUtils");
    const now = new Date();
    expect(formatDistanceToNow(now)).toBe("just now");
  });

  it("formats minutes ago", async () => {
    const { formatDistanceToNow } = await import("../client/src/lib/timeUtils");
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatDistanceToNow(fiveMinAgo)).toBe("5m ago");
  });

  it("formats hours ago", async () => {
    const { formatDistanceToNow } = await import("../client/src/lib/timeUtils");
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatDistanceToNow(threeHoursAgo)).toBe("3h ago");
  });

  it("formats days ago", async () => {
    const { formatDistanceToNow } = await import("../client/src/lib/timeUtils");
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatDistanceToNow(twoDaysAgo)).toBe("2d ago");
  });
});
