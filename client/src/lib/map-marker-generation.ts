type MapMarker = { map?: unknown | null };

export class MapMarkerGeneration<TMap, TMarker extends MapMarker> {
  private map: TMap | null = null;
  private generation = 0;
  private markers: TMarker[] = [];

  attach(map: TMap): number {
    if (this.map !== map) {
      this.detachAll();
      this.map = map;
      this.generation += 1;
    }
    return this.generation;
  }

  current(): { map: TMap; generation: number } | null {
    return this.map === null
      ? null
      : { map: this.map, generation: this.generation };
  }

  isCurrent(map: TMap, generation: number): boolean {
    return this.map === map && this.generation === generation;
  }

  replace(map: TMap, generation: number, markers: TMarker[]): boolean {
    if (!this.isCurrent(map, generation)) {
      for (const marker of markers) marker.map = null;
      return false;
    }
    this.detachAll();
    this.markers = markers;
    return true;
  }

  clear(map: TMap, generation: number): boolean {
    if (!this.isCurrent(map, generation)) return false;
    this.detachAll();
    return true;
  }

  currentMarkers(): readonly TMarker[] {
    return this.markers;
  }

  unmount(): void {
    this.detachAll();
    this.map = null;
    this.generation += 1;
  }

  private detachAll(): void {
    for (const marker of this.markers) marker.map = null;
    this.markers = [];
  }
}
