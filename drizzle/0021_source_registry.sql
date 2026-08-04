CREATE TABLE `source_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceType` enum('business_discovery','event_discovery','blog_research','charlotte_news','government','license_verification') NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`sourceCategory` varchar(128),
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`trustLevel` enum('official','aggregator','third_party') NOT NULL DEFAULT 'third_party',
	`active` boolean NOT NULL DEFAULT true,
	`checkFrequency` enum('daily','weekly','biweekly','monthly','quarterly') NOT NULL DEFAULT 'weekly',
	`lastCheckedAt` timestamp,
	`lastCheckResult` enum('ok','changed','broken','blocked','inconclusive'),
	`notes` text,
	`addedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `source_registry_id` PRIMARY KEY(`id`)
);
