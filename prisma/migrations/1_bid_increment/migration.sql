-- Per-auction bid step
ALTER TABLE "Auction" ADD COLUMN "bidIncrement" DOUBLE PRECISION NOT NULL DEFAULT 50;
