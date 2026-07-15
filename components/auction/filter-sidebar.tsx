"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface FilterSidebarProps {
  makes: string[];
  fuelTypes: string[];
  gearboxes: string[];
}

export function FilterSidebar({ makes, fuelTypes, gearboxes }: FilterSidebarProps) {
  const t = useTranslations("auctions");
  const tCommon = useTranslations("common");
  const tAuction = useTranslations("auction");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const get = (key: string) => searchParams.get(key) ?? "";

  function apply(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of [
      "make",
      "fuelType",
      "gearbox",
      "yearFrom",
      "yearTo",
      "priceFrom",
      "priceTo",
    ]) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    router.push(pathname);
  }

  const form = (
    <form action={apply} className="space-y-4">
      <div>
        <Label htmlFor="filter-make">{t("make")}</Label>
        <Select id="filter-make" name="make" defaultValue={get("make")}>
          <option value="">{tCommon("all")}</option>
          {makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="filter-fuel">{t("fuelType")}</Label>
        <Select id="filter-fuel" name="fuelType" defaultValue={get("fuelType")}>
          <option value="">{tCommon("all")}</option>
          {fuelTypes.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="filter-gearbox">{tAuction("gearbox")}</Label>
        <Select id="filter-gearbox" name="gearbox" defaultValue={get("gearbox")}>
          <option value="">{tCommon("all")}</option>
          {gearboxes.map((gearbox) => (
            <option key={gearbox} value={gearbox}>
              {gearbox}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="filter-yearFrom">{t("yearFrom")}</Label>
          <Input
            id="filter-yearFrom"
            name="yearFrom"
            type="number"
            min={1950}
            max={2100}
            defaultValue={get("yearFrom")}
          />
        </div>
        <div>
          <Label htmlFor="filter-yearTo">{t("yearTo")}</Label>
          <Input
            id="filter-yearTo"
            name="yearTo"
            type="number"
            min={1950}
            max={2100}
            defaultValue={get("yearTo")}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="filter-priceFrom">{t("priceFrom")}</Label>
          <Input
            id="filter-priceFrom"
            name="priceFrom"
            type="number"
            min={0}
            defaultValue={get("priceFrom")}
          />
        </div>
        <div>
          <Label htmlFor="filter-priceTo">{t("priceTo")}</Label>
          <Input
            id="filter-priceTo"
            name="priceTo"
            type="number"
            min={0}
            defaultValue={get("priceTo")}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {t("filters")}
        </Button>
        <Button type="button" variant="outline" onClick={clear}>
          {t("clearFilters")}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="mb-4 lg:hidden">
        <Button variant="secondary" onClick={() => setOpen(!open)} className="w-full">
          <SlidersHorizontal className="h-4 w-4" />
          {t("filters")}
        </Button>
        {open && (
          <div className="mt-3 rounded-lg border border-border bg-surface p-4">{form}</div>
        )}
      </div>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            {t("filters")}
          </h3>
          {form}
        </div>
      </aside>
    </>
  );
}
