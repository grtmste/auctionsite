import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <span className="font-heading text-7xl font-bold text-primary">404</span>
      <h1 className="mt-4 text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("text")}</p>
      <Link href="/" className="mt-8">
        <Button>{t("backHome")}</Button>
      </Link>
    </div>
  );
}
