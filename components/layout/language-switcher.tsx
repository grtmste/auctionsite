"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
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

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  return (
    <div className="flex items-center gap-0.5">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() =>
            router.replace(
              // @ts-expect-error dynamic params are compatible at runtime
              { pathname, params },
              { locale: l }
            )
          }
          className={cn(
            "rounded px-1 py-0.5 text-base leading-none transition-opacity cursor-pointer",
            locale === l ? "opacity-100 ring-1 ring-primary/60" : "opacity-45 hover:opacity-90"
          )}
          aria-label={l.toUpperCase()}
          title={l.toUpperCase()}
        >
          {FLAGS[l]}
        </button>
      ))}
    </div>
  );
}
