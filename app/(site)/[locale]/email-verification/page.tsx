import { getTranslations } from "next-intl/server";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";
import { sendWelcomeEmail } from "@/lib/email";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EmailVerificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });

  let success = false;
  if (token) {
    try {
      const email = await consumeToken(token, "EMAIL_VERIFICATION");
      if (email) {
        const user = await db.user.update({
          where: { email },
          data: { emailVerified: new Date() },
        });
        await sendWelcomeEmail(user.email, user.name);
        success = true;
      }
    } catch {
      success = false;
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {success ? (
        <>
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h1 className="mt-6 text-2xl font-bold">{t("verificationSuccess")}</h1>
          <Link href="/autooksjonid" className="mt-8 inline-block">
            <Button size="lg">{t("loginButton")}</Button>
          </Link>
        </>
      ) : (
        <>
          <XCircle className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-6 text-2xl font-bold">{t("verificationFailed")}</h1>
          <Link href="/" className="mt-8 inline-block">
            <Button variant="secondary">{t("loginTitle")}</Button>
          </Link>
        </>
      )}
    </div>
  );
}
