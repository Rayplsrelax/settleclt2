import { TRPCError } from "@trpc/server";
import type { Express } from "express";

export type FeatureFlags = {
  businessCheckout: boolean;
  eventSubmissions: boolean;
};

export type FeatureFlagName = keyof FeatureFlags;

type FlagEnvironment = Record<string, string | undefined>;

const FLAG_ENVIRONMENT_KEYS: Record<FeatureFlagName, string> = {
  businessCheckout: "FEATURE_BUSINESS_CHECKOUT",
  eventSubmissions: "FEATURE_EVENT_SUBMISSIONS",
};

function parseFlag(value: string | undefined, environmentKey: string): boolean {
  if (value === undefined || value === "") return true;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new Error(`${environmentKey} must be true/false or 1/0`);
}

export function loadFeatureFlags(environment: FlagEnvironment): FeatureFlags {
  return {
    businessCheckout: parseFlag(
      environment.FEATURE_BUSINESS_CHECKOUT,
      FLAG_ENVIRONMENT_KEYS.businessCheckout
    ),

    eventSubmissions: parseFlag(
      environment.FEATURE_EVENT_SUBMISSIONS,
      FLAG_ENVIRONMENT_KEYS.eventSubmissions
    ),
  };
}

export const FEATURE_FLAGS = loadFeatureFlags(process.env);

export class FeatureDisabledError extends TRPCError {
  readonly feature: FeatureFlagName;

  constructor(feature: FeatureFlagName) {
    super({
      code: "SERVICE_UNAVAILABLE",
      message: "This feature is temporarily unavailable.",
    });
    this.name = "FeatureDisabledError";
    this.feature = feature;
  }
}

export function assertFeatureEnabled(
  feature: FeatureFlagName,
  flags: FeatureFlags = FEATURE_FLAGS
): void {
  if (!flags[feature]) throw new FeatureDisabledError(feature);
}

export function registerFeatureFlagRoutes(
  app: Express,
  flags: FeatureFlags = FEATURE_FLAGS
): void {
  app.get("/api/feature-flags", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(flags);
  });
}
