import { ArrowUpRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/lib/language";
import { categoryName, toolDescription, toolName } from "@/lib/tool-locales";
import type { ToolDefinition } from "@/lib/tool-registry";
import { categoryStyles } from "@/lib/category-styles";
import { cn } from "@/lib/utils";

export function ToolCard({
  tool,
  favorite,
  onFavorite,
  backTo = "/",
}: {
  tool: ToolDefinition;
  favorite: boolean;
  onFavorite: () => void;
  backTo?: string;
}) {
  const { language, text } = useLanguage();
  const Icon = tool.icon;
  const style = categoryStyles[tool.category];

  return (
    <Card
      className={cn(
        "tool-card group relative grid min-h-[5.5rem] grid-cols-9 items-center gap-2 overflow-hidden bg-card p-2.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(92,67,45,0.10)] sm:min-h-[10rem] sm:grid-cols-1 sm:items-start sm:p-0",
        style.border,
      )}
    >
      <Link
        to={"/tools/" + tool.id}
        state={{ from: backTo }}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:rounded-2xl"
        aria-label={text("เปิด " + toolName(tool, language), "Open " + toolName(tool, language))}
      />
      <CardHeader className="contents sm:relative sm:z-[2] sm:flex sm:flex-row sm:items-start sm:justify-between sm:p-4 sm:pb-2">
        <span className={cn("relative z-[2] col-span-1 grid size-10 place-items-center rounded-xl sm:size-11", style.icon)}>
          <Icon size={20} aria-hidden="true" />
        </span>
        <Button
          className={cn(
            "relative z-10 col-span-1 col-start-9 row-start-1 rounded-xl sm:absolute sm:right-2 sm:top-2",
            favorite && "bg-amber-100 text-amber-700 hover:bg-amber-200",
          )}
          variant={favorite ? "outline" : "ghost"}
          size="icon"
          aria-label={
            favorite
              ? text("นำออกจากรายการโปรด: ", "Remove from favorites: ") + toolName(tool, language)
              : text("เพิ่มในรายการโปรด: ", "Add to favorites: ") + toolName(tool, language)
          }
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <Star size={17} className={cn(favorite && "fill-amber-500 text-amber-600")} />
        </Button>
      </CardHeader>
      <CardContent className="pointer-events-none relative z-[2] col-span-7 col-start-2 row-start-1 min-w-0 p-0 sm:col-span-1 sm:col-start-auto sm:row-start-auto sm:px-4 sm:pb-4">
        <Badge className={cn("hidden sm:inline-flex", style.icon)}>
          {categoryName(tool.category, language)}
        </Badge>
        <h2 className="text-sm font-bold leading-5 sm:mt-2 sm:text-base">
          {toolName(tool, language)}
        </h2>
        <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-muted-foreground sm:mt-1 sm:min-h-10 sm:line-clamp-2 sm:text-sm">
          {toolDescription(tool, language)}
        </p>
        <span className={cn("mt-2 hidden items-center gap-1.5 text-xs font-bold sm:inline-flex", style.eyebrow)}>
          {text("เปิดเครื่องมือ", "Open tool")}
          <ArrowUpRight size={15} aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
