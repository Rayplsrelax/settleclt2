CREATE TEMPORARY TABLE `business_claim_identity_preflight` (
	`serviceKey` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`conflictMarker` int NOT NULL,
	CONSTRAINT `business_claim_identity_preflight_conflict_unique` UNIQUE(`conflictMarker`)
);
--> statement-breakpoint
INSERT INTO `business_claim_identity_preflight` (`serviceKey`, `userId`, `conflictMarker`) VALUES ('__preflight_sentinel__', 0, 1);
--> statement-breakpoint
INSERT INTO `business_claim_identity_preflight` (`serviceKey`, `userId`, `conflictMarker`)
SELECT `serviceKey`, `userId`, 1
FROM `business_claims`
WHERE `userId` IS NOT NULL
GROUP BY `serviceKey`, `userId` HAVING COUNT(*) > 1;
--> statement-breakpoint
DROP TEMPORARY TABLE `business_claim_identity_preflight`;
--> statement-breakpoint
ALTER TABLE `business_claims` ADD CONSTRAINT `business_claims_service_user_unique` UNIQUE(`serviceKey`,`userId`);