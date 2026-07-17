"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tag, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/lib/uploadthing";

interface Props {
  /** Render a custom trigger; if omitted a default branded button is shown. */
  variant?: "button" | "link";
  className?: string;
}

/** "Personal offer" (sell your car) request — a modal form mirroring romu.ee. */
export function PersonalOffer({ variant = "button", className }: Props) {
  const t = useTranslations("offer");
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("sending");
    try {
      const res = await fetch("/api/personal-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          make: fd.get("make"),
          model: fd.get("model"),
          regNumber: fd.get("regNumber"),
          location: fd.get("location") || null,
          message: fd.get("message") || null,
          wantBuyout: fd.get("wantBuyout") === "on",
          wantTransport: fd.get("wantTransport") === "on",
          images,
        }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  function close() {
    setOpen(false);
    // Reset after the closing transition
    setTimeout(() => {
      setStatus("idle");
      setImages([]);
    }, 200);
  }

  return (
    <>
      {variant === "link" ? (
        <button
          onClick={() => setOpen(true)}
          className={className ?? "text-sm font-medium text-muted hover:text-foreground cursor-pointer"}
        >
          {t("button")}
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} className={className}>
          <Tag className="h-4 w-4" />
          {t("button")}
        </Button>
      )}

      <Dialog open={open} onClose={close} title={t("title")} className="max-w-2xl">
        {status === "ok" ? (
          <div className="py-8 text-center">
            <p className="text-lg font-medium text-success">{t("success")}</p>
            <Button className="mt-6" variant="outline" onClick={close}>
              <X className="h-4 w-4" />
              {t("submit")}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-muted">{t("subtitle")}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label={t("name")} required />
              <Field name="email" label={t("email")} type="email" required />
              <Field name="phone" label={t("phone")} type="tel" required />
              <Field name="make" label={t("make")} required />
              <Field name="model" label={t("model")} required />
              <Field name="regNumber" label={t("regNumber")} required />
            </div>
            <Field name="location" label={t("location")} />

            <div>
              <Label>{t("images")}</Label>
              <UploadDropzone
                endpoint="personalOfferImage"
                config={{ mode: "auto" }}
                content={{
                  label: t("uploadLabel"),
                  allowedContent: t("imagesHint"),
                  button: ({ isUploading }: { isUploading: boolean }) =>
                    isUploading ? t("sending") : t("uploadButton"),
                }}
                onClientUploadComplete={(files) =>
                  setImages((prev) =>
                    [...prev, ...files.map((f) => f.ufsUrl ?? f.url)]
                      .filter(Boolean)
                      .slice(0, 10),
                  )
                }
                appearance={{
                  container:
                    "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-background px-6 py-6",
                  uploadIcon: "text-muted",
                  label: "text-sm font-medium text-foreground hover:text-primary",
                  allowedContent: "text-xs text-muted",
                  button:
                    "mt-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover",
                }}
              />
              {images.length > 0 && (
                <p className="mt-1 text-xs text-success">
                  {images.length} / 10 · {t("imagesHint")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="po-message">{t("message")}</Label>
              <Textarea id="po-message" name="message" rows={3} />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="wantBuyout" className="mt-0.5 h-4 w-4 accent-[#E8830C]" />
              {t("wantBuyout")}
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="wantTransport" className="mt-0.5 h-4 w-4 accent-[#E8830C]" />
              {t("wantTransport")}
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#E8830C]" />
              <span>
                {t("privacy")}{" "}
                <Link
                  href="/privaatsuspoliitika"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  ↗
                </Link>
              </span>
            </label>

            {status === "error" && (
              <p className="rounded-md bg-primary/10 p-2.5 text-sm text-primary">{t("error")}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
              {status === "sending" ? t("sending") : t("submit")}
            </Button>
          </form>
        )}
      </Dialog>
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={`po-${name}`}>
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      <Input id={`po-${name}`} name={name} type={type} required={required} />
    </div>
  );
}
