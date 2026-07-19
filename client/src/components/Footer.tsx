import { Link } from "wouter";

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <span className="font-display font-extrabold text-lg text-foreground">
              Settle<span className="text-primary">CLT</span>
            </span>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Your complete guide to living in Charlotte, NC. Discover neighborhoods, local businesses, events, and everything that makes the Queen City home.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://instagram.com/settleclt" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="https://twitter.com/settleclt" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="X (Twitter)">
                <TwitterIcon />
              </a>
              <a href="https://facebook.com/settleclt" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href="https://tiktok.com/@settleclt" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="TikTok">
                <TikTokIcon />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Explore</h4>
            <div className="flex flex-col gap-2">
              <Link href="/neighborhoods" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Neighborhoods</Link>
              <Link href="/directory" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Services Directory</Link>
              <Link href="/events" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Events</Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Blog & Guides</Link>
              <Link href="/relocation-checklist" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Relocation Checklist</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Community</h4>
            <div className="flex flex-col gap-2">
              <Link href="/passport" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">CLT Passport</Link>
              <Link href="/bingo" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">CLT Bingo Cards</Link>
              <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Leaderboard</Link>
              <Link href="/list-your-business" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">List Your Business</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Get Started</h4>
            <div className="flex flex-col gap-2">
              <Link href="/quiz" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Neighborhood Quiz</Link>
              <Link href="/neighborhoods" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Find Your Neighborhood</Link>
              <Link href="/relocation-checklist" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Moving Checklist</Link>
              <Link href="/find-your-home" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Find Your Home</Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Moving Guides</Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Contact Us</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Settle CLT. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors no-underline">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors no-underline">Terms of Service</Link>
            <Link href="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors no-underline">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
