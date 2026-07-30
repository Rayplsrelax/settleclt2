import PageLayout from "@/components/PageLayout";
import DOMPurify from "dompurify";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, Clock, User, BookOpen, Home, Compass, ArrowRight } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import { Button } from "@/components/ui/button";
import CommentSection from "@/components/CommentSection";
import { useSEO } from "@/hooks/useSEO";
import { useStructuredData, buildArticleSchema, buildBreadcrumbSchema } from "@/hooks/useStructuredData";

function renderMarkdown(md: string): string {
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-foreground mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-foreground mt-8 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-foreground mt-8 mb-4">$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img loading="lazy" src="$2" alt="$1" class="rounded-lg my-4 max-w-full" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:text-primary/80" target="_blank" rel="noopener">$1</a>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/30 pl-4 py-1 my-4 text-muted-foreground italic">$1</blockquote>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-foreground/90">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-6 border-border" />')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="text-foreground/90 leading-relaxed mb-4">')
    // Single newlines
    .replace(/\n/g, '<br />');
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  useSEO({
    title: post?.title || "Blog Article",
    description: post?.excerpt || "Read this article on Settle CLT — your guide to living in Charlotte, NC.",
    keywords: post ? `${post.category}, Charlotte NC, ${post.title.split(' ').slice(0, 3).join(', ')}` : "Charlotte blog",
    path: slug ? `/blog/${slug}` : "/blog",
    ogImage: post?.coverImage || undefined,
    ogType: "article",
  });

  useStructuredData(
    post
      ? [
          {
            "@context": "https://schema.org",
            ...buildBreadcrumbSchema([
              { name: "Home", url: "https://settleclt.com" },
              { name: "Blog", url: "https://settleclt.com/blog" },
              { name: post.title, url: `https://settleclt.com/blog/${slug}` },
            ]),
          },
          {
            "@context": "https://schema.org",
            ...buildArticleSchema({
              title: post.title,
              description: post.excerpt || "",
              slug: slug || "",
              publishedAt: post.publishedAt ?? undefined,
              imageUrl: post.coverImage ?? undefined,
            }),
          },
        ]
      : null
  );

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </PageLayout>
    );
  }

  if (!post) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">This article may have been removed or doesn't exist.</p>
            <Link href="/blog">
              <Button className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const htmlContent = renderMarkdown(post.content);

  return (
    <PageLayout>
      {/* Hero */}
      {post.coverImage ? (
        <div className="relative h-64 md:h-80">
          <img loading="eager" fetchPriority="high" src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-clt-navy to-clt-teal-dark" />
      )}

      <div className="container max-w-3xl -mt-16 relative z-10 pb-16">
        {/* Back link */}
        <Link href="/blog" className="no-underline">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            All Articles
          </span>
        </Link>

        {/* Article header */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-8 mb-8">
          {post.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              {post.category}
            </span>
          )}
          <h1 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl text-foreground leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{post.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric"
                })}
              </span>
            )}
            {post.readTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            )}
          </div>
          <div className="mt-4">
            <ShareButtons title={post.title} description={post.excerpt || undefined} />
          </div>
        </div>

        {/* Article content */}
        <article
          className="prose prose-lg max-w-none text-foreground/90 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              `<p class="text-foreground/90 leading-relaxed mb-4">${htmlContent}</p>`,
              { ADD_ATTR: ["target", "rel", "loading"] }
            )
          }}
        />

        {/* End-of-Article CTAs */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link href="/quiz" className="no-underline">
            <div className="group rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 hover:border-primary/40 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Find Your Neighborhood</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Take our 2-minute quiz to discover which Charlotte neighborhood fits your lifestyle.</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                Take the Quiz <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
          <Link href="/relocation-checklist?source=blog" className="no-underline">
            <div className="group rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 hover:border-emerald-300 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-emerald-700 transition-colors">Moving to Charlotte?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Use the 30/60/90 checklist to plan neighborhoods, timing, and next steps.</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                Open Checklist <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {/* Comments */}
        <div className="mt-12 pt-8 border-t border-border">
          <CommentSection targetType="service" targetId={`blog-${post.slug}`} />
        </div>

        {/* Back to blog */}
        <div className="mt-12 text-center">
          <Link href="/blog">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to All Articles
            </Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
