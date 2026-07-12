import Pusher from "pusher";

/**
 * Server-side Pusher client. Gracefully no-ops when the environment
 * variables are not configured (local development without Pusher).
 */
const hasPusherConfig = Boolean(
  process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET
);

export const pusherServer = hasPusherConfig
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER ?? "eu",
      useTLS: true,
    })
  : null;

export function auctionChannel(auctionId: string) {
  return `auction-${auctionId}`;
}

export async function triggerAuctionEvent(
  auctionId: string,
  event: "bid-placed" | "auction-ended" | "phone-auction-started",
  payload: Record<string, unknown>
) {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(auctionChannel(auctionId), event, payload);
  } catch (error) {
    console.error("Pusher trigger failed", error);
  }
}
