"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

export function SortSelect() {
  const t = useTranslations("auctions");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "end") params.delete("sort");
    else params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select
      value={searchParams.get("sort") ?? "end"}
      onChange={(e) => onChange(e.target.value)}
      className="w-auto"
      aria-label={t("sort")}
    >
      <option value="end">{t("sortEndDate")}</option>
      <option value="priceAsc">{t("sortPriceAsc")}</option>
      <option value="priceDesc">{t("sortPriceDesc")}</option>
      <option value="newest">{t("sortNewest")}</option>
    </Select>
  );
}
