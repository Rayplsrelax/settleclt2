-- Phase 3: Newcomer attributes and business promotions

ALTER TABLE `business_listing_overrides`
  ADD COLUMN `newcomerAttributes` text NULL AFTER `bookingUrl`;

CREATE TABLE IF NOT EXISTS `business_promotions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `serviceKey` varchar(255) NOT NULL,
  `type` enum('directory_boost','category_spotlight','neighborhood_spotlight') NOT NULL,
  `headline` varchar(255),
  `subtitle` varchar(500),
  `targetCategory` varchar(128),
  `targetNeighborhood` varchar(128),
  `status` enum('pending','active','expired','canceled') NOT NULL DEFAULT 'pending',
  `stripePaymentRef` varchar(255),
  `priceCents` int NOT NULL DEFAULT 0,
  `startsAt` timestamp,
  `endsAt` timestamp,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_promo_servicekey` (`serviceKey`),
  INDEX `idx_promo_status` (`status`),
  INDEX `idx_promo_type` (`type`),
  CONSTRAINT `business_promotions_id` PRIMARY KEY(`id`)
);
