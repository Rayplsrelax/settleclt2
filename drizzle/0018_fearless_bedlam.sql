CREATE TEMPORARY TABLE `business_membership_owner_preflight` (
	`activeOwnerKey` varchar(255) NOT NULL,
	CONSTRAINT `business_membership_owner_preflight_active_owner_unique` UNIQUE(`activeOwnerKey`)
);
--> statement-breakpoint
INSERT INTO `business_membership_owner_preflight` (`activeOwnerKey`)
SELECT `serviceKey`
FROM `business_claims`
WHERE `status` = 'approved' AND `userId` IS NOT NULL;
--> statement-breakpoint
DROP TEMPORARY TABLE `business_membership_owner_preflight`;
--> statement-breakpoint
CREATE TEMPORARY TABLE `premium_listing_service_preflight` (
	`serviceKey` varchar(255) NOT NULL,
	`conflictMarker` int NOT NULL,
	CONSTRAINT `premium_listing_service_preflight_conflict_unique` UNIQUE(`conflictMarker`)
);
--> statement-breakpoint
INSERT INTO `premium_listing_service_preflight` (`serviceKey`, `conflictMarker`) VALUES ('__preflight_sentinel__', 1);
--> statement-breakpoint
INSERT INTO `premium_listing_service_preflight` (`serviceKey`, `conflictMarker`)
SELECT `serviceKey`, 1
FROM `premium_listings`
GROUP BY `serviceKey` HAVING COUNT(*) > 1;
--> statement-breakpoint
INSERT INTO `premium_listing_service_preflight` (`serviceKey`, `conflictMarker`)
SELECT `stripeCustomerId`, 1
FROM `premium_listings`
WHERE `stripeCustomerId` IS NOT NULL
GROUP BY `stripeCustomerId` HAVING COUNT(*) > 1;
--> statement-breakpoint
INSERT INTO `premium_listing_service_preflight` (`serviceKey`, `conflictMarker`)
SELECT `stripeSubscriptionId`, 1
FROM `premium_listings`
WHERE `stripeSubscriptionId` IS NOT NULL
GROUP BY `stripeSubscriptionId` HAVING COUNT(*) > 1;
--> statement-breakpoint
DROP TEMPORARY TABLE `premium_listing_service_preflight`;
--> statement-breakpoint
CREATE TABLE `business_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceKey` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`ownerClaimId` int,
	`activeOwnerKey` varchar(255),
	`role` enum('owner','manager','editor','viewer') NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`revokedAt` timestamp,
	CONSTRAINT `business_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_memberships_service_user_unique` UNIQUE(`serviceKey`,`userId`),
	CONSTRAINT `business_memberships_active_owner_unique` UNIQUE(`activeOwnerKey`)
);
--> statement-breakpoint
INSERT INTO `business_memberships` (`serviceKey`, `userId`, `ownerClaimId`, `activeOwnerKey`, `role`, `status`, `createdBy`)
SELECT `serviceKey`, `userId`, `id`, `serviceKey`, 'owner', 'active', `userId`
FROM `business_claims`
WHERE `status` = 'approved' AND `userId` IS NOT NULL;
--> statement-breakpoint
ALTER TABLE `premium_listings` ADD CONSTRAINT `premium_listings_service_key_unique` UNIQUE(`serviceKey`);
--> statement-breakpoint
ALTER TABLE `premium_listings` ADD CONSTRAINT `premium_listings_stripe_customer_unique` UNIQUE(`stripeCustomerId`);
--> statement-breakpoint
ALTER TABLE `premium_listings` ADD CONSTRAINT `premium_listings_stripe_subscription_unique` UNIQUE(`stripeSubscriptionId`);
--> statement-breakpoint
CREATE TABLE `stripe_checkout_reconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeEventId` varchar(255) NOT NULL,
	`checkoutSessionId` varchar(255) NOT NULL,
	`stripeSubscriptionId` varchar(255) NOT NULL,
	`stripeCustomerId` varchar(255),
	`serviceKey` varchar(255),
	`claimId` int,
	`reason` varchar(64) NOT NULL,
	`status` enum('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
	`attemptCount` int NOT NULL DEFAULT 1,
	`leaseToken` varchar(64),
	`leaseExpiresAt` timestamp,
	`lastError` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_checkout_reconciliations_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_checkout_reconciliations_event_unique` UNIQUE(`stripeEventId`),
	CONSTRAINT `stripe_checkout_reconciliations_session_unique` UNIQUE(`checkoutSessionId`)
);
