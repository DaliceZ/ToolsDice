import { useEffect, useRef, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CHOICE_MENU_OPEN_EVENT = "toolsdice:choice-menu-open";

export type Choice = {
  value: string;
  label: string;
  compact: string;
  detail?: string;
  colors?: string[];
};

export function ChoiceMenu({
  label,
  value,
  icon: Icon,
  choices,
  onSelect,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  choices: Choice[];
  onSelect: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = choices.find((choice) => choice.value === value) ?? choices[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onOpenAnotherMenu = (event: Event) => {
      const owner = (event as CustomEvent<HTMLDivElement | null>).detail;
      if (owner !== rootRef.current) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const activeIndex = optionRefs.current.findIndex((item) => item === document.activeElement);
        const start = activeIndex < 0 ? (event.key === "ArrowDown" ? -1 : 0) : activeIndex;
        const next = (start + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length;
        event.preventDefault();
        optionRefs.current[next]?.focus();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        optionRefs.current[event.key === "Home" ? 0 : choices.length - 1]?.focus();
      } else if (event.key === "Tab") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener(CHOICE_MENU_OPEN_EVENT, onOpenAnotherMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener(CHOICE_MENU_OPEN_EVENT, onOpenAnotherMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [choices.length, open]);

  const showMenu = () => {
    document.dispatchEvent(
      new CustomEvent(CHOICE_MENU_OPEN_EVENT, { detail: rootRef.current }),
    );
    setOpen(true);
    window.setTimeout(() => optionRefs.current[0]?.focus(), 0);
  };

  return (
    <div className={cn("choice-menu", open && "choice-menu-open", className)} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="choice-menu-trigger"
        aria-label={`${label}: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${label}: ${current.label}`}
        onClick={() => open ? setOpen(false) : showMenu()}
      >
        <Icon aria-hidden="true" size={17} />
        <span className="choice-menu-current">{current.compact}</span>
        <ChevronDown aria-hidden="true" className="choice-menu-chevron" size={14} />
      </button>
      {open && (
        <div className="choice-menu-popover" role="menu" aria-label={label}>
          {choices.map((choice, index) => (
            <button
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              role="menuitemradio"
              aria-checked={choice.value === value}
              aria-label={choice.label}
              data-choice-value={choice.value}
              className="choice-menu-option"
              key={choice.value}
              onClick={() => {
                onSelect(choice.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              {choice.colors && (
                <span className="choice-menu-swatches" aria-hidden="true">
                  {choice.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}
                </span>
              )}
              <span className="choice-menu-option-copy">
                <span>{choice.label}</span>
                {choice.detail && <small>{choice.detail}</small>}
              </span>
              {choice.value === value && <span className="choice-menu-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
