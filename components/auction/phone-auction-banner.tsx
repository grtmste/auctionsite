"use client";

import { useTranslations } from "next-intl";
import { Phone } from "lucide-react";

/** Orange sticky banner shown while a phone auction is in progress */
export function PhoneAuctionBanner() {
  const t = useTranslations("auction");
  return (
    <div className="sticky top-16 z-30 border-b border-warning/40 bg-warning/15 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Phone className="h-5 w-5 shrink-0 animate-pulse text-warning" />
        <div>
          <p className="font-semibold text-warning">{t("phoneAuctionBanner")}</p>
          <p className="text-xs text-warning/80">{t("phoneAuctionNote")}</p>
        </div>
      </div>
    </div>
  );
}
