import { getTranslations } from "next-intl/server";
import { peekToken } from "@/lib/tokens";
import { ResetPasswordForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });

  const email = token ? await peekToken(token, "PASSWORD_RESET").catch(() => null) : null;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">{t("setNewPassword")}</h1>
      {email && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-6 text-primary-hover">
          {t("invalidToken")}
        </div>
      )}
    </div>
  );
}
