import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ToolId } from "./tool-registry";

type Preferences = {
  favorites: ToolId[];
  toggleFavorite: (id: ToolId) => void;
};

const PreferenceContext = createContext<Preferences | null>(null);
const read = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<ToolId[]>(() =>
    read("tfd:favorites", []),
  );

  useEffect(() => {
    try {
      localStorage.removeItem("tfd:recent");
    } catch {
      // Preferences remain available in memory when storage is disabled.
    }
  }, []);
  useEffect(
    () => {
      try {
        localStorage.setItem("tfd:favorites", JSON.stringify(favorites));
      } catch {
        // Favorites remain available in memory when storage is disabled.
      }
    },
    [favorites],
  );

  const value = useMemo<Preferences>(
    () => ({
      favorites,
      toggleFavorite: (id) =>
        setFavorites((items) =>
          items.includes(id)
            ? items.filter((item) => item !== id)
            : [...items, id],
        ),
    }),
    [favorites],
  );
  return (
    <PreferenceContext.Provider value={value}>
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferenceContext);
  if (!context)
    throw new Error("usePreferences must be used inside PreferencesProvider");
  return context;
}
