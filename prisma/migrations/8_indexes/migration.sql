
-- CreateIndex
CREATE INDEX "Auction_status_auctionEnd_idx" ON "Auction"("status", "auctionEnd");

-- CreateIndex
CREATE INDEX "Auction_status_hiddenFromPublic_idx" ON "Auction"("status", "hiddenFromPublic");

-- CreateIndex
CREATE INDEX "Auction_auctionType_status_idx" ON "Auction"("auctionType", "status");

-- CreateIndex
CREATE INDEX "Auction_status_currentBid_idx" ON "Auction"("status", "currentBid");

-- CreateIndex
CREATE INDEX "Auction_make_idx" ON "Auction"("make");

-- CreateIndex
CREATE INDEX "Auction_createdAt_idx" ON "Auction"("createdAt");

-- CreateIndex
CREATE INDEX "Auction_vendorId_idx" ON "Auction"("vendorId");

-- CreateIndex
CREATE INDEX "Auction_relistedFromId_idx" ON "Auction"("relistedFromId");

-- CreateIndex
CREATE INDEX "AuctionImage_auctionId_sortOrder_idx" ON "AuctionImage"("auctionId", "sortOrder");

-- CreateIndex
CREATE INDEX "PhoneBid_auctionId_status_amount_idx" ON "PhoneBid"("auctionId", "status", "amount");

-- CreateIndex
CREATE INDEX "PhoneBid_bidderUserId_idx" ON "PhoneBid"("bidderUserId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

