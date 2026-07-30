import { type ReactNode, useEffect, useRef, useState } from "react";

interface DeferredSectionProps {
  children: ReactNode;
  minHeight: number;
}

export default function DeferredSection({
  children,
  minHeight,
}: DeferredSectionProps) {
  const [isNearViewport, setIsNearViewport] = useState(false);
  const boundaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!boundary || isNearViewport) return;

    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "100px 0px" }
    );

    observer.observe(boundary);
    return () => observer.disconnect();
  }, [isNearViewport]);

  return (
    <div
      ref={boundaryRef}
      style={isNearViewport ? undefined : { minHeight }}
      aria-busy={!isNearViewport}
    >
      {isNearViewport ? children : null}
    </div>
  );
}
