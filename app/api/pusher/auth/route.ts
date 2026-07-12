import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

/**
 * Pusher channel authorization endpoint. Public auction channels don't
 * require auth; this endpoint exists for private-channel use if needed.
 */
export async function POST(request: NextRequest) {
  if (!pusherServer) {
    return NextResponse.json({ error: "PUSHER_NOT_CONFIGURED" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();
  const socketId = String(formData.get("socket_id") ?? "");
  const channel = String(formData.get("channel_name") ?? "");
  if (!socketId || !channel) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channel, {
    user_id: session.user.id,
  });
  return NextResponse.json(authResponse);
}
