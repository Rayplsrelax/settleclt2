import { useEffect } from "react";

export const IMAGE_FALLBACK_SRC = "/images/photo-placeholder.svg";

export function applyImageFallback(image: HTMLImageElement) {
  if (image.dataset.imageFallbackApplied === "true") {
    return false;
  }

  image.dataset.imageFallbackApplied = "true";
  image.removeAttribute("srcset");
  image.src = IMAGE_FALLBACK_SRC;
  return true;
}

export function useImageFallbacks() {
  useEffect(() => {
    const handleImageError = (event: Event) => {
      if (event.target instanceof HTMLImageElement) {
        applyImageFallback(event.target);
      }
    };

    document.addEventListener("error", handleImageError, true);
    return () => document.removeEventListener("error", handleImageError, true);
  }, []);
}
