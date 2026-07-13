import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { translationAvailable } from "@/lib/translate";
import { SettingsForms } from "./settings-forms";
import { RomuImport } from "./romu-import";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  const [settings, admin] = await Promise.all([
    getSettings(),
    db.user.findUnique({ where: { id: session!.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Seaded</h1>
      <div className="max-w-5xl">
        <RomuImport translationAvailable={translationAvailable()} />
      </div>
      <SettingsForms
        settings={settings}
        profile={{ name: admin?.name ?? "", email: admin?.email ?? "" }}
      />
    </div>
  );
}
