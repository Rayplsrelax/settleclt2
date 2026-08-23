import * as React from "react";
import {
  Check,
  ShieldCheck,
  Sparkles,
  Award,
  Crown,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TrustTier } from "@shared/services";

interface TrustBadgeConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const TRUST_BADGE_CONFIG: Partial<Record<TrustTier, TrustBadgeConfig>> = {
  verified: {
    label: "Info Verified",
    icon: Check,
    className:
      "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  owner_claimed: {
    label: "Owner Claimed",
    icon: ShieldCheck,
    className:
      "border-transparent bg-green-500/15 text-green-700 dark:text-green-300",
  },
  newcomer_friendly: {
    label: "Newcomer Friendly",
    icon: Sparkles,
    className:
      "border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
  certified: {
    label: "Settle CLT Certified",
    icon: Award,
    className:
      "border-transparent bg-purple-500/15 text-purple-700 dark:text-purple-300",
  },
  featured_partner: {
    label: "Featured Partner",
    icon: Crown,
    className:
      "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
};

export interface TrustBadgeProps {
  trustTier?: TrustTier;
  className?: string;
}

export function TrustBadge({ trustTier, className }: TrustBadgeProps) {
  // "listed" and undefined both render nothing — a listed service has no badge.
  if (!trustTier || trustTier === "listed") {
    return null;
  }

  const config = TRUST_BADGE_CONFIG[trustTier];
  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <Badge className={cn(config.className, className)}>
      <Icon aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

export { TRUST_BADGE_CONFIG };
