import PageLayout from "@/components/PageLayout";
import AuthGate from "@/components/AuthGate";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Heart, MapPin, Trash2, StickyNote, Pencil, Check, X, ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SERVICES, type Service } from "@shared/services";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nContext";
import { useSEO } from "@/hooks/useSEO";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function WishlistContent() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: entries = [], isLoading } = trpc.wishlist.getEntries.useQuery();
  const removeEntry = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      utils.wishlist.getEntries.invalidate();
      toast.success(t("wishlist.removed"));
    },
  });
  const updateNotes = trpc.wishlist.updateNotes.useMutation({
    onSuccess: () => {
      utils.wishlist.getEntries.invalidate();
      toast.success(t("wishlist.notesUpdated"));
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const serviceMap = useMemo(() => {
    const m: Record<string, Service> = {};
    SERVICES.forEach(s => { m[slugify(s.name)] = s; });
    return m;
  }, []);

  if (isLoading) {
    return (
      <div className="container py-12 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("wishlist.title")}
          </h1>
        </div>
        <p className="text-muted-foreground max-w-xl">
          {t("wishlist.subtitle")}
        </p>
      </div>

      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("wishlist.empty")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              {t("wishlist.emptyDescription")}
            </p>
            <a
              href="/directory"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
            >
              {t("wishlist.browseDirectory")}
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              {t("wishlist.savedPlaces", { count: entries.length })}
            </h2>
          </div>
          {entries.map(entry => {
            const svc = serviceMap[entry.serviceKey];
            const placeName = svc?.name ?? entry.serviceKey;
            const isEditing = editingId === entry.id;

            return (
              <Card key={entry.id} className="overflow-hidden hover:border-rose-500/30 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">{placeName}</div>
                      {svc && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {svc.area}
                          </span>
                          <span>{svc.category}</span>
                          {svc.website && (
                            <a
                              href={svc.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                              {t("wishlist.website")}
                            </a>
                          )}
                        </div>
                      )}

                      {isEditing ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            placeholder={t("wishlist.notePlaceholder")}
                            className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t("wishlist.saveNotes")}
                            onClick={() => {
                              updateNotes.mutate({ id: entry.id, notes: editNotes });
                              setEditingId(null);
                            }}
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t("wishlist.cancelEdit")}
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : entry.notes ? (
                        <div
                          className="mt-2 flex items-start gap-1 text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => { setEditingId(entry.id); setEditNotes(entry.notes ?? ""); }}
                        >
                          <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{entry.notes}</span>
                        </div>
                      ) : (
                        <button
                          className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingId(entry.id); setEditNotes(""); }}
                        >
                          <Pencil className="w-3 h-3" />
                          {t("wishlist.addNote")}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={t("wishlist.remove")}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeEntry.mutate({ serviceKey: entry.serviceKey })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-8">
        {t("wishlist.tip")}
      </p>
    </div>
  );
}

export default function Wishlist() {
  const { t } = useI18n();
  useSEO({
    title: t("wishlist.title"),
    description: t("wishlist.seoDescription"),
    path: "/wishlist",
  });

  return (
    <PageLayout>
      <AuthGate featureLabel={t("wishlist.authFeature")}>
        <WishlistContent />
      </AuthGate>
    </PageLayout>
  );
}
