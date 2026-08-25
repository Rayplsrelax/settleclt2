import { describe, expect, it } from "vitest";
import { MapMarkerGeneration } from "../client/src/lib/map-marker-generation";

type Marker = { map: object | null };

describe("Directory map marker generation lifecycle", () => {
  it("detaches old-instance markers and rejects stale synchronization", () => {
    const registry = new MapMarkerGeneration<object, Marker>();
    const mapA = { id: "A" };
    const mapB = { id: "B" };
    const markerA = { map: mapA };
    const staleMarker = { map: mapA };
    const markerB = { map: mapB };

    const generationA = registry.attach(mapA);
    expect(registry.replace(mapA, generationA, [markerA])).toBe(true);

    const generationB = registry.attach(mapB);
    expect(markerA.map).toBeNull();
    expect(generationB).toBeGreaterThan(generationA);

    expect(registry.replace(mapA, generationA, [staleMarker])).toBe(false);
    expect(staleMarker.map).toBeNull();
    expect(registry.replace(mapB, generationB, [markerB])).toBe(true);
    expect(registry.currentMarkers()).toEqual([markerB]);
  });

  it("only lets the current effect cleanup detach current markers", () => {
    const registry = new MapMarkerGeneration<object, Marker>();
    const mapA = {};
    const mapB = {};
    const markerB = { map: mapB };
    const generationA = registry.attach(mapA);
    const generationB = registry.attach(mapB);
    registry.replace(mapB, generationB, [markerB]);

    expect(registry.clear(mapA, generationA)).toBe(false);
    expect(markerB.map).toBe(mapB);
    expect(registry.clear(mapB, generationB)).toBe(true);
    expect(markerB.map).toBeNull();
  });

  it("detaches marker map references on unmount", () => {
    const registry = new MapMarkerGeneration<object, Marker>();
    const map = {};
    const marker = { map };
    const generation = registry.attach(map);
    registry.replace(map, generation, [marker]);

    registry.unmount();

    expect(marker.map).toBeNull();
    expect(registry.current()).toBeNull();
    expect(registry.currentMarkers()).toEqual([]);
  });
});
