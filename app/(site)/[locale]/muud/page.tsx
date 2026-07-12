import { ListingPage } from "@/components/auction/listing-page";

export const dynamic = "force-dynamic";

export default async function OtherAuctionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  return (
    <ListingPage
      locale={locale}
      auctionType="OTHER"
      titleKey="titleOther"
      searchParams={await searchParams}
    />
  );
}
