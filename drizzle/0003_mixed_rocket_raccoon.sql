CREATE TABLE `enriched_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceKey` varchar(255) NOT NULL,
	`googlePlaceId` varchar(512),
	`googleRating` varchar(8),
	`reviewCount` int,
	`verifiedAddress` text,
	`verifiedPhone` varchar(32),
	`hoursJson` text,
	`photosJson` text,
	`googleTypes` text,
	`priceLevel` int,
	`verified` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`enrichedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enriched_services_id` PRIMARY KEY(`id`),
	CONSTRAINT `enriched_services_serviceKey_unique` UNIQUE(`serviceKey`)
);
