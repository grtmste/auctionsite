import { AuctionForm, EMPTY_AUCTION } from "@/components/admin/auction-form";
import { translationAvailable } from "@/lib/translate";

export const dynamic = "force-dynamic";

export default function NewAuctionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Uus oksjon</h1>
      <AuctionForm initial={EMPTY_AUCTION} canAutoTranslate={translationAvailable()} />
    </div>
  );
}
