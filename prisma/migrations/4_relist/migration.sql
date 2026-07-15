-- Auction relisting: link a re-listed auction back to its predecessor
ALTER TABLE "Auction" ADD COLUMN "relistedFromId" TEXT;
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_relistedFromId_fkey"
  FOREIGN KEY ("relistedFromId") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
