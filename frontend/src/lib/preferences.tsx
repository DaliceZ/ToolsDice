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
  recent: ToolId[];
  toggleFavorite: (id: ToolId) => void;
  markRecent: (id: ToolId) => void;
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
  const [recent, setRecent] = useState<ToolId[]>(() => read("tfd:recent", []));

  useEffect(() => localStorage.removeItem("tfd:theme"), []);
  useEffect(
    () => localStorage.setItem("tfd:favorites", JSON.stringify(favorites)),
    [favorites],
  );
  useEffect(
    () => localStorage.setItem("tfd:recent", JSON.stringify(recent)),
    [recent],
  );

  const value = useMemo<Preferences>(
    () => ({
      favorites,
      recent,
      toggleFavorite: (id) =>
        setFavorites((items) =>
          items.includes(id)
            ? items.filter((item) => item !== id)
            : [...items, id],
        ),
      markRecent: (id) =>
        setRecent((items) =>
          [id, ...items.filter((item) => item !== id)].slice(0, 6),
        ),
    }),
    [favorites, recent],
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
