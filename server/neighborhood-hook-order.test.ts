import React from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { allNeighborhoods } from "@shared/neighborhoods";

const probe = vi.hoisted(() => ({ id: "missing-neighborhood", canonicals: [] as string[] }));

vi.mock("wouter", () => ({
  useParams: () => ({ id: probe.id }),
  Link: ({ children }: { children: React.ReactNode }) => React.createElement("a", null, children),
}));
vi.mock("@/hooks/useSEO", () => ({
  useSEO: (options: { path: string }) => probe.canonicals.push(options.path),
}));
vi.mock("@/hooks/useStructuredData", () => ({
  useStructuredData: vi.fn(),
  buildBreadcrumbSchema: (items: unknown) => ({ itemListElement: items }),
}));
vi.mock("@/hooks/useMyNeighborhood", () => ({
  useMyNeighborhood: () => ({ myNeighborhood: null, setMyNeighborhood: vi.fn(), clearMyNeighborhood: vi.fn() }),
}));
vi.mock("@/hooks/useTagTracking", () => ({
  useTagTrackingWithLookup: () => ({ trackClickByName: vi.fn() }),
}));
vi.mock("@/i18n/I18nContext", () => ({
  useI18n: () => ({ locale: "en", t: (key: string) => key }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: { enrichment: { getAll: { useQuery: () => ({ data: [] }) } } },
}));
vi.mock("@/components/Map", () => ({ MapView: () => null }));
vi.mock("@/components/PageLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));
vi.mock("@/components/CommentSection", () => ({ default: () => null }));
vi.mock("@/components/ReviewSection", () => ({ default: () => null }));
vi.mock("@/components/ShareButtons", () => ({ default: () => null }));
vi.mock("@/pages/NotFound", () => ({ NotFoundContent: () => React.createElement("div", null, "missing") }));
vi.mock("recharts", () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

import NeighborhoodDetail from "../client/src/pages/NeighborhoodDetail";

describe("NeighborhoodDetail hook ordering across navigation", () => {
  it("rerenders missing → valid → missing without hook-count failure and keeps canonical state aligned", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      }
    );
    probe.canonicals.length = 0;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let renderer: ReturnType<typeof create>;

    await act(async () => {
      renderer = create(React.createElement(NeighborhoodDetail as React.ComponentType<{ revision: number }>, { revision: 0 }));
    });
    expect(probe.canonicals.at(-1)).toBe("/404");

    probe.id = allNeighborhoods[0].id;
    await expect(
      act(async () => {
        renderer.update(React.createElement(NeighborhoodDetail as React.ComponentType<{ revision: number }>, { revision: 1 }));
      })
    ).resolves.toBeUndefined();
    expect(probe.canonicals.at(-1)).toBe(`/neighborhood/${probe.id}`);

    probe.id = "missing-neighborhood";
    await expect(
      act(async () => {
        renderer.update(React.createElement(NeighborhoodDetail as React.ComponentType<{ revision: number }>, { revision: 2 }));
      })
    ).resolves.toBeUndefined();
    expect(probe.canonicals.at(-1)).toBe("/404");
    expect(error.mock.calls.flat().join(" ")).not.toMatch(/Rendered (more|fewer) hooks|change in the order of Hooks/i);

    renderer!.unmount();
    error.mockRestore();
  });
});