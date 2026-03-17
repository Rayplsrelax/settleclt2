import { useState, useCallback } from "react";

const STORAGE_KEY = "settle-clt-my-neighborhood";

export function useMyNeighborhood() {
  const [myNeighborhood, setMyNeighborhoodState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setMyNeighborhood = useCallback((id: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
      setMyNeighborhoodState(id);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const clearMyNeighborhood = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setMyNeighborhoodState(null);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return { myNeighborhood, setMyNeighborhood, clearMyNeighborhood };
}
