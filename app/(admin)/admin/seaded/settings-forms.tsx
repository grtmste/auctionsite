"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSettings, saveAdminProfile } from "../actions";

interface SettingsFormsProps {
  settings: Record<string, string>;
  profile: { name: string; email: string };
}

const SETTING_FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "min_bid_increment", label: "Minimaalne pakkumise samm (€)", type: "number" },
  { key: "contact_phone_info", label: "Infotelefon" },
  { key: "contact_phone_tow", label: "Puksiiri telefon" },
  { key: "contact_email", label: "Kontakt-e-post" },
  { key: "business_name", label: "Ettevõtte nimi" },
  { key: "business_reg", label: "Registrikood" },
  { key: "business_address", label: "Aadress" },
  { key: "business_hours", label: "Lahtiolekuajad" },
  { key: "logo_url", label: "Logo URL (tühi = tekstilogo)" },
  { key: "partner_bta_url", label: "BTA logo URL" },
  { key: "partner_gjensidige_url", label: "Gjensidige logo URL" },
  { key: "partner_seesam_url", label: "Seesam logo URL" },
  { key: "business_vat_no", label: "KMKR nr (arvetel)" },
  { key: "bank_name", label: "Pank (arvetel)" },
  { key: "bank_iban", label: "IBAN (arvetel)" },
  { key: "bank_bic", label: "BIC/SWIFT (arvetel)" },
  { key: "invoice_default_vat", label: "Arve vaikimisi KM % ", type: "number" },
  { key: "invoice_due_days", label: "Arve maksetähtaeg (päeva)", type: "number" },
  { key: "invoice_note", label: "Arve märkus/jalus" },
];

export function SettingsForms({ settings, profile }: SettingsFormsProps) {
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submitSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSettingsMessage(null);
    const formData = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    for (const field of SETTING_FIELDS) {
      values[field.key] = String(formData.get(field.key) ?? "");
    }
    startTransition(async () => {
      await saveSettings(values);
      setSettingsMessage("Salvestatud!");
    });
  }

  function submitProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newPassword = String(formData.get("newPassword") ?? "");
    if (newPassword && newPassword.length < 8) {
      setProfileMessage({ ok: false, text: "Uus parool peab olema vähemalt 8 tähemärki" });
      return;
    }
    startTransition(async () => {
      const result = await saveAdminProfile({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        currentPassword: String(formData.get("currentPassword") ?? ""),
        newPassword: newPassword || null,
      });
      if (result.ok) {
        setProfileMessage({ ok: true, text: "Salvestatud!" });
        form.reset();
      } else {
        setProfileMessage({
          ok: false,
          text:
            result.error === "WRONG_PASSWORD"
              ? "Praegune parool on vale"
              : result.error === "EMAIL_EXISTS"
                ? "Selle e-postiga konto on juba olemas"
                : "Salvestamine ebaõnnestus",
        });
      }
    });
  }

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 font-semibold">Saidi seaded</h2>
        <form onSubmit={submitSettings} className="space-y-4">
          {SETTING_FIELDS.map((field) => (
            <div key={field.key}>
              <Label htmlFor={`setting-${field.key}`}>{field.label}</Label>
              <Input
                id={`setting-${field.key}`}
                name={field.key}
                type={field.type ?? "text"}
                defaultValue={settings[field.key] ?? ""}
                min={field.type === "number" ? 1 : undefined}
              />
            </div>
          ))}
          {settingsMessage && <p className="text-sm text-success">{settingsMessage}</p>}
          <Button type="submit" disabled={pending}>
            Salvesta seaded
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 self-start">
        <h2 className="mb-4 font-semibold">Admini profiil</h2>
        <form onSubmit={submitProfile} className="space-y-4">
          <div>
            <Label htmlFor="admin-name">Nimi</Label>
            <Input id="admin-name" name="name" defaultValue={profile.name} required />
          </div>
          <div>
            <Label htmlFor="admin-email">E-post</Label>
            <Input
              id="admin-email"
              name="email"
              type="email"
              defaultValue={profile.email}
              required
            />
          </div>
          <div>
            <Label htmlFor="admin-new-password">
              Uus parool <span className="text-muted">(jäta tühjaks, kui ei muuda)</span>
            </Label>
            <Input
              id="admin-new-password"
              name="newPassword"
              type="password"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="admin-current-password">
              Praegune parool <span className="text-primary">*</span>
            </Label>
            <Input
              id="admin-current-password"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {profileMessage && (
            <p className={profileMessage.ok ? "text-sm text-success" : "text-sm text-primary-hover"}>
              {profileMessage.text}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            Salvesta profiil
          </Button>
        </form>
      </div>
    </div>
  );
}
