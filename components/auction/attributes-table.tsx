"use client";

import { useTranslations, useLocale } from "next-intl";
import { translateAttrValue } from "@/lib/attribute-i18n";

export interface AuctionAttributes {
  vatPercent: number;
  make: string;
  model: string;
  firstRegDate?: string | null;
  regNumber?: string | null;
  vinCode?: string | null;
  fuelType?: string | null;
  engineVolume?: number | null;
  enginePower?: number | null;
  gearbox?: string | null;
  drivenAxle?: string | null;
  odometer?: number | null;
  climateControl?: string | null;
  seats?: number | null;
  color?: string | null;
  condition?: string | null;
  auctionType: "REGULAR" | "PARTS" | "OTHER";
  customAttributes?: { key: string; value: string }[] | null;
}

/** Vehicle specifications table, structured exactly like romu.ee */
export function AttributesTable({ attributes }: { attributes: AuctionAttributes }) {
  const t = useTranslations("auction");
  const locale = useLocale();
  const tr = (value: string | null | undefined) => translateAttrValue(value, locale);

  const typeLabel = {
    REGULAR: t("typeRegular"),
    PARTS: t("typeParts"),
    OTHER: t("typeOther"),
  }[attributes.auctionType];

  const rows: [string, string | null | undefined][] = [
    [t("vat"), `${attributes.vatPercent}%`],
    [t("make"), attributes.make],
    [t("model"), attributes.model],
    [t("firstReg"), attributes.firstRegDate],
    [t("regNumber"), attributes.regNumber],
    [t("vin"), attributes.vinCode],
    [t("fuelType"), tr(attributes.fuelType)],
    [
      t("engineVolume"),
      attributes.engineVolume != null ? `${attributes.engineVolume} L` : null,
    ],
    [
      t("enginePower"),
      attributes.enginePower != null ? `${attributes.enginePower} kW` : null,
    ],
    [t("gearbox"), tr(attributes.gearbox)],
    [t("drivenAxle"), tr(attributes.drivenAxle)],
    [
      t("odometer"),
      attributes.odometer != null
        ? `${new Intl.NumberFormat("et-EE").format(attributes.odometer)} km`
        : null,
    ],
    [t("climate"), tr(attributes.climateControl)],
    [t("seats"), attributes.seats != null ? String(attributes.seats) : null],
    [t("color"), tr(attributes.color)],
    [t("condition"), tr(attributes.condition)],
    [t("auctionType"), typeLabel],
  ];

  const custom = attributes.customAttributes ?? [];

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <h2 className="border-b border-border bg-header px-4 py-3 font-heading text-lg font-semibold">
        {t("specs")}
      </h2>
      <table className="w-full text-sm">
        <tbody>
          {rows
            .filter(([, value]) => value != null && value !== "")
            .map(([label, value], index) => (
              <tr
                key={label}
                className={index % 2 === 0 ? "bg-surface" : "bg-background"}
              >
                <td className="w-1/2 px-4 py-2.5 text-muted">{label}</td>
                <td className="px-4 py-2.5 font-medium">{value}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {custom.length > 0 && (
        <>
          <h3 className="border-y border-border bg-header px-4 py-3 font-heading text-base font-semibold">
            {t("customSpecs")}
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {custom.map((attribute, index) => (
                <tr
                  key={`${attribute.key}-${index}`}
                  className={index % 2 === 0 ? "bg-surface" : "bg-background"}
                >
                  <td className="w-1/2 px-4 py-2.5 text-muted">{attribute.key}</td>
                  <td className="px-4 py-2.5 font-medium">{tr(attribute.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
