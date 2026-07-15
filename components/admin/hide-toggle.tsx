"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setAuctionHidden } from "@/app/(admin)/admin/actions";

/** Toggle whether an auction appears on the public site. */
export function HideToggle({
  auctionId,
  hidden,
}: {
  auctionId: string;
  hidden: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setAuctionHidden(auctionId, !hidden);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
      {hidden ? (
        <>
          <Eye className="h-4 w-4" />
          Kuva avalikult
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4" />
          Peida avalikult
        </>
      )}
    </Button>
  );
}
