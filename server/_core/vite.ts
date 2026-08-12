import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { injectCspNonce } from "./csp-nonce";

const HOME_HERO_IMAGE =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663270161707/YJZXYMWOczYLllKW.jpg";

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
      const routeTemplate = injectRoutePreloads(template, req.path);
      const page = injectCspNonce(routeTemplate, res.locals.cspNonce);
      res.status(status).type("html").send(page);
    } catch (error) {
      next(error);
    }
  });
}
