"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        rememberMe: formData.get("rememberMe") ? "true" : "false",
        redirect: false,
      });
      if (result?.error) {
        setError(t("invalidCredentials"));
      } else {
        const callbackUrl = searchParams.get("callbackUrl");
        if (callbackUrl?.startsWith("/admin") || callbackUrl?.startsWith("/vendor")) {
          window.location.href = callbackUrl;
        } else {
          // Vendors land in their portal by default; everyone else follows the
          // callback URL or goes home.
          const session = !callbackUrl ? await getSession() : null;
          if (session?.user?.role === "VENDOR") {
            window.location.href = "/vendor";
          } else {
            router.push((callbackUrl as never) ?? "/");
            router.refresh();
          }
        }
      }
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="login-email">{t("email")}</Label>
          <Input id="login-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="login-password" className="mb-0">
              {t("password")}
            </Label>
            <Link
              href="/unustasid-parooli"
              className="text-xs text-primary-hover hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="rememberMe"
            defaultChecked
            className="h-4 w-4 accent-[#E8830C]"
          />
          {t("rememberMe")}
        </label>
        {error && (
          <p className="rounded-md bg-primary/10 p-2.5 text-sm text-primary-hover">{error}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {t("loginButton")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/registreeri" className="font-medium text-primary-hover hover:underline">
          {t("registerTitle")}
        </Link>
      </p>
    </div>
  );
}
