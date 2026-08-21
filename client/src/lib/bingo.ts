export interface BingoSquare {
  id: number;
  label: string;
  serviceKey?: string | null;
  category?: string | null;
}

export function parseBingoSquares(value: string): BingoSquare[] | null {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const ids = new Set<number>();
    const valid = parsed.every(square => {
      if (!square || typeof square !== "object") return false;
      const candidate = square as Record<string, unknown>;
      if (!Number.isInteger(candidate.id) || ids.has(candidate.id as number)) return false;
      ids.add(candidate.id as number);
      return typeof candidate.label === "string" &&
        candidate.label.trim().length > 0 &&
        (candidate.serviceKey === undefined || candidate.serviceKey === null || typeof candidate.serviceKey === "string") &&
        (candidate.category === undefined || candidate.category === null || typeof candidate.category === "string");
    });
    return valid ? parsed as BingoSquare[] : null;
  } catch {
    return null;
  }
}
