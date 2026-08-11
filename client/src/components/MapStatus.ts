import { createElement } from "react";

export type MapLoadStatus = "loading" | "error";

export function MapStatus({ status }: { status: MapLoadStatus }) {
  if (status === "loading") {
    return createElement(
      "div",
      {
        role: "status",
        className:
          "absolute inset-0 z-10 flex items-center justify-center bg-muted text-muted-foreground",
      },
      "Loading map..."
    );
  }

  return createElement(
    "div",
    {
      role: "alert",
      className:
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-muted px-6 text-center",
    },
    createElement("strong", { className: "text-foreground" }, "Map unavailable"),
    createElement(
      "span",
      { className: "text-sm text-muted-foreground" },
      "Please use the address link on this page to open the address in Google Maps."
    )
  );
}
