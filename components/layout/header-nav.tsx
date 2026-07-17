"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Menu, X, User } from "lucide-react";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { PersonalOffer } from "@/components/personal-offer";

interface HeaderNavProps {
  user: { name: string; isAdmin: boolean; isVendor: boolean } | null;
  logoUrl?: string | null;
}

export function HeaderNav({ user, logoUrl }: HeaderNavProps) {
  const t = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const auctionLinks = [
    { href: "/autooksjonid", label: t("carAuctions") },
    { href: "/varuosad", label: t("partsAuctions") },
    { href: "/muud", label: t("otherAuctions") },
  ];
  const infoLinks = [
    { href: "/reeglid", label: t("rules") },
    { href: "/kkk", label: t("faq") },
    { href: "/privaatsuspoliitika", label: t("privacy") },
  ];

  const dropdown = (id: string, label: string, links: { href: string; label: string }[]) => (
    <div
      className="relative"
      onMouseEnter={() => setOpenDropdown(id)}
      onMouseLeave={() => setOpenDropdown(null)}
    >
      <button
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
        onClick={() => setOpenDropdown(openDropdown === id ? null : id)}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {openDropdown === id && (
        <div className="absolute left-0 top-full z-50 min-w-52 rounded-md border border-border bg-header py-1 shadow-xl">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-2.5 text-sm text-muted hover:bg-surface hover:text-foreground"
              onClick={() => setOpenDropdown(null)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-header/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="shrink-0">
          <Logo imageUrl={logoUrl} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center lg:flex">
          {dropdown("auctions", t("auctions"), auctionLinks)}
          <Link
            href="/teenused"
            className="px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            {t("services")}
          </Link>
          {dropdown("info", t("info"), infoLinks)}
          <Link
            href="/kontakt"
            className="px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            {t("contact")}
          </Link>
          <div className="px-2">
            <PersonalOffer variant="link" className="px-3 py-2 text-sm font-medium text-primary hover:text-primary-hover cursor-pointer" />
          </div>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center gap-2">
              {user.isAdmin && (
                <NextLink
                  href="/admin"
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
                >
                  {t("admin")}
                </NextLink>
              )}
              {user.isVendor && (
                <NextLink
                  href="/vendor"
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
                >
                  Müüjaportaal
                </NextLink>
              )}
              <Link
                href="/minu-konto"
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary"
              >
                <User className="h-4 w-4" />
                <span className="max-w-32 truncate">{user.name}</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/logi-sisse"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground"
              >
                {t("login")}
              </Link>
              <Link
                href="/registreeri"
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
              >
                {t("register")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-foreground cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "border-t border-border bg-header lg:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col px-4 py-3">
          {[...auctionLinks, { href: "/teenused", label: t("services") }, ...infoLinks, { href: "/kontakt", label: t("contact") }].map(
            (link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2.5 text-sm text-muted hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}
          <div className="py-2.5" onClick={() => setMobileOpen(false)}>
            <PersonalOffer variant="link" className="text-sm font-medium text-primary cursor-pointer" />
          </div>
          <div className="my-3 border-t border-border pt-3">
            <LanguageSwitcher />
          </div>
          {user ? (
            <div className="flex flex-col gap-2">
              {user.isAdmin && (
                <NextLink href="/admin" className="py-2 text-sm text-muted hover:text-foreground">
                  {t("admin")}
                </NextLink>
              )}
              {user.isVendor && (
                <NextLink href="/vendor" className="py-2 text-sm text-muted hover:text-foreground">
                  Müüjaportaal
                </NextLink>
              )}
              <Link
                href="/minu-konto"
                className="py-2 text-sm text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {t("myAccount")}
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/logi-sisse"
                className="flex-1 rounded-md border border-border px-4 py-2 text-center text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {t("login")}
              </Link>
              <Link
                href="/registreeri"
                className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                {t("register")}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
