-- Extended company / personal details on users and invoice buyers
ALTER TABLE "User" ADD COLUMN "personalId" TEXT;
ALTER TABLE "User" ADD COLUMN "regCode" TEXT;
ALTER TABLE "User" ADD COLUMN "vatNo" TEXT;
ALTER TABLE "User" ADD COLUMN "address" TEXT;

ALTER TABLE "Invoice" ADD COLUMN "buyerVatNo" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "buyerPersonalId" TEXT;
