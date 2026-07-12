import { auth } from "@/lib/auth";
import { HeaderNav } from "./header-nav";

export async function Header() {
  const session = await auth();
  return (
    <HeaderNav
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
