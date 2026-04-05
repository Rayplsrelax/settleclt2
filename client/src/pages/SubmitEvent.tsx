import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { allNeighborhoods } from "@shared/neighborhoods";
import {
  CalendarPlus, CheckCircle, LogIn, Clock, MapPin,
  Users, Shield, Sparkles
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const CATEGORIES = [
  { value: "concerts", label: "Concerts & Music" },
  { value: "food-drink", label: "Food & Drink" },
  { value: "sports", label: "Sports" },
  { value: "arts-culture", label: "Arts & Culture" },
  { value: "festivals", label: "Festivals" },
  { value: "family", label: "Family" },
  { value: "nightlife", label: "Nightlife" },
  { value: "free", label: "Free Events" },
  { value: "markets", label: "Markets" },
  { value: "community", label: "Community" },
] as const;

export default function SubmitEvent() {
  useSEO({
    title: "Submit an Event — Settle CLT",
    description: "Share Charlotte events with the community. Submit concerts, food festivals, sports, arts, and more for free.",
    keywords: "submit Charlotte event, Charlotte community events, add event Charlotte NC, CLT event calendar",
    path: "/submit-event",
  });
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isRecurring, setIsRecurring] = useState("no");
  const [submitted, setSubmitted] = useState(false);

  const submitEvent = trpc.events.submitEvent.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Event submitted! We'll review it shortly.");
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !startDate || !venueName || !category) return;
    submitEvent.mutate({
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      venueName,
      venueAddress: venueAddress || undefined,
      neighborhood: neighborhood || undefined,
      externalUrl: externalUrl || undefined,
      category: category as any,
      isRecurring: isRecurring as "yes" | "no",
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (submitted) {
    return (
      <PageLayout>
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="max-w-lg mx-auto text-center">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-5" />
              <h1 className="font-display font-bold text-2xl text-foreground">Event Submitted!</h1>
              <p className="mt-3 text-muted-foreground">
                Thanks for sharing this event with the Charlotte community! Our team will review it and publish it within 24 hours.
              </p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <a
                  href="/events"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
                >
                  Browse Events
                </a>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setTitle("");
                    setDescription("");
                    setStartDate("");
                    setEndDate("");
                    setVenueName("");
                    setVenueAddress("");
                    setNeighborhood("");
                    setExternalUrl("");
                    setCategory("");
                    setIsRecurring("no");
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-colors"
                >
                  Submit Another
                </button>
              </div>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="max-w-lg mx-auto text-center">
              <CalendarPlus className="w-14 h-14 text-purple-500 mx-auto mb-5" />
              <h1 className="font-display font-bold text-2xl text-foreground">Submit an Event</h1>
              <p className="mt-3 text-muted-foreground">
                Sign in to share events happening in Charlotte with the community.
              </p>
              <a
                href={getLoginUrl()}
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity no-underline"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Submit
              </a>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-14 md:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <CalendarPlus className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Community Events</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl text-foreground">
              Submit an Event
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Know about something happening in Charlotte? Share it with the community. Events are reviewed and published within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-8 bg-muted/50 border-b border-border">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-foreground">Reach the Community</h3>
                <p className="text-xs text-muted-foreground mt-1">Your event will be seen by Charlotte residents and newcomers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-foreground">Quality Reviewed</h3>
                <p className="text-xs text-muted-foreground mt-1">All events are reviewed before publishing to maintain quality.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-foreground">Free to Submit</h3>
                <p className="text-xs text-muted-foreground mt-1">Sharing events with the community is always free.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-sm space-y-5">
              <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-purple-500" />
                Event Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Event Name *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Charlotte Food Truck Friday"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Describe the event — what it is, who it's for, what to expect..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Camp North End"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Venue Address</label>
                  <input
                    type="text"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="1824 Statesville Ave, Charlotte, NC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Neighborhood</label>
                  <select
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select neighborhood (optional)</option>
                    {allNeighborhoods.map((n) => (
                      <option key={n.id} value={n.name}>{n.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Event Website / Tickets URL</label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="https://eventbrite.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Recurring?</label>
                  <select
                    value={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="no">One-time event</option>
                    <option value="yes">Recurring event</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                disabled={submitEvent.isPending}
              >
                {submitEvent.isPending ? "Submitting..." : "Submit Event"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Events are reviewed within 24 hours. Submitting as {user.name ?? user.email ?? "you"}.
              </p>
            </form>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
