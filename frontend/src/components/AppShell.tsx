import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Dice5,
  Languages,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChoiceMenu, type Choice } from "@/components/ChoiceMenu";
import { useRuntimeConfig } from "@/lib/api";
import { useLanguage } from "@/lib/language";
import { themes, useTheme, type ThemeId } from "@/lib/theme";
import { categoryName, categorySlugs, toolDescription, toolName } from "@/lib/tool-locales";
import { categories, tools, type ToolCategory } from "@/lib/tool-registry";
import { categoryStyles } from "@/lib/category-styles";
import { cn } from "@/lib/utils";

function LanguageMenu({
  language,
  setLanguage,
}: {
  language: "th" | "en";
  setLanguage: (language: "th" | "en") => void;
}) {
  const { text } = useLanguage();
  const choices: Choice[] = [
    { value: "th", label: "ไทย", compact: "ไทย", detail: "Sarabun" },
    { value: "en", label: "English", compact: "EN", detail: "Poppins" },
  ];
  return (
    <ChoiceMenu
      label={text("เปลี่ยนภาษา", "Language")}
      value={language}
      icon={Languages}
      choices={choices}
      onSelect={(value) => setLanguage(value as "th" | "en")}
    />
  );
}

function ThemeMenu() {
  const { language, text } = useLanguage();
  const { theme, setTheme } = useTheme();
  const choices: Choice[] = themes.map((item) => ({
    value: item.id,
    label: item.label,
    compact: item.label,
    detail: language === "en" ? item.detail : {
      classic: "ครีมและสีน้ำตาลอิฐ",
      dark: "สเลตและม่วงอ่อน",
      exclusive: "มิดไนต์และสีทอง",
      matcha: "เขียวเสจและมัทฉะ",
      volcano: "แดง ส้ม และดำ",
    }[item.id],
    colors: {
      classic: ["#fff9f0", "#91452e", "#e9d9c8"],
      dark: ["#15171d", "#a59af5", "#3c414d"],
      exclusive: ["#171223", "#d7b66b", "#48395f"],
      matcha: ["#f3f7ef", "#49744d", "#d0dfcb"],
      volcano: ["#171310", "#e55336", "#f2943d"],
    }[item.id],
  }));
  return (
    <ChoiceMenu
      label={text("เปลี่ยนธีม", "Theme")}
      value={theme}
      icon={Palette}
      choices={choices}
      onSelect={(value) => setTheme(value as ThemeId)}
    />
  );
}

const toolCategories = categories.filter(
  (category): category is ToolCategory => category !== "ทั้งหมด",
);

export function AppShell({ children }: { children: ReactNode }) {
  const { language, setLanguage, text } = useLanguage();
  const { config } = useRuntimeConfig();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeTool = tools.find(
    (tool) => location.pathname === "/tools/" + tool.id,
  );
  const activeCategory = activeTool?.category ?? toolCategories.find(
    (category) => location.pathname === "/categories/" + categorySlugs[category],
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<ToolCategory>>(
    () => new Set(activeCategory ? [activeCategory] : []),
  );
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarStyle = useMemo(
    () => ({ "--sidebar-width": sidebarCollapsed ? "5rem" : "21rem" }) as CSSProperties,
    [sidebarCollapsed],
  );

  useLayoutEffect(() => {
    if (location.pathname.startsWith("/categories/")) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.key, location.pathname]);

  useEffect(() => {
    if (activeCategory) {
      setExpandedCategories((current) => new Set(current).add(activeCategory));
    }
  }, [activeCategory]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        menuButtonRef.current?.focus({ preventScroll: true });
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const desktopLayout = window.matchMedia("(min-width: 1024px)");
    const closeWhenInactive = () => {
      if (document.hidden || desktopLayout.matches) setMobileOpen(false);
    };
    const closeWhenWindowLosesFocus = () => setMobileOpen(false);
    document.addEventListener("visibilitychange", closeWhenInactive);
    desktopLayout.addEventListener("change", closeWhenInactive);
    window.addEventListener("blur", closeWhenWindowLosesFocus);
    closeWhenInactive();
    return () => {
      document.removeEventListener("visibilitychange", closeWhenInactive);
      desktopLayout.removeEventListener("change", closeWhenInactive);
      window.removeEventListener("blur", closeWhenWindowLosesFocus);
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.key]);

  const toggleCategory = (category: ToolCategory) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const closeMobile = () => {
    menuButtonRef.current?.focus({ preventScroll: true });
    setMobileOpen(false);
  };
  const toggleMobile = () => setMobileOpen((value) => !value);

  return (
    <div className="app-shell min-h-screen overflow-x-clip" style={sidebarStyle}>
      <div className="ambient-scene" aria-hidden="true">
        <span className="ambient-planet ambient-planet-one" />
        <span className="ambient-planet ambient-planet-two" />
        <span className="ambient-orbit ambient-orbit-one" />
        <span className="ambient-orbit ambient-orbit-two" />
        <span className="ambient-cube">
          <i className="cube-face cube-front" />
          <i className="cube-face cube-side" />
          <i className="cube-face cube-top" />
        </span>
      </div>

      <a className="skip-link" href="#main-content">
        {text("ข้ามไปยังเนื้อหา", "Skip to content")}
      </a>

      <header className="app-topbar glass-shell sticky top-0 z-50 flex h-[76px] items-center justify-between gap-2 border-b border-border/80 px-3 sm:gap-3 sm:px-6 lg:h-[84px]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            className="shell-icon-button inline-grid lg:hidden"
            aria-label={mobileOpen ? text("ปิดเมนู", "Close menu") : text("เปิดเมนู", "Open menu")}
            aria-expanded={mobileOpen}
            aria-controls="tools-sidebar"
            onClick={toggleMobile}
          >
            {mobileOpen ? <X size={19} /> : <Menu size={20} />}
          </button>
          <button
            type="button"
            className="sidebar-edge-toggle shell-icon-button hidden lg:inline-grid"
            aria-label={
              sidebarCollapsed
                ? text("ขยายแถบด้านข้าง", "Expand sidebar")
                : text("ย่อแถบด้านข้าง", "Collapse sidebar")
            }
            aria-pressed={sidebarCollapsed}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 rounded-xl text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="ToolsDice"
          >
            <span className="brand-die grid size-10 shrink-0 place-items-center rounded-2xl">
              <img
                className="brand-mark"
                src="https://yqkdvluuiuxbnekwrcou.supabase.co/storage/v1/object/public/pics/icon/logo2.png"
                alt=""
                width="30"
                height="30"
              />
            </span>
            <span className="brand-name text-[30px] leading-none font-bold tracking-tight">ToolsDice</span>
          </Link>
        </div>

        <div
          className="topbar-actions flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5"
          aria-hidden={mobileOpen}
          inert={mobileOpen}
        >
          <LanguageMenu language={language} setLanguage={setLanguage} />
          <ThemeMenu />
          <a
            className="portfolio-link"
            href="https://www.dalalight.online/"
            target="_blank"
            rel="noreferrer"
          >
            <BriefcaseBusiness aria-hidden="true" size={17} />
            <span>Me</span>
            <ArrowUpRight aria-hidden="true" className="portfolio-arrow" size={14} />
          </a>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="nav-scrim fixed inset-0 z-30 bg-[#30251e]/20 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
          onClick={closeMobile}
        />
      )}

      <aside
        id="tools-sidebar"
        className={cn(
          "sidebar-scroll glass-shell fixed bottom-0 left-0 top-[76px] z-40 flex w-[min(21rem,65vw)] flex-col border-r border-border/80 transition-[width,transform] duration-300 ease-out lg:top-[84px] lg:w-[var(--sidebar-width)] lg:translate-x-0",
          mobileOpen
            ? "visible translate-x-0 shadow-[18px_0_48px_rgba(76,54,38,0.12)]"
            : "invisible -translate-x-full lg:visible lg:shadow-none",
        )}
        aria-label={text("แถบเมนูเครื่องมือ", "Tools navigation")}
      >
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label={text("หมวดหมู่", "Categories")}>
          <div className="mb-4 flex min-w-0 items-center gap-1">
            <Link
              to="/"
              onClick={closeMobile}
              className={cn(
                "sidebar-home flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-3",
                location.pathname === "/" && "sidebar-home-active",
                sidebarCollapsed && "lg:justify-center lg:px-0",
              )}
              title={sidebarCollapsed ? text("ภาพรวม", "Overview") : undefined}
            >
              <Dice5 aria-hidden="true" size={18} />
              <span className={cn("sidebar-primary-label truncate", sidebarCollapsed && "lg:hidden")}>
                {text("ภาพรวม", "Overview")}
              </span>
            </Link>
          </div>

          <div className={cn("mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.13em] text-muted-foreground", sidebarCollapsed && "lg:hidden")}>
            {text("หมวดหมู่", "Categories")}
          </div>
          <div className="space-y-2">
            {toolCategories.map((category) => {
              const icon = tools.find((tool) => tool.category === category)?.icon ?? Dice5;
              const Icon = icon;
              const categoryTools = tools.filter(
                (tool) => tool.category === category && config.enabledToolIds.includes(tool.id),
              );
              const expanded = expandedCategories.has(category);
              const style = categoryStyles[category];
              const groupId = "sidebar-category-" + categorySlugs[category];
              return (
                <section key={category} className="min-w-0">
                  <div className={cn("sidebar-category-row flex min-h-11 items-center gap-1 rounded-xl px-2", sidebarCollapsed && "lg:justify-center lg:px-0")}>
                    <button
                      type="button"
                      title={sidebarCollapsed ? categoryName(category, language) : undefined}
                      className={cn(
                        "sidebar-category-main flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1.5 text-left",
                        sidebarCollapsed && "lg:flex-none lg:justify-center lg:px-0",
                        activeCategory === category && "text-foreground",
                      )}
                      aria-expanded={expanded}
                      aria-controls={groupId}
                      onClick={() => {
                        if (sidebarCollapsed) setSidebarCollapsed(false);
                        toggleCategory(category);
                      }}
                    >
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", style.icon)}>
                        <Icon size={17} />
                      </span>
                      <span className={cn("sidebar-primary-label min-w-0 flex-1 truncate", sidebarCollapsed && "lg:hidden")}>
                        {categoryName(category, language)}
                      </span>
                      <span className={cn("mr-1 text-[11px] font-medium text-muted-foreground", sidebarCollapsed && "lg:hidden")}>
                        {categoryTools.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={cn("sidebar-disclosure inline-grid", sidebarCollapsed && "lg:hidden")}
                      aria-label={
                        (expanded ? text("ซ่อนเครื่องมือในหมวด", "Hide tools in ") : text("แสดงเครื่องมือในหมวด", "Show tools in ")) +
                        " " + categoryName(category, language)
                      }
                      aria-expanded={expanded}
                      aria-controls={groupId}
                      onClick={() => toggleCategory(category)}
                    >
                      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                  {expanded && !sidebarCollapsed && (
                    <div id={groupId} className="sidebar-tool-list mt-1 ml-5 space-y-1 border-l border-border/80 pl-3">
                      {categoryTools.map((tool) => (
                        <NavLink
                          key={tool.id}
                          to={"/tools/" + tool.id}
                          state={{ from: "/" }}
                          onClick={closeMobile}
                          className={({ isActive }) =>
                            cn("sidebar-tool-link flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px]", isActive && "sidebar-tool-link-active")
                          }
                          title={toolDescription(tool, language)}
                        >
                          <tool.icon aria-hidden="true" className="shrink-0 opacity-75" size={15} />
                          <span className="min-w-0 truncate">{toolName(tool, language)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </nav>
      </aside>

      <main
        id="main-content"
        className="relative z-10 min-h-[calc(100vh-76px)] px-4 py-5 sm:px-6 sm:py-7 lg:min-h-[calc(100vh-84px)] lg:py-9 lg:pl-[var(--sidebar-width)]"
        aria-hidden={mobileOpen}
        inert={mobileOpen}
      >
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
