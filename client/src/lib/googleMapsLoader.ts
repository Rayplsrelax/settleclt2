const MAPS_BASE_URL = "https://maps.googleapis.com";

export function buildGoogleMapsScriptUrl(apiKey?: string) {
  const normalizedKey = apiKey?.trim();
  if (!normalizedKey || normalizedKey === "undefined") {
    throw new Error("Google Maps is not configured");
  }

  const url = new URL("/maps/api/js", MAPS_BASE_URL);
  url.searchParams.set("key", normalizedKey);
  url.searchParams.set("v", "weekly");
  url.searchParams.set("libraries", "marker,geocoding");
  url.searchParams.set("loading", "async");
  return url.toString();
}
