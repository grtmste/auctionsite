import { AuctionForm, EMPTY_AUCTION } from "@/components/admin/auction-form";
import { translationAvailable } from "@/lib/translate";
import { getVendorOptions } from "@/lib/vendors";

export const dynamic = "force-dynamic";

export default async function NewAuctionPage() {
  const vendors = await getVendorOptions();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Uus oksjon</h1>
      <AuctionForm
        initial={EMPTY_AUCTION}
        canAutoTranslate={translationAvailable()}
        vendors={vendors}
      />
    </div>
  );
}
