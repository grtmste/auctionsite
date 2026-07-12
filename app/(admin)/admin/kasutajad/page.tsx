import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { UsersTable } from "./users-table";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bids: true } } },
  });

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name ?? "—",
    email: user.email,
    registered: formatDate(user.createdAt),
    role: user.role,
    verified: Boolean(user.emailVerified),
    disabled: user.disabled,
    bidCount: user._count.bids,
    isSelf: user.id === session?.user?.id,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kasutajad</h1>
      <UsersTable users={rows} />
    </div>
  );
}
