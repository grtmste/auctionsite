"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { relistAuction } from "@/app/(admin)/admin/actions";

/**
 * Re-lists the auction (copying vehicle details into a fresh DRAFT that links
 * back to this one for history) and opens the new draft's editor.
 */
export function RelistButton({
  auctionId,
  label = "Pane uuesti üles",
  variant = "outline",
  size = "sm",
  iconOnly = false,
}: {
  auctionId: string;
  label?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default" | "icon";
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function relist() {
    startTransition(async () => {
      const res = await relistAuction(auctionId);
      if (res.ok) {
        router.push(`/admin/oksjonid/${res.id}/muuda`);
        router.refresh();
      }
    });
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={relist}
      disabled={pending}
      title={iconOnly ? label : undefined}
    >
      <RotateCcw className="h-4 w-4" />
      {!iconOnly && (pending ? "Kopeerin…" : label)}
    </Button>
  );
}
