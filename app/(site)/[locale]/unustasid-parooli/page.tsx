import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "./forgot-form";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-4 text-3xl font-bold">{t("resetTitle")}</h1>
      <p className="mb-8 text-sm text-muted">{t("resetInfo")}</p>
      <ForgotPasswordForm />
    </div>
  );
}
