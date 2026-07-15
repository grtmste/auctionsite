-- Admin can hide an auction (e.g. an ended one) from public listings
ALTER TABLE "Auction" ADD COLUMN "hiddenFromPublic" BOOLEAN NOT NULL DEFAULT false;
