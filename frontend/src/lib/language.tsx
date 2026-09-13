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

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  text: (thai: string, english: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readLanguage(): AppLanguage {
  let language: AppLanguage;
  try {
    language = localStorage.getItem("tfd:language") === "th" ? "th" : "en";
  } catch {
    language = "en";
  }
  document.documentElement.lang = language;
  document.documentElement.dataset.language = language;
  return language;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<AppLanguage>(readLanguage);
  const setLanguage = useCallback((next: AppLanguage) => {
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
    try {
      localStorage.setItem("tfd:language", language);
    } catch {
      // The interface remains usable when browser storage is unavailable.
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
