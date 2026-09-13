import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, ArrowUpRight, Check, Search, Star, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useRuntimeConfig } from "@/lib/api";
import { categoryStyles } from "@/lib/category-styles";
import { useLanguage } from "@/lib/language";
import {
  categoryDescriptions,
  categoryName,
  categorySlugs,
  toolDescription,
  toolName,
} from "@/lib/tool-locales";
import { usePreferences } from "@/lib/preferences";
import { categories, tools, type ToolCategory, type ToolDefinition } from "@/lib/tool-registry";
import { cn } from "@/lib/utils";

const toolCategories = categories.filter(
  (category): category is ToolCategory => category !== "ทั้งหมด",
);

export function Dashboard() {
  const { language, text } = useLanguage();
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = usePreferences();
  const { config } = useRuntimeConfig();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const enabledTools = useMemo(
    () => tools.filter((tool) => config.enabledToolIds.includes(tool.id)),
    [config.enabledToolIds],
  );
  const favoriteTools = useMemo(
    () => enabledTools.filter((tool) => favorites.includes(tool.id)),
    [enabledTools, favorites],
  );

  const suggestions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(language);
    if (!query) return [];
    return enabledTools
      .map((tool) => {
        const name = toolName(tool, language).toLocaleLowerCase(language);
        const description = toolDescription(tool, language).toLocaleLowerCase(language);
        const category = categoryName(tool.category, language).toLocaleLowerCase(language);
        const keywords = tool.keywords.map((word) => word.toLocaleLowerCase(language));
        const score = name.startsWith(query)
          ? 0
          : name.includes(query)
            ? 1
            : category.startsWith(query)
              ? 2
              : keywords.some((word) => word.startsWith(query))
                ? 3
                : keywords.some((word) => word.includes(query))
                  ? 4
                  : description.includes(query)
                    ? 5
                    : 99;
        return { tool, score };
      })
      .filter((item) => item.score < 99)
      .sort((a, b) => a.score - b.score)
      .slice(0, 7)
      .map((item) => item.tool);
  }, [enabledTools, language, search]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen]);

  useEffect(() => setActiveSuggestion(0), [search]);

  const openTool = (tool: ToolDefinition) => {
    setSearchOpen(false);
    navigate("/tools/" + tool.id, { state: { from: "/" } });
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setActiveSuggestion((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setActiveSuggestion((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" && suggestions[activeSuggestion]) {
      event.preventDefault();
      openTool(suggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSearch("");
      setSearchOpen(false);
      window.requestAnimationFrame(() => searchButtonRef.current?.focus());
    }
  };

  return (
    <div className="dashboard-page mx-auto max-w-[1280px]">
      <section className="dashboard-hero">
        <div className="hero-stage" aria-label="ToolsDice">
          <div className="hero-title-wrap">
            <div className="orbit-field" aria-hidden="true">
              <span className="orbit-track orbit-track-one"><i className="electron" /></span>
              <span className="orbit-track orbit-track-two"><i className="electron" /></span>
              <span className="orbit-track orbit-track-three"><i className="electron" /></span>
              <span className="orbit-track orbit-track-four"><i className="electron" /></span>
              <span className="orbit-track orbit-track-five"><i className="electron" /></span>
            </div>
            <h1 className="hero-title">ToolsDice</h1>
          </div>
        </div>
        <p className="hero-subtitle">
          {text(
            "เครื่องมือใช้ง่าย ทำงานไว และเก็บข้อมูลไว้ในเบราว์เซอร์ของคุณ",
            "Friendly tools that work fast and keep your data in this browser.",
          )}
        </p>

        <div
          ref={searchRef}
          className={cn("search-launcher", searchOpen && "search-launcher-open")}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setSearchOpen(false);
            }
          }}
        >
          <button
            ref={searchButtonRef}
            type="button"
            className="search-icon-button"
            aria-label={text("ค้นหาเครื่องมือ", "Search tools")}
            aria-expanded={searchOpen}
            aria-hidden={searchOpen}
            inert={searchOpen}
            tabIndex={searchOpen ? -1 : 0}
            onClick={() => setSearchOpen(true)}
          >
            <Search aria-hidden="true" size={23} />
          </button>
          <div className="search-autocomplete" aria-hidden={!searchOpen} inert={!searchOpen}>
              <div className="search-field" role="search">
                <Search aria-hidden="true" className="search-field-icon" size={22} />
                <input
                  ref={inputRef}
                  type="search"
                  role="combobox"
                  aria-label={text("ค้นหาเครื่องมือ", "Search tools")}
                  aria-autocomplete="list"
                  aria-expanded={suggestions.length > 0}
                  aria-controls="tool-search-suggestions"
                  tabIndex={searchOpen ? 0 : -1}
                  aria-activedescendant={
                    suggestions[activeSuggestion]
                      ? "tool-suggestion-" + suggestions[activeSuggestion].id
                      : undefined
                  }
                  autoComplete="off"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder={text("ลองค้นหา JSON, รูปภาพ, นับคำ…", "Try JSON, images, word count…")}
                />
                {search ? (
                  <button
                    type="button"
                    className="search-clear-button"
                    aria-label={text("ล้างคำค้นหา", "Clear search")}
                    tabIndex={searchOpen ? 0 : -1}
                    onClick={() => setSearch("")}
                  >
                    <X size={17} />
                  </button>
                ) : (
                  <kbd className="search-shortcut hidden sm:inline-flex">ESC</kbd>
                )}
              </div>
              {suggestions.length > 0 && (
                <ul id="tool-search-suggestions" className="search-suggestions" role="listbox">
                  {suggestions.map((tool, index) => {
                    const Icon = tool.icon;
                    const style = categoryStyles[tool.category];
                    return (
                      <li key={tool.id} role="presentation">
                        <button
                          id={"tool-suggestion-" + tool.id}
                          type="button"
                          role="option"
                          aria-selected={index === activeSuggestion}
                          className={cn(
                            "search-suggestion",
                            index === activeSuggestion && "search-suggestion-active",
                          )}
                          tabIndex={searchOpen ? 0 : -1}
                          onMouseEnter={() => setActiveSuggestion(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => openTool(tool)}
                        >
                          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", style.icon)}>
                            <Icon size={19} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate font-bold">{toolName(tool, language)}</span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {categoryName(tool.category, language)} · {toolDescription(tool, language)}
                            </span>
                          </span>
                          <ArrowUpRight className="shrink-0 text-muted-foreground" size={16} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {search.trim() && suggestions.length === 0 && (
                <div className="search-empty" role="status">
                  {text("ยังไม่พบเครื่องมือ ลองใช้คำค้นอื่น", "No tools found. Try another search.")}
                </div>
              )}
          </div>
        </div>
      </section>

      <section className="favorites-panel" aria-labelledby="favorites-heading">
        <header className="favorites-heading-row">
          <span className="favorites-icon">
            <Star size={20} className="fill-current" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="favorites-heading" className="text-lg font-bold sm:text-xl">
                {text("รายการโปรด", "Favorites")}
              </h2>
              <Badge className="favorites-count">
                {favoriteTools.length} {text("รายการ", "saved")}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {text("รวมเครื่องมือที่คุณอยากกลับมาใช้บ่อยๆ", "Keep the tools you reach for close by.")}
            </p>
          </div>
        </header>
        {favoriteTools.length > 0 ? (
          <div className="favorite-tools-row">
            {favoriteTools.map((tool) => {
              const Icon = tool.icon;
              const style = categoryStyles[tool.category];
              return (
                <div className={cn("favorite-tool-card", style.border)} key={tool.id}>
                  <Link to={"/tools/" + tool.id} state={{ from: "/" }} className="favorite-tool-link">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", style.icon)}>
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{toolName(tool, language)}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {categoryName(tool.category, language)}
                      </span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-amber-700" />
                  </Link>
                  <button
                    type="button"
                    className="favorite-remove"
                    aria-label={text("นำออกจากรายการโปรด: ", "Remove from favorites: ") + toolName(tool, language)}
                    onClick={() => toggleFavorite(tool.id)}
                  >
                    <Check size={15} />
                    <span className="sr-only">{text("บันทึกแล้ว", "Saved")}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="favorites-empty">
            <span className="favorites-empty-star"><Star size={19} /></span>
            <span>
              <strong className="block text-sm">{text("ปักหมุดเครื่องมือที่ใช้บ่อย", "Pin your go-to tools")}</strong>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                {text("กดไอคอนดาวบนการ์ดเครื่องมือ แล้วรายการโปรดจะอยู่ตรงนี้", "Tap the star on any tool to keep it here.")}
              </span>
            </span>
          </div>
        )}
      </section>

      <section className="category-overview" aria-labelledby="categories-heading">
        <header className="category-overview-heading">
          <div>
            <span className="section-eyebrow">{text("เลือกให้ตรงกับสิ่งที่ทำ", "Pick what you need")}</span>
            <h2 id="categories-heading" className="mt-1 text-xl font-bold sm:text-2xl">
              {text("สำรวจ 9 หมวดหมู่", "Explore 9 categories")}
            </h2>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {enabledTools.length} {text("เครื่องมือพร้อมใช้", "tools ready")}
          </span>
        </header>
        <div className="category-overview-grid">
          {toolCategories.map((category) => {
            const Icon = tools.find((tool) => tool.category === category)?.icon;
            const style = categoryStyles[category];
            const count = enabledTools.filter((tool) => tool.category === category).length;
            return (
              <Link
                key={category}
                to={"/categories/" + categorySlugs[category]}
                className={cn("category-overview-card", style.section)}
              >
                <span className={cn("category-overview-icon", style.icon)}>
                  {Icon && <Icon size={22} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="category-overview-name">{categoryName(category, language)}</span>
                  <span className="category-overview-description">
                    {categoryDescriptions[category][language]}
                  </span>
                  <span className={cn("category-overview-count", style.eyebrow)}>
                    {count} {text("เครื่องมือ", "tools")}
                  </span>
                </span>
                <ArrowUpRight
                  className={cn("category-overview-arrow", style.eyebrow)}
                  size={19}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
