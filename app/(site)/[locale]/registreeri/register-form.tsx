"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("passwordConfirm") ?? "");

    if (password.length < 8) {
      setError(t("passwordMin"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password,
          name: formData.get("name"),
          phone: formData.get("phone"),
          company: formData.get("company") || null,
        }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "EMAIL_EXISTS" ? t("emailExists") : tCommon("error"));
      }
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-6 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-success" />
        <p className="mt-4 text-success">{t("verifyEmailSent")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="reg-name">{t("name")}</Label>
          <Input id="reg-name" name="name" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="reg-email">{t("email")}</Label>
          <Input id="reg-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="reg-phone">{t("phone")}</Label>
            <Input id="reg-phone" name="phone" type="tel" required autoComplete="tel" />
          </div>
          <div>
            <Label htmlFor="reg-company">
              {t("company")} <span className="text-muted">({t("optional")})</span>
            </Label>
            <Input id="reg-company" name="company" autoComplete="organization" />
          </div>
        </div>
        <div>
          <Label htmlFor="reg-password">{t("password")}</Label>
          <Input
            id="reg-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-muted">{t("passwordMin")}</p>
        </div>
        <div>
          <Label htmlFor="reg-password-confirm">{t("passwordConfirm")}</Label>
          <Input
            id="reg-password-confirm"
            name="passwordConfirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" required className="h-4 w-4 accent-[#E8830C]" />
          {t("ageConfirm")}
        </label>
        {error && (
          <p className="rounded-md bg-primary/10 p-2.5 text-sm text-primary-hover">{error}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {t("registerButton")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {t("haveAccount")}{" "}
        <Link href="/logi-sisse" className="font-medium text-primary-hover hover:underline">
          {t("loginButton")}
        </Link>
      </p>
    </div>
  );
}
