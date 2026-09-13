import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage = "th" | "en";

const LANGUAGE_KEY = "tfd:language";
const LANGUAGE_SELECTED_KEY = "tfd:language-selected";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  text: (thai: string, english: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readLanguage(): AppLanguage {
  let language: AppLanguage;
  try {
    const storedLanguage = localStorage.getItem(LANGUAGE_KEY);
    const hasExplicitChoice = localStorage.getItem(LANGUAGE_SELECTED_KEY) === "true";
    language = hasExplicitChoice && storedLanguage === "en" ? "en" : "th";
  } catch {
    language = "th";
  }
  document.documentElement.lang = language;
  document.documentElement.dataset.language = language;
  return language;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<AppLanguage>(readLanguage);
  const setLanguage = useCallback((next: AppLanguage) => {
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
      localStorage.setItem(LANGUAGE_SELECTED_KEY, "true");
    } catch {
      // The selected language still applies for the current page.
    }
    document.documentElement.lang = next;
    document.documentElement.dataset.language = next;
    updateLanguage(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = language === "en"
        ? "Private text, image, PDF, data, and developer tools that work in your browser."
        : "เครื่องมือข้อความ รูปภาพ PDF ข้อมูล และนักพัฒนาที่ประมวลผลในเบราว์เซอร์";
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      text: (thai: string, english: string) =>
        language === "th" ? thai : english,
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
