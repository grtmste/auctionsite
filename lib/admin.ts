import { auth } from "@/lib/auth";

/** Throws unless the current session belongs to an ADMIN user */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}
