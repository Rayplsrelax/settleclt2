-- Business referral network: matching, invitations, attribution, and payout ledger fields

ALTER TABLE `business_referrals`
  MODIFY COLUMN `serviceKey` varchar(255) NULL,
  ADD COLUMN `category` varchar(128) NULL AFTER `need`,
  ADD COLUMN `matchStatus` enum('unmatched','suggested','accepted','declined') NOT NULL DEFAULT 'unmatched' AFTER `source`,
  ADD COLUMN `matchedServiceKey` varchar(255) NULL AFTER `matchStatus`,
  ADD COLUMN `matchReason` varchar(500) NULL AFTER `matchedServiceKey`,
  ADD COLUMN `attributionToken` varchar(128) NULL AFTER `matchReason`,
  ADD COLUMN `attributionType` enum('direct','matched','business_invitation') NOT NULL DEFAULT 'direct' AFTER `attributionToken`,
  ADD COLUMN `payoutStatus` enum('not_applicable','pending','approved','paid','disputed') NOT NULL DEFAULT 'not_applicable' AFTER `attributionType`,
  ADD COLUMN `payoutCents` int NOT NULL DEFAULT 0 AFTER `payoutStatus`,
  ADD COLUMN `completedAt` timestamp NULL AFTER `userId`;

CREATE TABLE IF NOT EXISTS `business_referral_invitations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `referralId` int NOT NULL,
  `fromServiceKey` varchar(255) NOT NULL,
  `toServiceKey` varchar(255) NOT NULL,
  `message` varchar(500),
  `status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
  `respondedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bri_referral` (`referralId`),
  INDEX `idx_bri_to_service` (`toServiceKey`),
  INDEX `idx_bri_status` (`status`),
  CONSTRAINT `business_referral_invitations_id` PRIMARY KEY(`id`)
);
