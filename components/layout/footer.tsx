import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSettings } from "@/lib/settings";
import { Logo } from "./logo";

const PARTNERS = ["Seesam", "Gjensidige", "BTA", "ERGO"];

export async function Footer() {
  const t = await getTranslations();
  const settings = await getSettings();

  return (
    <footer className="mt-16 border-t border-border bg-header">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {t("meta.defaultDescription")}
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("footer.quickLinks")}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/reeglid" className="text-muted hover:text-foreground">
                {t("nav.rules")}
              </Link>
            </li>
            <li>
              <Link href="/kkk" className="text-muted hover:text-foreground">
                {t("nav.faq")}
              </Link>
            </li>
            <li>
              <Link
                href="/privaatsuspoliitika"
                className="text-muted hover:text-foreground"
              >
                {t("nav.privacy")}
              </Link>
            </li>
            <li>
              <Link href="/kontakt" className="text-muted hover:text-foreground">
                {t("nav.contact")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("footer.contactInfo")}
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              {t("footer.infoPhone")}:{" "}
              <a
                href={`tel:${settings.contact_phone_info.replace(/\s/g, "")}`}
                className="text-foreground hover:text-primary-hover"
              >
                {settings.contact_phone_info}
              </a>
            </li>
            <li>
              {t("footer.towPhone")}:{" "}
              <a
                href={`tel:${settings.contact_phone_tow.replace(/\s/g, "")}`}
                className="text-foreground hover:text-primary-hover"
              >
                {settings.contact_phone_tow}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${settings.contact_email}`}
                className="text-foreground hover:text-primary-hover"
              >
                {settings.contact_email}
              </a>
            </li>
            <li className="pt-2">{settings.business_address}</li>
            <li>{settings.business_hours}</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("footer.partners")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {PARTNERS.map((partner) => (
              <div
                key={partner}
                className="flex h-12 items-center justify-center rounded border border-border bg-surface text-sm font-semibold text-muted"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted md:flex-row">
          <span>
            © {new Date().getFullYear()} {settings.business_name} ·{" "}
            {t("footer.regCode")} {settings.business_reg}
          </span>
          <span>{t("footer.rights")}</span>
        </div>
      </div>
    </footer>
  );
}
