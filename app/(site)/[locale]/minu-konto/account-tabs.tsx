"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { LogOut, MailWarning } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { AuctionStatus } from "@prisma/client";

interface AccountBid {
  id: string;
  auctionSlug: string;
  auctionTitle: string;
  auctionStatus: AuctionStatus;
  amount: number;
  highestBid: number;
  finalPrice: number | null;
  createdAt: string;
}

interface AccountTabsProps {
  user: {
    name: string;
    email: string;
    phone: string;
    company: string;
    emailVerified: boolean;
  };
  bids: AccountBid[];
}

export function AccountTabs({ user, bids }: AccountTabsProps) {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [resent, setResent] = useState(false);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMessage(null);
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/account/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        phone: formData.get("phone") || null,
        company: formData.get("company") || null,
      }),
    });
    setProfileMessage(res.ok ? t("saved") : tCommon("error"));
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newPassword = String(formData.get("newPassword") ?? "");
    if (newPassword.length < 8) {
      setPasswordMessage({ ok: false, text: tAuth("passwordMin") });
      return;
    }
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: formData.get("currentPassword"),
        newPassword,
      }),
    });
    if (res.ok) {
      setPasswordMessage({ ok: true, text: t("saved") });
      form.reset();
    } else {
      const data = await res.json().catch(() => ({}));
      setPasswordMessage({
        ok: false,
        text: data.error === "WRONG_PASSWORD" ? t("wrongPassword") : tCommon("error"),
      });
    }
  }

  async function resendVerification() {
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setResent(true);
  }

  function bidStatus(bid: AccountBid) {
    const finished = ["ENDED", "SOLD"].includes(bid.auctionStatus);
    if (bid.amount >= bid.highestBid) {
      return finished ? (
        <Badge variant="success">{t("won")}</Badge>
      ) : (
        <Badge variant="success">{t("winning")}</Badge>
      );
    }
    return <Badge variant="muted">{t("outbid")}</Badge>;
  }

  return (
    <div className="space-y-6">
      {!user.emailVerified && (
        <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <MailWarning className="h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-warning">{tAuth("verifyBanner")}</p>
              <p className="text-xs text-warning/80">{tAuth("verifyBannerText")}</p>
            </div>
          </div>
          {resent ? (
            <span className="text-sm text-success">{tAuth("verificationResent")}</span>
          ) : (
            <Button variant="outline" size="sm" onClick={resendVerification}>
              {tAuth("resendVerification")}
            </Button>
          )}
        </div>
      )}

      <Tabs defaultValue="profile">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
            <TabsTrigger value="bids">{t("myBids")}</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" />
            {tNav("logout")}
          </Button>
        </div>

        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-4 font-semibold">{t("updateProfile")}</h3>
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <Label htmlFor="acc-email">{tAuth("email")}</Label>
                  <Input id="acc-email" value={user.email} disabled />
                </div>
                <div>
                  <Label htmlFor="acc-name">{tAuth("name")}</Label>
                  <Input id="acc-name" name="name" defaultValue={user.name} required />
                </div>
                <div>
                  <Label htmlFor="acc-phone">{tAuth("phone")}</Label>
                  <Input id="acc-phone" name="phone" defaultValue={user.phone} />
                </div>
                <div>
                  <Label htmlFor="acc-company">{tAuth("company")}</Label>
                  <Input id="acc-company" name="company" defaultValue={user.company} />
                </div>
                {profileMessage && <p className="text-sm text-success">{profileMessage}</p>}
                <Button type="submit">{tCommon("save")}</Button>
              </form>
            </div>

            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-4 font-semibold">{t("changePassword")}</h3>
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <Label htmlFor="acc-current-password">{t("currentPassword")}</Label>
                  <Input
                    id="acc-current-password"
                    name="currentPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <Label htmlFor="acc-new-password">{tAuth("newPassword")}</Label>
                  <Input
                    id="acc-new-password"
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                {passwordMessage && (
                  <p
                    className={
                      passwordMessage.ok ? "text-sm text-success" : "text-sm text-primary-hover"
                    }
                  >
                    {passwordMessage.text}
                  </p>
                )}
                <Button type="submit">{tCommon("save")}</Button>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bids">
          {bids.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface py-16 text-center text-muted">
              {t("noBidsYet")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">{t("auction")}</th>
                    <th className="px-4 py-3 font-medium">{t("yourBid")}</th>
                    <th className="px-4 py-3 font-medium">{t("highestBid")}</th>
                    <th className="px-4 py-3 font-medium">{t("statusLabel")}</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid) => (
                    <tr key={bid.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/oksjon/${bid.auctionSlug}`}
                          className="font-medium hover:text-primary-hover"
                        >
                          {bid.auctionTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(bid.amount)}</td>
                      <td className="px-4 py-3">{formatCurrency(bid.highestBid)}</td>
                      <td className="px-4 py-3">{bidStatus(bid)}</td>
                      <td className="hidden px-4 py-3 text-muted md:table-cell">
                        {formatDateTime(bid.createdAt, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
