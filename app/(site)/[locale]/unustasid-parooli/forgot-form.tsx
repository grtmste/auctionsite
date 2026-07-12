"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-6 text-success">
        {t("resetSent")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="forgot-email">{t("email")}</Label>
          <Input id="forgot-email" name="email" type="email" required />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {t("resetButton")}
        </Button>
      </form>
    </div>
  );
}
