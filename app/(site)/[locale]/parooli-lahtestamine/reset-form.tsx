"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) setDone(true);
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "INVALID_TOKEN" ? t("invalidToken") : tCommon("error"));
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
        <p className="text-success">{t("passwordChanged")}</p>
        <Link href="/logi-sisse" className="mt-4 inline-block">
          <Button>{t("loginButton")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="reset-password">{t("newPassword")}</Label>
          <Input
            id="reset-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="reset-password-confirm">{t("passwordConfirm")}</Label>
          <Input
            id="reset-password-confirm"
            name="passwordConfirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="rounded-md bg-primary/10 p-2.5 text-sm text-primary-hover">{error}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {t("setNewPassword")}
        </Button>
      </form>
    </div>
  );
}
