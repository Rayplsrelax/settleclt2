import PageLayout from "@/components/PageLayout";
import AuthGate from "@/components/AuthGate";
import { Heart, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Wishlist() {
  return (
    <PageLayout>
      <AuthGate featureLabel="save your wishlist">
        <div className="container py-12 max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              My Wishlist
            </h1>
          </div>
          <p className="text-muted-foreground mb-8 max-w-xl">
            Save places you want to visit, restaurants to try, and experiences to have
            in Charlotte. Add notes so you remember why each spot caught your eye.
          </p>

          {/* Empty state */}
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Bookmark className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nothing saved yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Browse the directory and tap the heart icon on any listing to add it
                to your wishlist. You can also add personal notes to each saved place.
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
            Full wishlist with notes, categories, and sharing coming soon.
          </p>
        </div>
      </AuthGate>
    </PageLayout>
  );
}
