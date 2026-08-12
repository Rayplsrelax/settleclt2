import type { ReactNode } from "react";
import { SOCIAL_LINKS, type SocialPlatform } from "@/lib/socialLinks";
import { trackSocialFollowClick } from "@/lib/mixpanel";

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const paths: Record<SocialPlatform, ReactNode> = {
    instagram: (
      <>
        <rect width="20" height="20" x="2" y="2" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
    tiktok: (
      <path d="M15.8 2v13.2a4.8 4.8 0 1 1-4.2-4.76V14a1.8 1.8 0 1 0 1.2 1.7V2h3a5 5 0 0 0 4.2 4.2v3a8 8 0 0 1-4.2-1.2" />
    ),
    facebook: (
      <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1Z" />
    ),
    x: <path d="M4 4l16 16M20 4 4 20" />,
    threads: (
      <path d="M12 2a10 10 0 1 0 7.1 17c2.4-2.4 3.1-6.3 1.4-9.3C18.8 6.5 15.7 5 12 5c-4 0-6.5 2.4-6.5 5.5 0 3 2.2 5 5.4 5 3.4 0 5.6-1.8 5.6-4.5 0-2.4-1.9-4-4.7-4-2.1 0-3.8.9-4.8 2.5" />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[platform]}
    </svg>
  );
}

interface SocialFollowLinksProps {
  surface: string;
  variant?: "icons" | "cards";
}

export default function SocialFollowLinks({
  surface,
  variant = "icons",
}: SocialFollowLinksProps) {
  if (variant === "cards") {
    return (
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SOCIAL_LINKS.map(link => (
          <a
            key={link.platform}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackSocialFollowClick(link.platform, surface)}
            className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left no-underline transition-colors hover:border-primary/50 hover:bg-primary/5"
            aria-label={`Follow Settle CLT on ${link.label} (opens in a new tab)`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SocialIcon platform={link.platform} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                {link.label}
              </span>
              <span className="block text-xs text-muted-foreground">
                {link.promise}
              </span>
            </span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {SOCIAL_LINKS.map(link => (
        <a
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocialFollowClick(link.platform, surface)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground no-underline transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          aria-label={`${link.label} (opens in a new tab)`}
          title={link.label}
        >
          <SocialIcon platform={link.platform} />
        </a>
      ))}
    </div>
  );
}
