import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { HeaderNav } from "./header-nav";

export async function Header() {
  const [session, settings] = await Promise.all([auth(), getSettings()]);
  return (
    <HeaderNav
      logoUrl={settings.logo_url || null}
      user={
        session?.user
          ? {
              name: session.user.name ?? session.user.email,
              isAdmin: session.user.role === "ADMIN",
            }
          : null
      }
    />
  );
}
