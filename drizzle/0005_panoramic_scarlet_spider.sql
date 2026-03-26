CREATE TABLE `content_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tagId` int NOT NULL,
	`contentType` enum('event','directory','blog','neighborhood') NOT NULL,
	`contentId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`venueName` varchar(255),
	`venueAddress` varchar(500),
	`neighborhood` varchar(100),
	`externalUrl` varchar(500),
	`imageUrl` varchar(1024),
	`category` enum('concerts','food-drink','sports','arts-culture','festivals','family','nightlife','free','markets','community') NOT NULL,
	`isFeatured` enum('yes','no') NOT NULL DEFAULT 'no',
	`isRecurring` enum('yes','no') NOT NULL DEFAULT 'no',
	`submittedBy` int,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`category` enum('neighborhood','activity','audience','season','content-type') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
DROP TABLE `moving_quotes`;