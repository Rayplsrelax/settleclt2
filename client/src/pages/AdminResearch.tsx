import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Search, Sparkles, FileText, Trash2, ChevronDown, ChevronUp,
  BookOpen, Lightbulb, Send, Loader2, Tag, ExternalLink, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "", label: "Any Category" },
  { value: "neighborhood-guide", label: "Neighborhood Guide" },
  { value: "food-drink", label: "Food & Drink" },
  { value: "events", label: "Events" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "moving-tips", label: "Moving Tips" },
  { value: "real-estate", label: "Real Estate" },
];

const STATUS_COLORS: Record<string, string> = {
  idea: "bg-blue-500/10 text-blue-600",
  researching: "bg-yellow-500/10 text-yellow-600",
  drafted: "bg-purple-500/10 text-purple-600",
  published: "bg-green-500/10 text-green-600",
  dismissed: "bg-gray-500/10 text-gray-500",
};

export default function AdminResearch() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Search state
  const [topic, setTopic] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);

  // Draft generation state
  const [draftingId, setDraftingId] = useState<number | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState<string>("");
  const [showDraftFor, setShowDraftFor] = useState<number | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);

  const { data: savedIdeas = [], isLoading } = trpc.research.getAll.useQuery(
    statusFilter ? { status: statusFilter } : undefined,
    { enabled: user?.role === "admin" }
  );

  const generateIdeas = trpc.research.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedIdeas(data.ideas);
      utils.research.getAll.invalidate();
      toast.success(`Generated ${data.ideas.length} blog ideas and saved to your library!`);
      setIsGenerating(false);
    },
    onError: (err) => {
      toast.error(`Failed to generate ideas: ${err.message}`);
      setIsGenerating(false);
    },
  });

  const generateDraft = trpc.research.generateDraft.useMutation({
    onSuccess: (data) => {
      setGeneratedDraft(data.draft);
      utils.research.getAll.invalidate();
      toast.success("Blog draft generated!");
      setDraftingId(null);
    },
    onError: (err) => {
      toast.error(`Failed to generate draft: ${err.message}`);
      setDraftingId(null);
    },
  });

  const updateIdea = trpc.research.update.useMutation({
    onSuccess: () => {
      utils.research.getAll.invalidate();
      toast.success("Idea updated");
    },
  });

  const deleteIdea = trpc.research.delete.useMutation({
    onSuccess: () => {
      utils.research.getAll.invalidate();
      toast.success("Idea deleted");
    },
  });

  function handleGenerate() {
    if (!topic.trim()) {
      toast.error("Enter a topic to research");
      return;
    }
    setIsGenerating(true);
    setGeneratedIdeas([]);
    generateIdeas.mutate({
      topic: topic.trim(),
      category: searchCategory || undefined,
    });
  }

  function handleGenerateDraft(idea: any) {
    setDraftingId(idea.id);
    setShowDraftFor(idea.id);
    setGeneratedDraft("");
    generateDraft.mutate({
      ideaId: idea.id,
      title: idea.title,
      outline: idea.outline || "",
      keywords: idea.keywords || undefined,
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground mb-4">You need admin privileges to access the blog research tool.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </button>
            <span className="text-border">|</span>
            <h1 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Blog Research Lab
            </h1>
            <span className="text-xs text-muted-foreground">({savedIdeas.length} ideas)</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/blog")} className="gap-2">
            <FileText className="w-4 h-4" />
            Blog Editor
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* AI Research Generator */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-lg">AI Content Research</h2>
              <p className="text-sm text-muted-foreground">
                Enter a topic and our AI will generate blog post ideas inspired by Charlotte local sources
                (Charlotte Agenda, Axios Charlotte, Charlotte Observer, and more).
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                placeholder="e.g., best brunch spots, summer events, South End nightlife, moving from NYC..."
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={searchCategory}
              onChange={e => setSearchCategory(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="gap-2 shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Generate Ideas
                </>
              )}
            </Button>
          </div>

          {/* Generated Ideas Preview */}
          {generatedIdeas.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Just Generated — Saved to Your Library
              </h3>
              {generatedIdeas.map((idea, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">{idea.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{idea.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                          {idea.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Source: {idea.source}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(idea.outline)}
                      className="gap-1 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Outline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Ideas Library */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Ideas Library
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="">All Statuses</option>
              <option value="idea">Ideas</option>
              <option value="researching">Researching</option>
              <option value="drafted">Drafted</option>
              <option value="published">Published</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-xl border border-border p-4">
                <div className="h-5 w-1/3 bg-muted rounded mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : savedIdeas.length === 0 ? (
          <div className="text-center py-16">
            <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No ideas yet</h3>
            <p className="text-sm text-muted-foreground">
              Use the AI research tool above to generate blog post ideas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedIdeas.map((idea: any) => (
              <div
                key={idea.id}
                className="rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => setExpandedIdea(expandedIdea === idea.id ? null : idea.id)}
                          className="flex items-center gap-1 text-left"
                        >
                          {expandedIdea === idea.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <h3 className="font-semibold text-foreground">{idea.title}</h3>
                        </button>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[idea.status] || STATUS_COLORS.idea}`}>
                          {idea.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 ml-5">
                        {idea.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 ml-5 text-xs text-muted-foreground">
                        {idea.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {idea.category}
                          </span>
                        )}
                        {idea.source && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> {idea.source}
                          </span>
                        )}
                        <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateDraft(idea)}
                        disabled={draftingId === idea.id}
                        className="gap-1"
                        title="Generate full blog draft"
                      >
                        {draftingId === idea.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Draft
                      </Button>
                      <select
                        value={idea.status}
                        onChange={e => updateIdea.mutate({ id: idea.id, status: e.target.value as any })}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                      >
                        <option value="idea">Idea</option>
                        <option value="researching">Researching</option>
                        <option value="drafted">Drafted</option>
                        <option value="published">Published</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete "${idea.title}"?`)) {
                            deleteIdea.mutate({ id: idea.id });
                          }
                        }}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedIdea === idea.id && (
                  <div className="border-t border-border p-4 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {idea.outline && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Outline</h4>
                          <div className="text-sm text-foreground whitespace-pre-wrap bg-background rounded-lg p-3 border border-border">
                            {idea.outline}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(idea.outline)}
                            className="gap-1 mt-2"
                          >
                            <Copy className="w-3 h-3" /> Copy Outline
                          </Button>
                        </div>
                      )}
                      {idea.keywords && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">SEO Keywords</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {idea.keywords.split(",").map((kw: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                {kw.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Generated Draft */}
                {showDraftFor === idea.id && generatedDraft && (
                  <div className="border-t border-border p-4 bg-green-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-green-700 uppercase flex items-center gap-1">
                        <Check className="w-3 h-3" /> Generated Draft
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedDraft)}
                          className="gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy Draft
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            // Navigate to blog editor with pre-filled content
                            navigate("/admin/blog");
                            toast.info("Draft copied! Paste it into the blog editor to publish.");
                            copyToClipboard(generatedDraft);
                          }}
                          className="gap-1"
                        >
                          <FileText className="w-3 h-3" /> Open Blog Editor
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap bg-background rounded-lg p-4 border border-border max-h-96 overflow-y-auto font-mono">
                      {generatedDraft}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
