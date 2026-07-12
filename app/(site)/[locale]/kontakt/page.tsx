import { getTranslations } from "next-intl/server";
import { Phone, Mail, MapPin, Clock, Building2 } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/contact-form";

export const dynamic = "force-dynamic";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const settings = await getSettings();

  const mapQuery = encodeURIComponent(settings.business_address);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-6">
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted">{t("infoPhone")}:</span>
                <a
                  href={`tel:${settings.contact_phone_info.replace(/\s/g, "")}`}
                  className="font-semibold hover:text-primary-hover"
                >
                  {settings.contact_phone_info}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-warning" />
                <span className="text-muted">{t("towPhone")}:</span>
                <a
                  href={`tel:${settings.contact_phone_tow.replace(/\s/g, "")}`}
                  className="font-semibold hover:text-primary-hover"
                >
                  {settings.contact_phone_tow}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted">{t("email")}:</span>
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="font-semibold hover:text-primary-hover"
                >
                  {settings.contact_email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted">{t("address")}:</span>
                <span className="font-semibold">{settings.business_address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted">{t("hours")}:</span>
                <span className="font-semibold">{settings.business_hours}</span>
              </li>
              <li className="flex items-center gap-3">
                <Building2 className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted">{t("regCode")}:</span>
                <span className="font-semibold">
                  {settings.business_name} · {settings.business_reg}
                </span>
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <iframe
              title="Google Maps"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-80 w-full grayscale-[35%] contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-6 text-xl font-semibold">{t("formTitle")}</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
