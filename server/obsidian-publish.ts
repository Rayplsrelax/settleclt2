import type { Express, Request, Response } from "express";
import { z } from "zod";
import { createBlogPost, getBlogPostBySlug, updateBlogPost } from "./db";

const publishPayloadSchema = z.object({
  title: z.string().trim().min(1).max(512),
  slug: z.string().trim().max(512).optional(),
  filename: z.string().trim().optional(),
  publish: z.boolean(),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.string().trim().optional(),
  date: z.string().trim().optional(),
  category: z.string().trim().max(128).optional(),
  excerpt: z.string().optional(),
  content: z.string().trim().min(1),
  coverImage: z.string().trim().max(1024).optional(),
  readTime: z.string().trim().max(32).optional(),
});

type PublishPayload = z.infer<typeof publishPayloadSchema>;

type PublishResult = {
  success: true;
  action: "created" | "updated" | "unpublished" | "skipped";
  slug: string;
};

export function isValidPublishSecret(secret: unknown): boolean {
  const configuredSecret = process.env.OBSIDIAN_PUBLISH_SECRET;
  return typeof secret === "string" && !!configuredSecret && secret === configuredSecret;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 512);
}

function resolveSlug(input: Pick<PublishPayload, "slug" | "title" | "filename">): string {
  const fromSlug = input.slug?.trim();
  if (fromSlug) return slugify(fromSlug);

  const filenameBase = input.filename?.replace(/\.md$/i, "").trim();
  if (filenameBase) return slugify(filenameBase);

  return slugify(input.title);
}

function parsePublishedAt(status: "draft" | "published", publishedAt?: string, date?: string): Date | null {
  if (status !== "published") return null;

  const dateString = publishedAt || date;
  if (!dateString) return new Date();

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function getAuthorId(): number {
  const configured = Number.parseInt(process.env.OBSIDIAN_PUBLISH_AUTHOR_ID || "1", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 1;
}

function optionalString(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function publishObsidianPost(rawInput: unknown): Promise<PublishResult> {
  const input = publishPayloadSchema.parse(rawInput);
  const slug = resolveSlug(input);
  if (!slug) {
    throw new Error("Unable to derive a slug from slug, filename, or title");
  }

  const existingPost = await getBlogPostBySlug(slug);

  if (!input.publish) {
    if (existingPost) {
      await updateBlogPost(existingPost.id, {
        status: "draft",
        publishedAt: null,
      });
      return { success: true, action: "unpublished", slug };
    }

    return { success: true, action: "skipped", slug };
  }

  const status = input.status ?? "draft";
  const postData = {
    title: input.title,
    slug,
    excerpt: optionalString(input.excerpt),
    content: input.content,
    category: optionalString(input.category),
    coverImage: optionalString(input.coverImage),
    status,
    readTime: optionalString(input.readTime),
    publishedAt: parsePublishedAt(status, input.publishedAt, input.date),
  };

  if (existingPost) {
    await updateBlogPost(existingPost.id, postData);
    return { success: true, action: "updated", slug };
  }

  await createBlogPost({
    ...postData,
    authorId: getAuthorId(),
  });
  return { success: true, action: "created", slug };
}

export function registerObsidianPublishRoute(app: Express) {
  app.post("/api/obsidian/publish", async (req: Request, res: Response) => {
    try {
      const secret = req.header("x-publish-secret") || req.header("authorization")?.replace(/^Bearer\s+/i, "");
      if (!isValidPublishSecret(secret)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await publishObsidianPost(req.body);
      return res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid Obsidian publish payload",
          issues: error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })),
        });
      }

      console.error("[Obsidian Publish] Failed to publish post:", error);
      return res.status(500).json({ error: "Failed to publish Obsidian post" });
    }
  });
}
