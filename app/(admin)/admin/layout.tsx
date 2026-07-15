import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { fontClasses } from "@/lib/fonts";
import { getSettings } from "@/lib/settings";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Admin | Autooksjonid",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/logi-sisse?callbackUrl=/admin");
  }
  const settings = await getSettings();

  return (
    <html lang="et" className={fontClasses}>
      <body className="antialiased">
        <div className="flex min-h-screen">
          <AdminSidebar
            userName={session.user.name ?? session.user.email}
            logoUrl={settings.logo_url || null}
          />
          <main className="flex-1 overflow-x-hidden bg-background p-6 pt-20 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
