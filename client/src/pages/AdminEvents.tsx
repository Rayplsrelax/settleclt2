import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Calendar, Eye, EyeOff, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "concerts", label: "Concerts & Music" },
  { value: "food-drink", label: "Food & Drink" },
  { value: "sports", label: "Sports" },
  { value: "arts-culture", label: "Arts & Culture" },
  { value: "festivals", label: "Festivals" },
  { value: "family", label: "Family & Kids" },
  { value: "nightlife", label: "Nightlife" },
  { value: "free", label: "Free Events" },
  { value: "markets", label: "Markets & Pop-ups" },
  { value: "community", label: "Community" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

const NEIGHBORHOODS = [
  "Uptown", "South End", "NoDa", "Plaza Midwood", "Dilworth",
  "Myers Park", "Elizabeth", "Ballantyne", "University City", "Montford",
  "Eastway", "Steele Creek", "Huntersville", "Mooresville", "Matthews",
  "Mint Hill", "Pineville", "Indian Trail", "Cornelius", "Davidson",
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  startDate: "",
  endDate: "",
  venueName: "",
  venueAddress: "",
  neighborhood: "",
  externalUrl: "",
  imageUrl: "",
  category: "community" as CategoryValue,
  isFeatured: "no" as "yes" | "no",
  isRecurring: "no" as "yes" | "no",
  status: "draft" as "draft" | "published" | "archived",
};

export default function AdminEvents() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const utils = trpc.useUtils();
  const { data: eventsList, isLoading } = trpc.admin.getAllEvents.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const createMutation = trpc.admin.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Event created!");
      utils.admin.getAllEvents.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("Event updated!");
      utils.admin.getAllEvents.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Event deleted!");
      utils.admin.getAllEvents.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(event: any) {
    setForm({
      title: event.title,
      slug: event.slug,
      description: event.description ?? "",
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
      venueName: event.venueName ?? "",
      venueAddress: event.venueAddress ?? "",
      neighborhood: event.neighborhood ?? "",
      externalUrl: event.externalUrl ?? "",
      imageUrl: event.imageUrl ?? "",
      category: event.category,
      isFeatured: event.isFeatured,
      isRecurring: event.isRecurring,
      status: event.status,
    });
    setEditingId(event.id);
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.title || !form.startDate || !form.category) {
      toast.error("Title, start date, and category are required");
      return;
    }
    const slug = form.slug || slugify(form.title);
    const payload = {
      title: form.title,
      slug,
      description: form.description || undefined,
      startDate: new Date(form.startDate),
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      venueName: form.venueName || undefined,
      venueAddress: form.venueAddress || undefined,
      neighborhood: form.neighborhood || undefined,
      externalUrl: form.externalUrl || undefined,
      imageUrl: form.imageUrl || undefined,
      category: form.category,
      isFeatured: form.isFeatured,
      isRecurring: form.isRecurring,
      status: form.status,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/admin/blog">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Admin
                </Button>
              </Link>
              <div>
                <h1 className="font-display font-extrabold text-3xl text-foreground">
                  Manage Events
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {eventsList?.length ?? 0} events total
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {eventsList?.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {event.title}
                        </h3>
                        {event.isFeatured === "yes" && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"}
                        <span>·</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            event.status === "published"
                              ? "border-green-300 text-green-700"
                              : event.status === "archived"
                              ? "border-gray-300 text-gray-500"
                              : "border-yellow-300 text-yellow-700"
                          }`}
                        >
                          {event.status}
                        </Badge>
                        <span>·</span>
                        <span>{event.category}</span>
                        {event.neighborhood && (
                          <>
                            <span>·</span>
                            <span>{event.neighborhood}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({
                          id: event.id,
                          status: event.status === "published" ? "draft" : "published",
                        })
                      }
                    >
                      {event.status === "published" ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(event)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this event?")) {
                          deleteMutation.mutate({ id: event.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Event" : "Create Event"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Title *
                </label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: form.slug || slugify(e.target.value),
                    })
                  }
                  placeholder="Event title"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Slug
                </label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Start Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  End Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Category *
                </label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as CategoryValue })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Neighborhood
                </label>
                <Select
                  value={form.neighborhood || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, neighborhood: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select neighborhood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No neighborhood</SelectItem>
                    {NEIGHBORHOODS.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Venue Name
                </label>
                <Input
                  value={form.venueName}
                  onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                  placeholder="e.g., Spectrum Center"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Venue Address
                </label>
                <Input
                  value={form.venueAddress}
                  onChange={(e) => setForm({ ...form, venueAddress: e.target.value })}
                  placeholder="Full address"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  External URL
                </label>
                <Input
                  value={form.externalUrl}
                  onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                  placeholder="https://tickets.example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Image URL
                </label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://cdn.example.com/image.jpg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Status
                </label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as "draft" | "published" | "archived" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isFeatured === "yes"}
                    onChange={(e) =>
                      setForm({ ...form, isFeatured: e.target.checked ? "yes" : "no" })
                    }
                    className="rounded"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isRecurring === "yes"}
                    onChange={(e) =>
                      setForm({ ...form, isRecurring: e.target.checked ? "yes" : "no" })
                    }
                    className="rounded"
                  />
                  Recurring
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Event description..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingId
                ? "Update Event"
                : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
