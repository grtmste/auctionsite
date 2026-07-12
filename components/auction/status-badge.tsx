"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { AuctionStatus } from "@prisma/client";

const VARIANT_MAP: Record<
  AuctionStatus,
  "success" | "warning" | "muted" | "destructive" | "default"
> = {
  DRAFT: "muted",
  ACTIVE: "success",
  PHONE_AUCTION: "warning",
  ENDED: "muted",
  SOLD: "destructive",
  CANCELLED: "muted",
};

export function StatusBadge({ status }: { status: AuctionStatus }) {
  const t = useTranslations("status");
  return <Badge variant={VARIANT_MAP[status]}>{t(status)}</Badge>;
}
