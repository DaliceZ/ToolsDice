import { useMemo, useState } from "react";
import { ArrowUpRight, Clock3, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRuntimeConfig } from "@/lib/api";
import { categoryStyles } from "@/lib/category-styles";
import {
  categories,
  tools,
  type ToolCategory,
  type ToolDefinition,
} from "@/lib/tool-registry";
import { usePreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const toolIconUrl =
  "https://yqkdvluuiuxbnekwrcou.supabase.co/storage/v1/object/public/pics/icon/toolicon.png";
const toolCategories = categories.filter(
  (category): category is ToolCategory => category !== "ทั้งหมด",
);
const categoryDescriptions: Record<ToolCategory, string> = {
  ข้อความ: "จัดรูปแบบ นับ และเปรียบเทียบข้อความ",
  วันเวลา: "แปลงเขตเวลาและคำนวณช่วงเวลา",
  ข้อมูล: "ตรวจและแปลงข้อมูล JSON กับ YAML",
  นักพัฒนา: "เครื่องมือรวดเร็วสำหรับงานพัฒนา",
  เอกสาร: "จัดการหน้า PDF ภายใน browser",
};

export function Dashboard() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"ทั้งหมด" | ToolCategory>("ทั้งหมด");
  const { favorites, recent, toggleFavorite } = usePreferences();
  const { config } = useRuntimeConfig();

  const filtered = useMemo(
    () =>
      tools.filter((tool) => {
        const query = search.toLocaleLowerCase().trim();
        const categoryMatches =
          category === "ทั้งหมด" || tool.category === category;
        const searchMatches =
          !query ||
          [tool.name, tool.description, tool.category, ...tool.keywords]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query);
        return (
          config.enabledToolIds.includes(tool.id) &&
          categoryMatches &&
          searchMatches
        );
      }),
    [search, category, config.enabledToolIds],
  );

  const groups = toolCategories
    .map((name) => ({
      name,
      tools: filtered.filter((tool) => tool.category === name),
    }))
    .filter((group) => group.tools.length > 0);

  return (
    <div className="mx-auto max-w-[1440px]">
      <section className="glass-panel relative mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgb(23_25_29/.78)_0%,rgb(16_18_22/.72)_48%,rgb(16_43_76/.68)_100%)] px-4 py-4 text-white sm:mb-6 sm:rounded-[2rem] sm:px-6 sm:py-7 md:px-9 md:py-9">
        <div className="hero-orb absolute -right-20 -top-28 size-80 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="hero-line absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end md:gap-7">
          <div>
            <div className="mb-2.5 flex items-center gap-3 sm:mb-5 sm:gap-4">
              <span className="grid size-10 place-items-center overflow-hidden rounded-xl border border-white/15 bg-white/10 shadow-xl sm:size-16 sm:rounded-2xl">
                <img
                  src={toolIconUrl}
                  alt="ToolsDice"
                  width="64"
                  height="64"
                  className="size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </span>
              <div>
                <h1 className="text-[1.75rem] font-black tracking-tight sm:text-4xl md:text-6xl">
                  Tools
                </h1>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-blue-50/70 sm:text-base sm:leading-7">
              ใช้ฟรี จาก Dalalight
            </p>
          </div>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="glass-panel mb-4 overflow-hidden rounded-xl border border-white/10 bg-card/65 px-3 py-2.5 sm:mb-6 sm:rounded-2xl sm:p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <h2 className="mr-1 flex shrink-0 items-center gap-1.5 text-xs font-bold text-blue-100 sm:mr-2 sm:gap-2 sm:text-sm">
              <Clock3 size={16} />
              ใช้ล่าสุด
            </h2>
            {recent.map((id) => {
              const tool = tools.find((item) => item.id === id);
              return tool ? (
                <Link
                  key={id}
                  to={`/tools/${id}`}
                  className="shrink-0 rounded-full border border-blue-100/10 bg-blue-900/70 px-2.5 py-1 text-xs text-white transition hover:border-blue-500 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  {tool.name}
                </Link>
              ) : null;
            })}
          </div>
        </section>
      )}

      <section className="glass-panel sticky top-[4.25rem] z-10 mb-5 rounded-xl border border-white/10 bg-[#111418]/72 p-2 sm:mb-7 sm:rounded-2xl sm:p-3 lg:top-[4.75rem]">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
          <label className="relative flex-1">
            <span className="sr-only">ค้นหาเครื่องมือ</span>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700/50 dark:text-blue-200/50"
              size={19}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหา เช่น JSON, เวลา, PDF…"
              className="border-blue-900/10 bg-blue-50/60 pl-10 dark:border-blue-200/10 dark:bg-blue-950/50"
            />
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:gap-2 lg:pb-0">
            {categories.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={category === item ? "default" : "outline"}
                className="shrink-0 px-2.5 text-xs sm:px-3 sm:text-sm"
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {groups.length ? (
        <div className="space-y-4 sm:space-y-7">
          {groups.map((group) => {
            const style = categoryStyles[group.name];
            return (
              <section
                key={group.name}
                className={cn(
                  "glass-panel tool-section overflow-hidden rounded-2xl border p-2.5 sm:p-4 md:rounded-[1.75rem] md:p-6",
                  style.section,
                )}
              >
                <header className="mb-2.5 flex items-end justify-between gap-3 px-0.5 pt-0.5 sm:mb-5 sm:gap-4 sm:px-0 sm:pt-0">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <span
                      className={cn("h-9 w-1 shrink-0 rounded-full sm:h-11 sm:w-1.5", style.accent)}
                    />
                    <div>
                      <p
                        className={cn(
                          "hidden text-xs font-black uppercase tracking-[0.16em] sm:block",
                          style.eyebrow,
                        )}
                      >
                        Category
                      </p>
                      <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                        {group.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                        {categoryDescriptions[group.name]}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn("hidden shrink-0 sm:inline-flex", style.icon)}>
                    {group.tools.length} เครื่องมือ
                  </Badge>
                </header>
                <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {group.tools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      favorite={favorites.includes(tool.id)}
                      onFavorite={() => toggleFavorite(tool.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-blue-700/25 bg-white p-12 text-center dark:bg-blue-950/50">
          <Search className="mx-auto mb-3 text-muted-foreground" />
          <h2 className="font-bold">ไม่พบเครื่องมือ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ลองเปลี่ยนคำค้นหาหรือเลือกหมวดทั้งหมด
          </p>
        </div>
      )}
    </div>
  );
}

function ToolCard({
  tool,
  favorite,
  onFavorite,
}: {
  tool: ToolDefinition;
  favorite: boolean;
  onFavorite: () => void;
}) {
  const Icon = tool.icon;
  const style = categoryStyles[tool.category];
  return (
    <Card
      className={cn(
        "glass-card tool-card group relative grid min-h-0 grid-cols-[2.25rem_minmax(0,1fr)_2.5rem] items-start gap-x-3 overflow-hidden bg-card/62 p-3 transition duration-300 hover:shadow-xl hover:shadow-black/25 sm:block sm:min-h-56 sm:p-0",
        style.border,
      )}
    >
      <Link
        to={`/tools/${tool.id}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        aria-label={`เปิด ${tool.name}`}
      />
      <span className={cn("absolute inset-x-0 top-0 h-1", style.accent)} />
      <CardHeader className="contents sm:relative sm:z-[2] sm:flex sm:flex-row sm:items-start sm:justify-between sm:p-5 sm:pb-3">
        <span
          className={cn(
            "relative z-[2] col-start-1 row-start-1 grid size-9 place-items-center rounded-xl transition-transform group-hover:scale-105 sm:size-12 sm:rounded-2xl",
            style.icon,
          )}
        >
          <Icon size={19} className="sm:size-[23px]" />
        </span>
        <Button
          className="relative z-10 col-start-3 row-start-1"
          variant="ghost"
          size="icon"
          aria-label={`${favorite ? "เลิกปักหมุด" : "ปักหมุด"} ${tool.name}`}
          onClick={onFavorite}
        >
          <Star
            size={18}
            className={cn(favorite && "fill-amber-400 text-amber-500")}
          />
        </Button>
      </CardHeader>
      <CardContent className="pointer-events-none relative z-[2] col-start-2 row-start-1 min-w-0 p-0 sm:p-5 sm:pt-2">
        <Badge className={cn(style.icon)}>{tool.category}</Badge>
        <h3 className="mt-2 text-[15px] font-black sm:mt-3 sm:text-lg">{tool.name}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-muted-foreground sm:mt-1 sm:min-h-12 sm:text-sm sm:leading-6">
          {tool.description}
        </p>
        <span
          className={cn(
            "mt-2 hidden items-center gap-1.5 text-xs font-bold sm:mt-4 sm:inline-flex sm:gap-2 sm:text-sm",
            style.eyebrow,
          )}
        >
          เปิดเครื่องมือ{" "}
          <ArrowUpRight
            size={16}
            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
      </CardContent>
    </Card>
  );
}
