import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ToolCard } from "@/components/ToolCard";
import { Input } from "@/components/ui/input";
import { useRuntimeConfig } from "@/lib/api";
import { categoryStyles } from "@/lib/category-styles";
import { useLanguage } from "@/lib/language";
import { categoryDescriptions, categoryName, categorySlugs, toolDescription, toolName } from "@/lib/tool-locales";
import { usePreferences } from "@/lib/preferences";
import { categories, tools, type ToolCategory } from "@/lib/tool-registry";
import { cn } from "@/lib/utils";

const toolCategories = categories.filter(
  (category): category is ToolCategory => category !== "ทั้งหมด",
);

export function CategoryPage() {
  const { categorySlug } = useParams();
  const { language, text } = useLanguage();
  const { favorites, toggleFavorite } = usePreferences();
  const { config } = useRuntimeConfig();
  const [query, setQuery] = useState("");
  const category = toolCategories.find((item) => categorySlugs[item] === categorySlug);

  const categoryTools = useMemo(() => {
    if (!category) return [];
    const search = query.trim().toLocaleLowerCase(language);
    return tools.filter((tool) => {
      if (tool.category !== category || !config.enabledToolIds.includes(tool.id)) return false;
      if (!search) return true;
      return [
        toolName(tool, language),
        toolDescription(tool, language),
        tool.id,
        ...tool.keywords,
      ]
        .join(" ")
        .toLocaleLowerCase(language)
        .includes(search);
    });
  }, [category, config.enabledToolIds, language, query]);

  if (!category) return <Navigate to="/" replace />;

  const style = categoryStyles[category];
  const Icon = tools.find((tool) => tool.category === category)?.icon;

  return (
    <div className="category-page mx-auto max-w-[1120px]">
      <div className="category-back-sticky">
        <Link
          to="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={17} />
          {text("กลับไปภาพรวม", "Back to overview")}
        </Link>
      </div>

      <header className={cn("category-page-header", style.section)}>
        {Icon && (
          <span className={cn("category-page-icon", style.icon)}>
            <Icon size={27} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs font-bold uppercase tracking-[0.12em]", style.eyebrow)}>
            {text("หมวดหมู่", "Category")}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            {categoryName(category, language)}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {categoryDescriptions[category][language]}
          </p>
        </div>
        <span className={cn("hidden shrink-0 rounded-full px-3 py-1.5 text-sm font-bold sm:inline-flex", style.icon)}>
          {tools.filter((tool) => tool.category === category && config.enabledToolIds.includes(tool.id)).length}
          {" "}{text("เครื่องมือ", "tools")}
        </span>
      </header>

      <div className="category-tools-toolbar">
        <label className="category-filter">
          <Search aria-hidden="true" size={19} />
          <span className="sr-only">{text("ค้นหาในหมวดนี้", "Search this category")}</span>
          <Input
            type="search"
            aria-label={text("ค้นหาในหมวดนี้", "Search this category")}
            placeholder={text("ค้นหาในหมวดนี้…", "Search in this category…")}
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <p className="text-xs text-muted-foreground sm:text-sm" aria-live="polite">
          {categoryTools.length} {text("รายการที่ตรงกัน", "matching tools")}
        </p>
      </div>

      {categoryTools.length ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {categoryTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              backTo={`/categories/${categorySlugs[category]}`}
              favorite={favorites.includes(tool.id)}
              onFavorite={() => toggleFavorite(tool.id)}
            />
          ))}
        </div>
      ) : (
        <div className="category-empty" role="status">
          <Search aria-hidden="true" size={23} />
          <p className="font-bold">{text("ไม่พบเครื่องมือ", "No tools found")}</p>
          <p className="text-sm text-muted-foreground">
            {text("ลองใช้คำค้นหาอื่นในหมวดนี้", "Try another search in this category.")}
          </p>
        </div>
      )}
    </div>
  );
}
