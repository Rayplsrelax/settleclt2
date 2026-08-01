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
