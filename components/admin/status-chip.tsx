import { Badge } from "@/components/ui/badge";
import type { AuctionStatus } from "@prisma/client";

/** Estonian status labels for the admin panel (which is not locale-routed) */
export const STATUS_LABELS_ET: Record<AuctionStatus, string> = {
  DRAFT: "Mustand",
  ACTIVE: "Aktiivne",
  PHONE_AUCTION: "Telefonoksjon",
  ENDED: "Lõppenud",
  SOLD: "Müüdud",
  CANCELLED: "Tühistatud",
};

const VARIANTS: Record<
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

export function StatusChip({ status }: { status: AuctionStatus }) {
  return <Badge variant={VARIANTS[status]}>{STATUS_LABELS_ET[status]}</Badge>;
}
