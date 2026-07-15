"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const FLAGS: Record<Locale, string> = {
  et: "🇪🇪",
  en: "🇬🇧",
  ru: "🇷🇺",
  lv: "🇱🇻",
  lt: "🇱🇹",
};

const LABELS: Record<Locale, string> = {
  et: "Eesti",
  en: "English",
  ru: "Русский",
  lv: "Latviešu",
  lt: "Lietuvių",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(l: Locale) {
    setOpen(false);
    router.replace(
      // @ts-expect-error dynamic params are compatible at runtime
      { pathname, params },
      { locale: l }
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground hover:border-primary/60 hover:bg-surface-hover cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Vali keel"
      >
        <span className="text-base leading-none">{FLAGS[locale]}</span>
        <span className="hidden font-medium uppercase sm:inline">{locale}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          className="absolute right-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-md border border-border bg-header py-1 shadow-lg"
          role="listbox"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                onClick={() => pick(l)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-hover cursor-pointer",
                  locale === l ? "font-semibold text-primary" : "text-foreground"
                )}
                role="option"
                aria-selected={locale === l}
              >
                <span className="text-base leading-none">{FLAGS[l]}</span>
                {LABELS[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
