import PageLayout from "@/components/PageLayout";
import AuthGate from "@/components/AuthGate";
import { Stamp, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Passport() {
  return (
    <PageLayout>
      <AuthGate featureLabel="track your CLT Passport">
        <div className="container py-12 max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Stamp className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              CLT Passport
            </h1>
          </div>
          <p className="text-muted-foreground mb-8 max-w-xl">
            Explore Charlotte and collect stamps for every place you visit. Track your
            journey across neighborhoods, restaurants, parks, and local gems.
          </p>

          {/* Empty state */}
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Your passport is empty
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Start exploring Charlotte! Visit places from the directory and mark
                them as visited to collect stamps in your passport.
              </p>
              <a
                href="/directory"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
              >
                Browse Directory
              </a>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Full passport tracking with stamps, bingo cards, and achievements coming soon.
          </p>
        </div>
      </AuthGate>
    </PageLayout>
  );
}
