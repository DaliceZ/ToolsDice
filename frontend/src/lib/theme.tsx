import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const themes = [
  { id: "classic", label: "Classic", detail: "Cream & terracotta", color: "#fff9f0" },
  { id: "dark", label: "Dark", detail: "Slate & periwinkle", color: "#17191f" },
  { id: "exclusive", label: "Exclusive", detail: "Midnight & gold", color: "#171223" },
  { id: "matcha", label: "Matcha", detail: "Sage & soft green", color: "#f4f7ee" },
  { id: "volcano", label: "Volcano", detail: "Fire red, orange & charcoal", color: "#171310" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeIds = new Set<string>(themes.map(({ id }) => id));

function readTheme(): ThemeId {
  let theme: ThemeId;
  try {
    const saved = localStorage.getItem("tfd:theme");
    theme = saved === "sunset"
      ? "volcano"
      : saved && themeIds.has(saved)
        ? (saved as ThemeId)
        : "classic";
  } catch {
    theme = "classic";
  }
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useState<ThemeId>(readTheme);
  const setTheme = useCallback((next: ThemeId) => {
    document.documentElement.dataset.theme = next;
    updateTheme(next);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
      "content",
      themes.find((item) => item.id === theme)?.color ?? themes[0].color,
    );
    try {
      localStorage.setItem("tfd:theme", theme);
    } catch {
      // Theme selection still works for this page when browser storage is unavailable.
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
