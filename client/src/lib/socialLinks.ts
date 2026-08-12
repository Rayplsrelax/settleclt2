export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "threads";

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  handle: string;
  href: string;
  promise: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    platform: "instagram",
    label: "Instagram",
    handle: "@settleclt",
    href: "https://instagram.com/settleclt",
    promise: "Visual guides and local finds",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    handle: "@settleclt",
    href: "https://tiktok.com/@settleclt",
    promise: "Quick Charlotte tips",
  },
  {
    platform: "facebook",
    label: "Facebook",
    handle: "Settle CLT",
    href: "https://facebook.com/settleclt",
    promise: "Community news and events",
  },
  {
    platform: "x",
    label: "X",
    handle: "@settleclt",
    href: "https://x.com/settleclt",
    promise: "Timely local updates",
  },
  {
    platform: "threads",
    label: "Threads",
    handle: "@settleclt",
    href: "https://www.threads.net/@settleclt",
    promise: "Charlotte conversations",
  },
] as const;
