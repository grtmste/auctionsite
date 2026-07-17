"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { UploadDropzone } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import {
  saveAuction,
  autoTranslateAuctionFields,
  type AuctionFormInput,
} from "@/app/(admin)/admin/actions";

const LANGS = ["et", "en", "ru", "lv", "lt"] as const;

export interface AuctionFormValues {
  id?: string;
  status: string;
  auctionType: string;
  title: Record<string, string>;
  description: Record<string, string>;
  make: string;
  model: string;
  year: string;
  firstRegDate: string;
  regNumber: string;
  vinCode: string;
  fuelType: string;
  engineVolume: string;
  enginePower: string;
  gearbox: string;
  drivenAxle: string;
  odometer: string;
  climateControl: string;
  seats: string;
  color: string;
  condition: string;
  vatPercent: string;
  customAttributes: { key: string; value: string }[];
  startingPrice: string;
  bidIncrement: string;
  reservePrice: string;
  auctionStart: string; // datetime-local
  auctionEnd: string;
  phoneAuctionActive: boolean;
  vendorId: string;
  images: { url: string; alt: string }[];
}

export const EMPTY_AUCTION: AuctionFormValues = {
  status: "DRAFT",
  auctionType: "REGULAR",
  title: { et: "", en: "", ru: "", lv: "", lt: "" },
  description: { et: "", en: "", ru: "", lv: "", lt: "" },
  make: "",
  model: "",
  year: "",
  firstRegDate: "",
  regNumber: "",
  vinCode: "",
  fuelType: "",
  engineVolume: "",
  enginePower: "",
  gearbox: "",
  drivenAxle: "",
  odometer: "",
  climateControl: "",
  seats: "",
  color: "",
  condition: "",
  vatPercent: "0",
  customAttributes: [],
  startingPrice: "",
  bidIncrement: "50",
  reservePrice: "",
  auctionStart: "",
  auctionEnd: "",
  phoneAuctionActive: false,
  vendorId: "",
  images: [],
};

const num = (v: string): number | null => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) ? n : null;
};

export function AuctionForm({
  initial,
  canAutoTranslate = false,
  vendors = [],
}: {
  initial: AuctionFormValues;
  canAutoTranslate?: boolean;
  vendors?: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<AuctionFormValues>(initial);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [translating, setTranslating] = useState(false);
  const [translateMessage, setTranslateMessage] = useState<string | null>(null);

  const set = <K extends keyof AuctionFormValues>(key: K, value: AuctionFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function autoTranslate() {
    setTranslateMessage(null);
    if (!form.title.et.trim()) {
      setTranslateMessage("Lisa kõigepealt eestikeelne pealkiri.");
      return;
    }
    setTranslating(true);
    try {
      const res = await autoTranslateAuctionFields({
        title: form.title.et,
        description: form.description.et ?? "",
      });
      if (!res.ok) {
        setTranslateMessage(
          res.error === "NO_API_KEY"
            ? "Automaattõlge vajab ANTHROPIC_API_KEY seadistust Vercelis."
            : "Lisa kõigepealt eestikeelne pealkiri."
        );
        return;
      }
      setForm((f) => ({
        ...f,
        title: { ...f.title, ...res.titles },
        description: { ...f.description, ...res.descriptions },
      }));
      setTranslateMessage("Tõlgitud: EN, RU, LV, LT. Kontrolli ja salvesta.");
    } catch {
      setTranslateMessage("Tõlkimine ebaõnnestus. Proovi uuesti.");
    } finally {
      setTranslating(false);
    }
  }

  function submit(statusOverride?: string) {
    setError(null);
    if (!form.title.et.trim()) {
      setError("Eestikeelne pealkiri on kohustuslik");
      return;
    }
    if (!form.make.trim() || !form.model.trim()) {
      setError("Mark ja mudel on kohustuslikud");
      return;
    }
    const startingPrice = num(form.startingPrice);
    if (!startingPrice || startingPrice <= 0) {
      setError("Alghind peab olema suurem kui 0");
      return;
    }
    const bidIncrement = num(form.bidIncrement);
    if (!bidIncrement || bidIncrement <= 0) {
      setError("Pakkumise samm peab olema suurem kui 0");
      return;
    }
    if (!form.auctionStart || !form.auctionEnd) {
      setError("Oksjoni algus- ja lõppaeg on kohustuslikud");
      return;
    }

    const payload: AuctionFormInput = {
      id: form.id,
      status: (statusOverride ?? form.status) as AuctionFormInput["status"],
      auctionType: form.auctionType as AuctionFormInput["auctionType"],
      title: form.title,
      description: form.description,
      make: form.make.trim(),
      model: form.model.trim(),
      year: num(form.year) ? Math.round(num(form.year)!) : null,
      firstRegDate: form.firstRegDate || null,
      regNumber: form.regNumber || null,
      vinCode: form.vinCode || null,
      fuelType: form.fuelType || null,
      engineVolume: num(form.engineVolume),
      enginePower: num(form.enginePower) ? Math.round(num(form.enginePower)!) : null,
      gearbox: form.gearbox || null,
      drivenAxle: form.drivenAxle || null,
      odometer: num(form.odometer) ? Math.round(num(form.odometer)!) : null,
      climateControl: form.climateControl || null,
      seats: num(form.seats) ? Math.round(num(form.seats)!) : null,
      color: form.color || null,
      condition: form.condition || null,
      vatPercent: Math.round(num(form.vatPercent) ?? 0),
      customAttributes: form.customAttributes.filter((a) => a.key.trim() !== ""),
      startingPrice,
      bidIncrement,
      reservePrice: num(form.reservePrice),
      auctionStart: new Date(form.auctionStart).toISOString(),
      auctionEnd: new Date(form.auctionEnd).toISOString(),
      phoneAuctionActive: form.phoneAuctionActive,
      vendorId: form.vendorId || null,
      images: form.images.map((image) => ({ url: image.url, alt: image.alt || null })),
    };

    startTransition(async () => {
      try {
        await saveAuction(payload);
        router.push("/admin/oksjonid");
        router.refresh();
      } catch {
        setError("Salvestamine ebaõnnestus. Kontrolli välju ja proovi uuesti.");
      }
    });
  }

  const moveImage = (index: number, direction: -1 | 1) => {
    const images = [...form.images];
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    set("images", images);
  };

  const field = (
    label: string,
    key: keyof AuctionFormValues,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <Label htmlFor={`af-${String(key)}`}>{label}</Label>
      <Input
        id={`af-${String(key)}`}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      {/* Title + description with language tabs */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Pealkiri ja kirjeldus</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={autoTranslate}
            disabled={translating || !canAutoTranslate}
            title={
              canAutoTranslate
                ? "Tõlgib eestikeelse pealkirja ja kirjelduse keeltesse EN/RU/LV/LT"
                : "Vajab ANTHROPIC_API_KEY seadistust Vercelis"
            }
          >
            {translating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {translating ? "Tõlgin…" : "Tõlgi automaatselt (ET → EN/RU/LV/LT)"}
          </Button>
        </div>
        {translateMessage && (
          <p
            className={cn(
              "mb-4 rounded-md border p-2.5 text-sm",
              translateMessage.startsWith("Tõlgitud")
                ? "border-success/40 bg-success/10 text-success"
                : "border-border bg-background text-muted"
            )}
          >
            {translateMessage}
          </p>
        )}
        <Tabs defaultValue="et">
          <TabsList>
            {LANGS.map((lang) => (
              <TabsTrigger key={lang} value={lang}>
                {lang.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
          {LANGS.map((lang) => (
            <TabsContent key={lang} value={lang} className="space-y-4">
              <div>
                <Label htmlFor={`title-${lang}`}>
                  Pealkiri ({lang.toUpperCase()})
                  {lang === "et" && <span className="text-primary"> *</span>}
                </Label>
                <Input
                  id={`title-${lang}`}
                  value={form.title[lang] ?? ""}
                  onChange={(e) =>
                    set("title", { ...form.title, [lang]: e.target.value })
                  }
                  placeholder={lang === "et" ? "nt Audi A4 Cabriolet 2.5 TDI" : ""}
                />
              </div>
              <div>
                <Label>Kirjeldus ({lang.toUpperCase()})</Label>
                <RichTextEditor
                  value={form.description[lang] ?? ""}
                  onChange={(html) =>
                    set("description", { ...form.description, [lang]: html })
                  }
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Status, type, dates, pricing */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold">Oksjoni seaded</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="af-status">Staatus</Label>
            <Select
              id="af-status"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="DRAFT">Mustand</option>
              <option value="ACTIVE">Aktiivne</option>
              <option value="PHONE_AUCTION">Telefonoksjon</option>
              <option value="ENDED">Lõppenud</option>
              <option value="SOLD">Müüdud</option>
              <option value="CANCELLED">Tühistatud</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="af-type">Oksjoni tüüp</Label>
            <Select
              id="af-type"
              value={form.auctionType}
              onChange={(e) => set("auctionType", e.target.value)}
            >
              <option value="REGULAR">Sõiduk</option>
              <option value="PARTS">Varuosa</option>
              <option value="OTHER">Muu</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="af-vendor">Müüja (kindlustusmaakler)</Label>
            <Select
              id="af-vendor"
              value={form.vendorId}
              onChange={(e) => set("vendorId", e.target.value)}
            >
              <option value="">— Määramata —</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.label}
                </option>
              ))}
            </Select>
          </div>
          {field("Käibemaks (%)", "vatPercent", { type: "number", min: 0, max: 100 })}
          {field("Alghind (€) *", "startingPrice", { type: "number", min: 0, step: "0.01" })}
          {field("Pakkumise samm (€) *", "bidIncrement", { type: "number", min: 1, step: "1" })}
          {field("Reservhind (€) — avalikult peidetud", "reservePrice", {
            type: "number",
            min: 0,
            step: "0.01",
          })}
          {field("Oksjoni algus *", "auctionStart", { type: "datetime-local" })}
          {field("Oksjoni lõpp *", "auctionEnd", { type: "datetime-local" })}
        </div>

        <div className="mt-5 rounded-md border border-warning/40 bg-warning/5 p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.phoneAuctionActive}
              onChange={(e) => set("phoneAuctionActive", e.target.checked)}
              className="h-4 w-4 accent-[#F59E0B]"
            />
            Aktiveeri telefonioksjon
          </label>
          <p className="mt-1 text-xs text-muted">
            Kui märgitud, läheb oksjon pärast online-oksjoni lõppu automaatselt
            telefonioksjoniks. Telefonioksjoni lõpetab admin telefonioksjoni moodulist.
          </p>
        </div>
      </section>

      {/* Images */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-1 font-semibold">Pildid</h2>
        <p className="mb-4 text-xs text-muted">
          Kuni 20 pilti. Esimene pilt on esipilt. Lohista failid või lisa URL.
        </p>

        {form.images.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {form.images.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className={cn(
                  "group relative overflow-hidden rounded-md border",
                  index === 0 ? "border-primary" : "border-border"
                )}
              >
                <div className="relative aspect-[4/3] bg-header">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <Star className="inline h-3 w-3" /> ESIPILT
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    className="rounded p-1 text-white hover:bg-white/20 cursor-pointer"
                    title="Liiguta ettepoole"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    className="rounded p-1 text-white hover:bg-white/20 cursor-pointer"
                    title="Liiguta tahapoole"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "images",
                        form.images.filter((_, i) => i !== index)
                      )
                    }
                    className="rounded p-1 text-white hover:bg-primary cursor-pointer"
                    title="Kustuta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <UploadDropzone
          endpoint="auctionImage"
          content={{
            label: "Lohista pildid siia või vali failid",
            allowedContent: "Kuni 20 pilti, iga kuni 8 MB",
            button: ({ isUploading }: { isUploading: boolean }) =>
              isUploading ? "Laen üles…" : "Vali failid",
          }}
          onClientUploadComplete={(files) => {
            const added = files
              .map((file) => ({ url: file.ufsUrl ?? file.url, alt: "" }))
              .filter((image) => Boolean(image.url));
            set("images", [...form.images, ...added].slice(0, 20));
            setError(null);
          }}
          onUploadError={(err) =>
            setError(
              `Piltide üleslaadimine ebaõnnestus: ${err.message}. ` +
                "Kontrolli, et UPLOADTHING_TOKEN oleks Vercelis seadistatud.",
            )
          }
          appearance={{
            container:
              "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-background px-6 py-8",
            uploadIcon: "text-muted",
            label: "text-sm font-medium text-foreground hover:text-primary",
            allowedContent: "text-xs text-muted",
            button:
              "mt-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover",
          }}
        />

        <div className="mt-3 flex gap-2">
          <Input
            placeholder="…või lisa pildi URL (https://...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!urlInput.startsWith("http")) return;
              set("images", [...form.images, { url: urlInput.trim(), alt: "" }].slice(0, 20));
              setUrlInput("");
            }}
          >
            <ImagePlus className="h-4 w-4" />
            Lisa URL
          </Button>
        </div>
      </section>

      {/* Vehicle attributes */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold">Sõiduki andmed</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {field("Mark *", "make", { placeholder: "nt Audi" })}
          {field("Mudel *", "model", { placeholder: "nt A4 Cabriolet" })}
          {field("Aasta", "year", { type: "number", min: 1900, max: 2100 })}
          {field("Esmane reg. (nt 2005/03)", "firstRegDate")}
          {field("Reg nr", "regNumber")}
          {field("VIN-kood", "vinCode")}
          <div>
            <Label htmlFor="af-fuelType">Kütuse tüüp</Label>
            <Select
              id="af-fuelType"
              value={form.fuelType}
              onChange={(e) => set("fuelType", e.target.value)}
            >
              <option value="">—</option>
              <option>Bensiin</option>
              <option>Diisel</option>
              <option>Elekter</option>
              <option>Hübriid</option>
              <option>Gaas</option>
            </Select>
          </div>
          {field("Mootorimaht (L)", "engineVolume", { type: "number", step: "0.1", min: 0 })}
          {field("Mootori võimsus (kW)", "enginePower", { type: "number", min: 0 })}
          <div>
            <Label htmlFor="af-gearbox">Käigukast</Label>
            <Select
              id="af-gearbox"
              value={form.gearbox}
              onChange={(e) => set("gearbox", e.target.value)}
            >
              <option value="">—</option>
              <option>Manuaal</option>
              <option>Automaat</option>
              <option>Poolautomaat</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="af-drivenAxle">Vedav sild</Label>
            <Select
              id="af-drivenAxle"
              value={form.drivenAxle}
              onChange={(e) => set("drivenAxle", e.target.value)}
            >
              <option value="">—</option>
              <option>Esivedu</option>
              <option>Tagavedu</option>
              <option>4x4</option>
            </Select>
          </div>
          {field("Odomeetri näit (km)", "odometer", { type: "number", min: 0 })}
          {field("Kliima", "climateControl", { placeholder: "nt Kliimaautomaatik" })}
          {field("Istekohti", "seats", { type: "number", min: 0 })}
          {field("Värv", "color")}
          {field("Seisukord", "condition", { placeholder: "nt Kasutatud, avariiline" })}
        </div>
      </section>

      {/* Custom attributes */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Lisaväljad</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              set("customAttributes", [...form.customAttributes, { key: "", value: "" }])
            }
          >
            <Plus className="h-4 w-4" />
            Lisa rida
          </Button>
        </div>
        {form.customAttributes.length === 0 ? (
          <p className="text-sm text-muted">
            Lisaväljad kuvatakse sõiduki andmete tabeli all (nt &quot;Kahjustused&quot;,
            &quot;Ülevaatus kehtib&quot;).
          </p>
        ) : (
          <div className="space-y-2">
            {form.customAttributes.map((attribute, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Nimetus"
                  value={attribute.key}
                  onChange={(e) => {
                    const next = [...form.customAttributes];
                    next[index] = { ...next[index], key: e.target.value };
                    set("customAttributes", next);
                  }}
                />
                <Input
                  placeholder="Väärtus"
                  value={attribute.value}
                  onChange={(e) => {
                    const next = [...form.customAttributes];
                    next[index] = { ...next[index], value: e.target.value };
                    set("customAttributes", next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    set(
                      "customAttributes",
                      form.customAttributes.filter((_, i) => i !== index)
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 text-primary" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-primary-hover">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={pending}
          onClick={() => submit("DRAFT")}
        >
          Salvesta mustandina
        </Button>
        <Button type="button" size="lg" disabled={pending} onClick={() => submit("ACTIVE")}>
          Avalda
        </Button>
        <Button type="button" variant="outline" size="lg" disabled={pending} onClick={() => submit()}>
          Salvesta ({form.status})
        </Button>
      </div>
    </div>
  );
}
