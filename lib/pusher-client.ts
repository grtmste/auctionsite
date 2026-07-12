"use client";

import PusherClient from "pusher-js";

let client: PusherClient | null = null;

/** Browser-side Pusher client; returns null when Pusher is not configured. */
export function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!key) return null;
  if (!client) {
    client = new PusherClient(key, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu",
    });
  }
  return client;
}
