import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus, Edit3, Trash2, Eye, Save, ArrowLeft, FileText, Globe, Clock, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ViewMode = "list" | "create" | "edit";

export default function AdminBlog() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [view, setView] = useState<ViewMode>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [readTime, setReadTime] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const { data: posts = [], isLoading } = trpc.admin.getAllBlogPosts.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const createPost = trpc.admin.createBlogPost.useMutation({
    onSuccess: () => {
      utils.admin.getAllBlogPosts.invalidate();
      utils.blog.getPublished.invalidate();
      toast.success("Blog post created!");
      resetForm();
      setView("list");
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePost = trpc.admin.updateBlogPost.useMutation({
    onSuccess: () => {
      utils.admin.getAllBlogPosts.invalidate();
      utils.blog.getPublished.invalidate();
      toast.success("Blog post updated!");
      resetForm();
      setView("list");
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePost = trpc.admin.deleteBlogPost.useMutation({
    onSuccess: () => {
      utils.admin.getAllBlogPosts.invalidate();
      utils.blog.getPublished.invalidate();
      toast.success("Blog post deleted");
    },
  });

  function resetForm() {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCategory("");
    setCoverImage("");
    setReadTime("");
    setStatus("draft");
    setEditingId(null);
  }

  function generateSlug(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function estimateReadTime(text: string) {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }

  function startEdit(post: typeof posts[0]) {
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || "");
    setContent(post.content);
    setCategory(post.category || "");
    setCoverImage(post.coverImage || "");
    setReadTime(post.readTime || "");
    setStatus(post.status);
    setEditingId(post.id);
    setView("edit");
  }

  function handleSave() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    const finalSlug = slug || generateSlug(title);
    const finalReadTime = readTime || estimateReadTime(content);

    if (view === "edit" && editingId) {
      updatePost.mutate({
        id: editingId,
        title,
        slug: finalSlug,
        excerpt: excerpt || undefined,
        content,
        category: category || undefined,
        coverImage: coverImage || undefined,
        readTime: finalReadTime,
        status,
      });
    } else {
      createPost.mutate({
        title,
        slug: finalSlug,
        excerpt: excerpt || undefined,
        content,
        category: category || undefined,
        coverImage: coverImage || undefined,
        readTime: finalReadTime,
        status,
      });
    }
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
          <p className="text-muted-foreground mb-4">You need admin privileges to access the blog editor.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Editor view
  if (view === "create" || view === "edit") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => { resetForm(); setView("list"); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Posts
            </button>
            <div className="flex items-center gap-3">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as "draft" | "published")}
                className="text-sm rounded-lg border border-border bg-background px-3 py-1.5 text-foreground"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <Button
                onClick={handleSave}
                disabled={createPost.isPending || updatePost.isPending}
                className="gap-2"
                size="sm"
              >
                <Save className="w-4 h-4" />
                {createPost.isPending || updatePost.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main editor */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    if (!editingId) setSlug(generateSlug(e.target.value));
                  }}
                  placeholder="Your article title..."
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="Brief summary for the blog listing..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Content <span className="text-muted-foreground font-normal">(Markdown supported)</span>
                </label>
                <textarea
                  value={content}
                  onChange={e => {
                    setContent(e.target.value);
                    setReadTime(estimateReadTime(e.target.value));
                  }}
                  placeholder="Write your article here... Use Markdown for formatting:&#10;&#10;## Heading&#10;**Bold text**&#10;- Bullet points&#10;[Link text](url)"
                  rows={20}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {content.trim().split(/\s+/).filter(Boolean).length} words · {readTime || estimateReadTime(content)}
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-sm text-foreground mb-4">Post Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Slug</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                      placeholder="auto-generated-from-title"
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder="e.g., Moving Tips, Neighborhood Guide"
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Cover Image URL</label>
                    <input
                      type="text"
                      value={coverImage}
                      onChange={e => setCoverImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {coverImage && (
                      <img src={coverImage} alt="Cover preview" className="mt-2 rounded-lg w-full h-32 object-cover" />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Read Time</label>
                    <input
                      type="text"
                      value={readTime}
                      onChange={e => setReadTime(e.target.value)}
                      placeholder="Auto-calculated"
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-sm text-foreground mb-2">Markdown Tips</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><code className="bg-muted px-1 rounded">## Heading</code> for sections</p>
                  <p><code className="bg-muted px-1 rounded">**bold**</code> for emphasis</p>
                  <p><code className="bg-muted px-1 rounded">- item</code> for bullet lists</p>
                  <p><code className="bg-muted px-1 rounded">[text](url)</code> for links</p>
                  <p><code className="bg-muted px-1 rounded">![alt](url)</code> for images</p>
                  <p><code className="bg-muted px-1 rounded">&gt; quote</code> for blockquotes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </button>
            <span className="text-border">|</span>
            <h1 className="font-semibold text-foreground">Blog Manager</h1>
            <span className="text-xs text-muted-foreground">({posts.length} posts)</span>
          </div>
          <Button onClick={() => { resetForm(); setView("create"); }} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-xl border border-border p-4">
                <div className="h-5 w-1/3 bg-muted rounded mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">
              {searchTerm ? "No posts match your search" : "No blog posts yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? "Try a different search term" : "Create your first blog post to get started"}
            </p>
            {!searchTerm && (
              <Button onClick={() => { resetForm(); setView("create"); }} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Post
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map(post => (
              <div
                key={post.id}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{post.title}</h3>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        post.status === "published"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {post.excerpt || post.content.slice(0, 120) + "..."}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {post.category && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {post.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime || "—"}
                      </span>
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {post.status === "published" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(post)}
                      className="gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete "${post.title}"?`)) {
                          deletePost.mutate({ id: post.id });
                        }
                      }}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
