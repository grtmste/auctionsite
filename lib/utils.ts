import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/i18n/routing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "1 650,00 €" — Estonian EUR format (space thousands, comma decimal) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

const DATE_LOCALE_MAP: Record<string, string> = {
  et: "et-EE",
  en: "en-GB",
  ru: "ru-RU",
  lv: "lv-LV",
  lt: "lt-LT",
};

/** "12. juuli 2026 kell 17:00" */
export function formatDateTime(date: Date | string, locale = "et"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const intlLocale = DATE_LOCALE_MAP[locale] ?? "et-EE";
  const datePart = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Tallinn",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("et-EE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Tallinn",
  }).format(d);
  const connector = locale === "et" ? " kell " : ", ";
  return `${datePart}${connector}${timePart}`;
}

export function formatDate(date: Date | string, locale = "et"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(DATE_LOCALE_MAP[locale] ?? "et-EE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Tallinn",
  }).format(d);
}

/** "Jaan Kask" -> "J.K." — bidder privacy on public pages */
export function toInitials(name?: string | null): string {
  if (!name?.trim()) return "•.•.";
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0].toUpperCase() + ".")
      .join("") || "•.•."
  );
}

export type LocalizedJson = Partial<Record<Locale, string>> | null | undefined;

/** Pick a value from a {et, en, ru, lv, lt} JSON field with ET fallback */
export function localized(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as Record<string, unknown>;
  const candidate = obj[locale] ?? obj["et"] ?? Object.values(obj)[0];
  return typeof candidate === "string" ? candidate : "";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äå]/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/õ/g, "o")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function appUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path}`;
}
