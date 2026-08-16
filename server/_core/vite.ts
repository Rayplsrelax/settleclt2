import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { injectCspNonce } from "./csp-nonce";
import { resolveRouteSeo } from "./route-seo";

const HOME_HERO_IMAGE = "/images/hero-charlotte-skyline.webp";
const SITE_URL = "https://settleclt.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Inject per-route SEO metadata (canonical, title, description, OG) into the
 * SPA shell so crawlers see correct metadata on the first, un-hydrated fetch.
 */
export function injectRouteSeo(
  template: string,
  requestPath: string,
  blogTitles?: Map<string, string>
) {
  const seo = resolveRouteSeo(requestPath, blogTitles);
  const canonical = `${SITE_URL}${requestPath === "/" ? "/" : requestPath.replace(/\/+$/, "")}`;
  const fullTitle = seo.title.endsWith("Settle CLT")
    ? seo.title
    : `${seo.title} | Settle CLT`;

  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`)
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${canonical}" />`
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeHtml(seo.description)}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${escapeHtml(seo.description)}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${canonical}" />`
    );
}

export function injectRoutePreloads(template: string, requestPath: string) {
  if (requestPath !== "/") return template;

  return template.replace(
    "</head>",
    `  <link rel="preload" as="image" href="${HOME_HERO_IMAGE}" fetchpriority="high" />\n  </head>`
  );
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      template = injectRoutePreloads(template, req.path);
      template = injectRouteSeo(template, req.path);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath, { index: false }));

  // fall through to index.html if the file doesn't exist
  // Resolve the HTTP status based on the SPA route classifier so that
  // genuinely unknown paths return 404 instead of 200.
  app.use("*", async (req, res, next) => {
    const { resolveSpaStatus, getProductionLookups } = await import(
      "./spa-route-status"
    );
    let lookups;
    try {
      lookups = await getProductionLookups();
    } catch {
      // no DB available — optimistic
    }
    try {
      const status = await resolveSpaStatus(req.originalUrl, lookups);
      const template = await fs.promises.readFile(
        path.resolve(distPath, "index.html"),
        "utf-8"
      );
      let routeTemplate = injectRoutePreloads(template, req.path);
      // Blog titles come from the database; resolve asynchronously before
      // the sync SEO resolver runs.
      let blogTitles: Map<string, string> | undefined;
      const blogMatch = req.path.match(/^\/blog\/([^/]+)$/);
      if (blogMatch && status === 200) {
        try {
          const { getBlogPostBySlug } = await import("../db");
          const slug = decodeURIComponent(blogMatch[1]);
          const post = await getBlogPostBySlug(slug);
          if (post?.title) {
            blogTitles = new Map([[slug, post.title]]);
          }
        } catch {
          // DB unavailable — fall back to generic blog metadata
        }
      }
      routeTemplate = injectRouteSeo(
        routeTemplate,
        status === 404 ? "/404" : req.path,
        blogTitles
      );
      // Preview hosts intentionally run without production CSP, so the
      // security middleware mints no nonce for them; serve the template
      // unmodified rather than failing the response.
      const page = res.locals.cspNonce
        ? injectCspNonce(routeTemplate, res.locals.cspNonce)
        : routeTemplate;
      res.status(status).type("html").send(page);
    } catch (error) {
      next(error);
    }
  });
}
