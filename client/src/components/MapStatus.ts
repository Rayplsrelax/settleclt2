import { createElement } from "react";

export type MapLoadStatus = "loading" | "error";

export function MapStatus({
  status,
  loadingLabel = "Loading map...",
  unavailableLabel = "Map unavailable",
  fallbackLabel =
    "Please use the address link on this page to open the address in Google Maps.",
}: {
  status: MapLoadStatus;
  loadingLabel?: string;
  unavailableLabel?: string;
  fallbackLabel?: string;
}) {
  if (status === "loading") {
    return createElement(
      "div",
      {
        role: "status",
        className:
          "absolute inset-0 z-10 flex items-center justify-center bg-muted text-muted-foreground",
      },
      loadingLabel
    );
  }

  return createElement(
    "div",
    {
      role: "alert",
      className:
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-muted px-6 text-center",
    },
    createElement("strong", { className: "text-foreground" }, unavailableLabel),
    createElement(
      "span",
      { className: "text-sm text-muted-foreground" },
      fallbackLabel
    )
  );
}
