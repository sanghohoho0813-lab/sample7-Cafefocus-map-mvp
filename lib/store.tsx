"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface ToastItem {
  id: number;
  message: string;
  action?: { label: string; href: string };
}

interface AppState {
  favorites: string[];
  recent: string[];
  compare: string[];
  toasts: ToastItem[];
  hydrated: boolean;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addRecent: (id: string) => void;
  toggleCompare: (id: string) => void;
  inCompare: (id: string) => boolean;
  clearCompare: () => void;
  showToast: (message: string, action?: ToastItem["action"]) => void;
  dismissToast: (id: number) => void;
}

const AppContext = createContext<AppState | null>(null);

function load(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function save(key: string, value: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — 데모에서는 무시
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const toastId = useRef(0);

  useEffect(() => {
    setFavorites(load("cf:favorites"));
    setRecent(load("cf:recent"));
    setCompare(load("cf:compare"));
    setHydrated(true);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, action?: ToastItem["action"]) => {
      const id = ++toastId.current;
      setToasts((prev) => [...prev.slice(-2), { id, message, action }]);
      window.setTimeout(() => dismissToast(id), 3000);
    },
    [dismissToast]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = prev.includes(id)
          ? prev.filter((v) => v !== id)
          : [...prev, id];
        save("cf:favorites", next);
        return next;
      });
    },
    []
  );

  const addRecent = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((v) => v !== id)].slice(0, 5);
      save("cf:recent", next);
      return next;
    });
  }, []);

  const toggleCompare = useCallback(
    (id: string) => {
      setCompare((prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((v) => v !== id);
          save("cf:compare", next);
          return next;
        }
        if (prev.length >= 3) {
          showToast("비교는 최대 3개까지 가능해요.");
          return prev;
        }
        const next = [...prev, id];
        save("cf:compare", next);
        return next;
      });
    },
    [showToast]
  );

  const clearCompare = useCallback(() => {
    setCompare([]);
    save("cf:compare", []);
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );
  const inCompare = useCallback((id: string) => compare.includes(id), [compare]);

  return (
    <AppContext.Provider
      value={{
        favorites,
        recent,
        compare,
        toasts,
        hydrated,
        toggleFavorite,
        isFavorite,
        addRecent,
        toggleCompare,
        inCompare,
        clearCompare,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
