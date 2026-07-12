"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const t = useTranslations("contact");
  const tCommon = useTranslations("common");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          message: formData.get("message"),
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-6 text-success">
        {t("sent")}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">{t("nameLabel")}</Label>
          <Input id="contact-name" name="name" required />
        </div>
        <div>
          <Label htmlFor="contact-phone">{t("phoneLabel")}</Label>
          <Input id="contact-phone" name="phone" type="tel" />
        </div>
      </div>
      <div>
        <Label htmlFor="contact-email">{t("emailLabel")}</Label>
        <Input id="contact-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="contact-message">{t("messageLabel")}</Label>
        <Textarea id="contact-message" name="message" required rows={5} />
      </div>
      {state === "error" && (
        <p className="text-sm text-primary-hover">{tCommon("error")}</p>
      )}
      <Button type="submit" size="lg" disabled={state === "sending"}>
        {t("send")}
      </Button>
    </form>
  );
}
