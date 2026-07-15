import { db } from "@/lib/db";

export interface InvoiceLine {
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

export interface InvoiceTotals {
  net: number;
  vat: number;
  gross: number;
  vatByRate: { rate: number; net: number; vat: number }[];
}

/** Compute line/VAT/total figures for an invoice's line items. */
export function computeTotals(lines: InvoiceLine[]): InvoiceTotals {
  const byRate = new Map<number, { net: number; vat: number }>();
  let net = 0;
  let vat = 0;

  for (const line of lines) {
    const lineNet = round(line.qty * line.unitPrice);
    const lineVat = round((lineNet * line.vatRate) / 100);
    net += lineNet;
    vat += lineVat;
    const entry = byRate.get(line.vatRate) ?? { net: 0, vat: 0 };
    entry.net += lineNet;
    entry.vat += lineVat;
    byRate.set(line.vatRate, entry);
  }

  net = round(net);
  vat = round(vat);
  return {
    net,
    vat,
    gross: round(net + vat),
    vatByRate: [...byRate.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([rate, v]) => ({ rate, net: round(v.net), vat: round(v.vat) })),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function lineTotal(line: InvoiceLine): number {
  return round(line.qty * line.unitPrice);
}

/** Next sequential invoice number: YYYY-NNNN (per calendar year). */
export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;
  const latest = await db.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastSeq = latest ? parseInt(latest.number.slice(prefix.length), 10) : 0;
  const next = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function parseLines(value: unknown): InvoiceLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((l) => l && typeof l === "object")
    .map((l) => {
      const line = l as Record<string, unknown>;
      return {
        description: String(line.description ?? ""),
        qty: Number(line.qty ?? 0),
        unit: String(line.unit ?? "tk"),
        unitPrice: Number(line.unitPrice ?? 0),
        vatRate: Number(line.vatRate ?? 0),
      };
    });
}
