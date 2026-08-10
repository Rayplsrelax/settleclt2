-- Phase 3: Event sponsorships and business referrals

CREATE TABLE IF NOT EXISTS `event_sponsorships` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventId` int NOT NULL,
  `serviceKey` varchar(255) NOT NULL,
  `level` enum('gold','silver','bronze') NOT NULL DEFAULT 'bronze',
  `message` varchar(500),
  `status` enum('pending','active','expired','canceled') NOT NULL DEFAULT 'pending',
  `stripePaymentRef` varchar(255),
  `priceCents` int NOT NULL DEFAULT 0,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sponsor_event` (`eventId`),
  INDEX `idx_sponsor_service` (`serviceKey`),
  INDEX `idx_sponsor_status` (`status`),
  CONSTRAINT `event_sponsorships_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `business_referrals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `serviceKey` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(32),
  `need` varchar(500) NOT NULL,
  `source` varchar(128),
  `status` enum('new','referred','connected','completed','archived') NOT NULL DEFAULT 'new',
  `userId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_bref_service` (`serviceKey`),
  INDEX `idx_bref_status` (`status`),
  CONSTRAINT `business_referrals_id` PRIMARY KEY(`id`)
);
