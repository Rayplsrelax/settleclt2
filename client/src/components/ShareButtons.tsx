import { useState } from "react";
import { Share2, Twitter, Facebook, Link2, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface ShareButtonsProps {
  /** The page title to share */
  title: string;
  /** Optional description for social cards */
  description?: string;
  /** Optional URL override (defaults to current page) */
  url?: string;
  /** Compact mode: just an icon button */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function ShareButtons({
  title,
  description,
  url,
  compact = false,
  className = "",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = description ? `${title} — ${description}` : title;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check this out: ${shareText}\n\n${shareUrl}`)}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl,
        });
      } catch {
        // User cancelled — no-op
      }
    }
  }

  const shareOptions = [
    {
      label: "Twitter / X",
      icon: <Twitter className="w-4 h-4" />,
      href: twitterUrl,
      color: "hover:bg-sky-50 hover:text-sky-600",
    },
    {
      label: "Facebook",
      icon: <Facebook className="w-4 h-4" />,
      href: facebookUrl,
      color: "hover:bg-blue-50 hover:text-blue-600",
    },
    {
      label: "Email",
      icon: <Mail className="w-4 h-4" />,
      href: emailUrl,
      color: "hover:bg-amber-50 hover:text-amber-600",
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 text-muted-foreground hover:text-foreground ${className}`}
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 ${className}`}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Share this page
          </p>

          {/* Native share (mobile) */}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share via...
            </button>
          )}

          {/* Social links */}
          {shareOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                if (opt.href.startsWith('mailto:')) {
                  window.location.href = opt.href;
                } else {
                  window.open(opt.href, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
                }
              }}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors text-foreground ${opt.color}`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
