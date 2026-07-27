ALTER TABLE `events` MODIFY COLUMN `title` varchar(255);--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `startDate` timestamp;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `neighborhood` varchar(128);--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `category` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `name` varchar(255);--> statement-breakpoint
ALTER TABLE `events` ADD `type` enum('recurring','one_time') DEFAULT 'one_time';--> statement-breakpoint
ALTER TABLE `events` ADD `startDateStr` varchar(32);--> statement-breakpoint
ALTER TABLE `events` ADD `endDateStr` varchar(32);--> statement-breakpoint
ALTER TABLE `events` ADD `venue` varchar(255);--> statement-breakpoint
ALTER TABLE `events` ADD `venueArea` varchar(128);--> statement-breakpoint
ALTER TABLE `events` ADD `organizer` varchar(255);--> statement-breakpoint
ALTER TABLE `events` ADD `organizerWebsite` text;--> statement-breakpoint
ALTER TABLE `events` ADD `recurringPattern` varchar(255);--> statement-breakpoint
ALTER TABLE `events` ADD `sourceUrl` text;--> statement-breakpoint
ALTER TABLE `events` ADD `sourceVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `newcomerFriendly` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `cost` enum('free','paid','mixed') DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `events` ADD `rsvpUrl` text;--> statement-breakpoint
ALTER TABLE `events` ADD `featured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `active` boolean DEFAULT true NOT NULL;