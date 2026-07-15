-- Add VENDOR role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VENDOR';

-- Auction: optional vendor assignment
ALTER TABLE "Auction" ADD COLUMN "vendorId" TEXT;
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
