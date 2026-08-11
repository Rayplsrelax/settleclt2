import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MapStatus } from "../client/src/components/MapStatus";
import { buildGoogleMapsScriptUrl } from "../client/src/lib/googleMapsLoader";

describe("Google Maps client loader", () => {
  it("fails closed when the browser key is missing or unresolved", () => {
    for (const value of [undefined, "", "   ", "undefined"]) {
      expect(() => buildGoogleMapsScriptUrl(value)).toThrow(
        "Google Maps is not configured"
      );
    }
  });

  it("requests only the libraries used by Settle CLT", () => {
    const url = new URL(buildGoogleMapsScriptUrl("test-browser-key"));

    expect(url.origin).toBe("https://maps.googleapis.com");
    expect(url.pathname).toBe("/maps/api/js");
    expect(url.searchParams.get("key")).toBe("test-browser-key");
    expect(url.searchParams.get("libraries")).toBe("marker,geocoding");
    expect(url.searchParams.get("loading")).toBe("async");
    expect(url.searchParams.get("v")).toBe("weekly");
  });
});

describe("Google Maps status panel", () => {
  it("announces map loading progress", () => {
    const html = renderToStaticMarkup(
      createElement(MapStatus, { status: "loading" })
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("Loading map");
  });

  it("announces a useful fallback when the map fails", () => {
    const html = renderToStaticMarkup(
      createElement(MapStatus, { status: "error" })
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Map unavailable");
    expect(html).toContain("open the address in Google Maps");
  });
});

describe("MapView integration", () => {
  it("connects loader failures to accessible loading and error states", () => {
    const source = readFileSync(
      resolve(__dirname, "../client/src/components/Map.tsx"),
      "utf-8"
    ).replace(/\s+/g, " ");

    expect(source).toContain('from "@/lib/googleMapsLoader"');
    expect(source).toContain('from "@/components/MapStatus"');
    expect(source).toContain('useState<MapViewStatus>("loading")');
    expect(source).toContain("buildGoogleMapsScriptUrl(API_KEY)");
    expect(source).toContain('setStatus("ready")');
    expect(source).toContain('setStatus("error")');
    expect(source).toContain('status !== "ready" && <MapStatus status={status} />');
  });
});
