"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { computeTotals, type InvoiceLine } from "@/lib/invoices";
import { saveInvoice, type InvoiceInput } from "@/app/(admin)/admin/actions";

export interface InvoiceFormValues {
  id?: string;
  number: string;
  auctionId: string | null;
  userId: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerCompany: string;
  buyerRegCode: string;
  buyerVatNo: string;
  buyerPersonalId: string;
  buyerAddress: string;
  issueDate: string; // yyyy-mm-dd
  dueDate: string;
  lines: InvoiceLine[];
  notes: string;
  status: string;
}

const UNITS = ["tk", "kmpl", "h", "km", "l"];

export function InvoiceForm({ initial }: { initial: InvoiceFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<InvoiceFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof InvoiceFormValues>(key: K, value: InvoiceFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const totals = useMemo(() => computeTotals(form.lines), [form.lines]);

  function setLine(index: number, patch: Partial<InvoiceLine>) {
    setForm((f) => {
      const lines = [...f.lines];
      lines[index] = { ...lines[index], ...patch };
      return { ...f, lines };
    });
  }

  function addLine() {
    setForm((f) => ({
      ...f,
      lines: [
        ...f.lines,
        { description: "", qty: 1, unit: "tk", unitPrice: 0, vatRate: 0 },
      ],
    }));
  }

  function removeLine(index: number) {
    setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== index) }));
  }

  function submit(after: "list" | "pdf") {
    setError(null);
    if (!form.number.trim()) {
      setError("Arve number on kohustuslik");
      return;
    }
    if (!form.buyerName.trim()) {
      setError("Ostja nimi on kohustuslik");
      return;
    }
    if (form.lines.filter((l) => l.description.trim()).length === 0) {
      setError("Lisa vähemalt üks arverida");
      return;
    }

    const payload: InvoiceInput = {
      id: form.id,
      number: form.number.trim(),
      auctionId: form.auctionId,
      userId: form.userId,
      buyerName: form.buyerName.trim(),
      buyerEmail: form.buyerEmail || null,
      buyerPhone: form.buyerPhone || null,
      buyerCompany: form.buyerCompany || null,
      buyerRegCode: form.buyerRegCode || null,
      buyerVatNo: form.buyerVatNo || null,
      buyerPersonalId: form.buyerPersonalId || null,
      buyerAddress: form.buyerAddress || null,
      issueDate: new Date(form.issueDate).toISOString(),
      dueDate: new Date(form.dueDate).toISOString(),
      lines: form.lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          description: l.description.trim(),
          qty: Number(l.qty) || 0,
          unit: l.unit || "tk",
          unitPrice: Number(l.unitPrice) || 0,
          vatRate: Number(l.vatRate) || 0,
        })),
      notes: form.notes || null,
      status: form.status as InvoiceInput["status"],
    };

    startTransition(async () => {
      const res = await saveInvoice(payload);
      if (!res.ok) {
        setError(
          res.error === "NUMBER_EXISTS"
            ? "Selle numbriga arve on juba olemas"
            : "Salvestamine ebaõnnestus"
        );
        return;
      }
      if (after === "pdf" && form.id) {
        window.open(`/api/arved/${form.id}/pdf`, "_blank");
      }
      router.push("/admin/arved");
      router.refresh();
    });
  }

  const field = (
    label: string,
    key: keyof InvoiceFormValues,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <Label htmlFor={`inv-${String(key)}`}>{label}</Label>
      <Input
        id={`inv-${String(key)}`}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header meta */}
      <section className="rounded-md border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold">Arve andmed</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {field("Arve number *", "number")}
          <div>
            <Label htmlFor="inv-status">Staatus</Label>
            <Select
              id="inv-status"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="DRAFT">Mustand</option>
              <option value="UNPAID">Maksmata</option>
              <option value="PAID">Makstud</option>
              <option value="CANCELLED">Tühistatud</option>
            </Select>
          </div>
          {field("Kuupäev *", "issueDate", { type: "date" })}
          {field("Maksetähtaeg *", "dueDate", { type: "date" })}
        </div>
      </section>

      {/* Buyer */}
      <section className="rounded-md border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold">Ostja</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Nimi *", "buyerName")}
          {field("Ettevõte", "buyerCompany")}
          {field("Registrikood", "buyerRegCode")}
          {field("KMKR (VAT nr)", "buyerVatNo")}
          {field("Isikukood", "buyerPersonalId")}
          {field("Telefon", "buyerPhone")}
          {field("E-post", "buyerEmail", { type: "email" })}
          {field("Aadress", "buyerAddress")}
        </div>
      </section>

      {/* Lines */}
      <section className="rounded-md border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Arveread</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4" />
            Lisa rida
          </Button>
        </div>

        <div className="space-y-2">
          {/* header (desktop) */}
          <div className="hidden gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted sm:grid sm:grid-cols-[1fr_70px_70px_90px_70px_90px_32px]">
            <span>Nimetus</span>
            <span className="text-right">Kogus</span>
            <span>Ühik</span>
            <span className="text-right">Hind</span>
            <span className="text-right">KM %</span>
            <span className="text-right">Summa</span>
            <span />
          </div>

          {form.lines.map((line, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_70px_70px_90px_70px_90px_32px] sm:border-0 sm:p-0"
            >
              <Input
                className="col-span-2 sm:col-span-1"
                placeholder="Nimetus (nt Audi A4 Cabriolet, oksjon nr 2026-...)"
                value={line.description}
                onChange={(e) => setLine(index, { description: e.target.value })}
              />
              <Input
                type="number"
                step="0.01"
                className="text-right"
                value={line.qty}
                onChange={(e) => setLine(index, { qty: Number(e.target.value) })}
              />
              <Select
                value={line.unit}
                onChange={(e) => setLine(index, { unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
              <Input
                type="number"
                step="0.01"
                className="text-right"
                value={line.unitPrice}
                onChange={(e) => setLine(index, { unitPrice: Number(e.target.value) })}
              />
              <Input
                type="number"
                step="1"
                className="text-right"
                value={line.vatRate}
                onChange={(e) => setLine(index, { vatRate: Number(e.target.value) })}
              />
              <div className="flex items-center justify-end px-1 text-sm font-medium tabular-nums">
                {formatCurrency((Number(line.qty) || 0) * (Number(line.unitPrice) || 0))}
              </div>
              <button
                type="button"
                onClick={() => removeLine(index)}
                className="flex items-center justify-center text-muted hover:text-danger cursor-pointer"
                title="Eemalda rida"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {form.lines.length === 0 && (
            <p className="py-4 text-sm text-muted">
              Ühtegi rida veel pole. Lisa esimene arverida.
            </p>
          )}
        </div>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Summa ilma KM-ta</span>
              <span>{formatCurrency(totals.net)}</span>
            </div>
            {totals.vatByRate.map((v) => (
              <div className="flex justify-between" key={v.rate}>
                <span className="text-muted">Käibemaks {v.rate}%</span>
                <span>{formatCurrency(v.vat)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Tasumisele kuulub</span>
              <span className="text-primary">{formatCurrency(totals.gross)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <Label htmlFor="inv-notes">Märkus (nähtav arvel)</Label>
        <Textarea
          id="inv-notes"
          rows={2}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Jäta tühjaks, et kasutada seadetes määratud vaikimisi märkust"
        />
      </section>

      {error && (
        <p className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button size="lg" disabled={pending} onClick={() => submit("list")}>
          Salvesta
        </Button>
        {form.id && (
          <Button
            size="lg"
            variant="secondary"
            disabled={pending}
            onClick={() => submit("pdf")}
          >
            <FileDown className="h-4 w-4" />
            Salvesta ja ava PDF
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/arved")}
        >
          Tühista
        </Button>
      </div>
    </div>
  );
}
