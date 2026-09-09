import { useState, type ReactNode } from "react";
import { ExternalLink, LayoutGrid, Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { categoryStyles } from "@/lib/category-styles";
import { categories, tools, type ToolCategory } from "@/lib/tool-registry";
import { cn } from "@/lib/utils";

const toolIconUrl =
  "https://yqkdvluuiuxbnekwrcou.supabase.co/storage/v1/object/public/pics/icon/toolicon.png";
const toolCategories = categories.filter(
  (category): category is ToolCategory => category !== "ทั้งหมด",
);

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      {open && (
        <button
          aria-label="ปิดเมนู"
          className="nav-scrim fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "glass-shell fixed inset-y-0 left-0 z-40 flex w-[min(84vw,272px)] -translate-x-full flex-col border-r border-white/10 bg-[#0d0f12]/82 text-white shadow-2xl shadow-black/45 transition-transform duration-300 ease-out will-change-transform lg:sticky lg:top-0 lg:h-screen lg:w-[280px] lg:translate-x-0 lg:shadow-none",
          open && "translate-x-0",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-3 lg:h-16 lg:px-4">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-950 shadow-lg shadow-black/25 lg:size-10">
              <img
                src={toolIconUrl}
                alt=""
                width="48"
                height="48"
                className="size-full object-cover"
                referrerPolicy="no-referrer"
              />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm tracking-tight lg:text-base">
                ToolsDice
              </strong>
              <span className="block max-w-36 truncate text-[11px] text-blue-100/55">
                Everyday utility toolkit
              </span>
            </span>
          </Link>
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="ปิดเมนู"
          >
            <X size={20} />
          </Button>
        </div>

        <nav
          aria-label="เครื่องมือ"
          className="flex-1 overflow-y-auto px-2.5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-3 lg:py-4"
        >
          <section className="mb-4 lg:mb-5">
            <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-900/40 dark:text-blue-100/40">
              Overview
            </p>
            <NavLink
              to="/"
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex min-h-10 items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] font-semibold transition-colors lg:gap-3 lg:px-3 lg:py-2.5 lg:text-sm",
                  isActive
                    ? "bg-blue-950 text-white shadow-md dark:bg-[#172c4a] dark:text-blue-100"
                    : "text-blue-950/65 hover:bg-blue-100 dark:text-white/55 dark:hover:bg-white/[0.055]",
                )
              }
            >
              <LayoutGrid size={18} />
              เครื่องมือทั้งหมด
            </NavLink>
          </section>

          {toolCategories.map((category) => {
            const style = categoryStyles[category];
            return (
              <section key={category} className="mb-4 lg:mb-5">
                <div className="mb-1.5 flex items-center gap-2 px-3">
                  <span className={cn("size-2 rounded-full", style.accent)} />
                  <h2
                    className={cn(
                      "text-[11px] font-black uppercase tracking-[0.14em]",
                      style.eyebrow,
                    )}
                  >
                    {category}
                  </h2>
                </div>
                <div className="border-l border-blue-900/10 pl-2 dark:border-blue-200/10">
                  {tools
                    .filter((tool) => tool.category === category)
                    .map((tool) => (
                      <NavLink
                        key={tool.id}
                        to={`/tools/${tool.id}`}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "my-0.5 flex min-h-9 items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] transition-colors lg:gap-3 lg:px-3 lg:py-2 lg:text-sm",
                            isActive
                              ? cn(style.icon, "font-bold")
                              : "text-blue-950/60 hover:bg-blue-100/70 hover:text-blue-950 dark:text-white/50 dark:hover:bg-white/[0.055] dark:hover:text-white",
                          )
                        }
                      >
                        <tool.icon size={16} className="shrink-0" />
                        <span className="truncate">{tool.name}</span>
                      </NavLink>
                    ))}
                </div>
              </section>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="glass-shell sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 bg-[#090a0c]/68 px-4 text-white lg:h-16 md:px-6">
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu size={21} />
          </Button>
          <a
            href="https://www.dalalight.online/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.055] px-3 text-xs font-semibold text-white/80 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition hover:border-blue-300/25 hover:bg-blue-400/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:text-sm"
          >
            ผลงาน
            <ExternalLink size={14} />
          </a>
        </header>
        <main className="grid-noise min-h-[calc(100vh-3.5rem)] px-5 py-4 lg:min-h-[calc(100vh-4rem)] md:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
