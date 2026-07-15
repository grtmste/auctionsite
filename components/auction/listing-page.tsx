import { getTranslations } from "next-intl/server";
import type { AuctionType } from "@prisma/client";
import { listAuctions, getFilterOptions, parseFilters } from "@/lib/auctions";
import { runStatusTransitions } from "@/lib/auction-status";
import { toCardData } from "@/lib/serialize";
import { FilterSidebar } from "./filter-sidebar";
import { AuctionGrid } from "./auction-grid";
import { SortSelect } from "./sort-select";

interface ListingPageProps {
  locale: string;
  auctionType: AuctionType;
  titleKey: "titleCars" | "titleParts" | "titleOther";
  searchParams: Record<string, string | undefined>;
}

export async function ListingPage({
  locale,
  auctionType,
  titleKey,
  searchParams,
}: ListingPageProps) {
  const t = await getTranslations({ locale, namespace: "auctions" });

  // Opportunistic status transitions (cheap no-op when nothing has expired)
  await runStatusTransitions().catch(() => 0);

  // Filters only make sense for vehicle auctions
  const showFilters = auctionType === "REGULAR";

  const filters = { ...parseFilters(searchParams), auctionType, page: 1 };
  const [{ auctions, total, hasMore }, options] = await Promise.all([
    listAuctions(filters),
    showFilters
      ? getFilterOptions(auctionType)
      : Promise.resolve({ makes: [], fuelTypes: [], gearboxes: [] }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">{t(titleKey)}</h1>
          <p className="mt-1 text-sm text-muted">{t("found", { count: total })}</p>
        </div>
        <SortSelect />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {showFilters && (
          <FilterSidebar
            makes={options.makes}
            fuelTypes={options.fuelTypes}
            gearboxes={options.gearboxes}
          />
        )}
        <AuctionGrid
          initialAuctions={auctions.map((auction) => toCardData(auction, locale))}
          initialHasMore={hasMore}
          auctionType={auctionType}
        />
      </div>
    </div>
  );
}
