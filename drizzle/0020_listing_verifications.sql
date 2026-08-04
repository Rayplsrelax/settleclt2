CREATE TABLE `listing_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceKey` varchar(255) NOT NULL,
	`checkType` enum('website','phone','address','hours','closure','category','general') NOT NULL,
	`result` enum('ok','changed','broken_link','parked_domain','redirect_changed','closed','moved','rebranded','conflicting','inconclusive') NOT NULL,
	`evidenceLevel` enum('official_verified','owner_confirmed','government_verified','source_identified','third_party_clue','conflicting','stale','removed_confirmed') NOT NULL,
	`sourceUrl` text,
	`beforeValue` text,
	`afterValue` text,
	`checkedBy` enum('manager','directory_curator','events_editor','content_editor','community_moderator','business_success','analyst','reliability_watchdog') NOT NULL,
	`notes` text,
	`taskId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `approval_records` MODIFY COLUMN `approverUserId` int;