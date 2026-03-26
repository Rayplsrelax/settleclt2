import { Link } from "wouter";

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
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-3">Explore</h4>
            <div className="flex flex-col gap-2">
              <Link href="/neighborhoods" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Neighborhoods</Link>
              <Link href="/directory" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Services Directory</Link>
              <Link href="/events" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Events</Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Blog & Guides</Link>
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
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Moving Guides</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Settle CLT. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Made with care for the Queen City</p>
        </div>
      </div>
    </footer>
  );
}
