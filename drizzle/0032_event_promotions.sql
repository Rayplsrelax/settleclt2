CREATE TABLE `event_promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`level` enum('boost','spotlight','headliner') NOT NULL,
	`status` enum('pending','active','expired','canceled') NOT NULL DEFAULT 'pending',
	`stripePaymentRef` varchar(255),
	`priceCents` int NOT NULL DEFAULT 0,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`customHeadline` varchar(255),
	`sponsorMessage` varchar(500),
	`organizerLogoUrl` varchar(1024),
	`socialPostsDue` int NOT NULL DEFAULT 0,
	`socialPostsSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_promotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_promotions_event_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`),
	CONSTRAINT `event_promotions_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE INDEX `event_promotions_event_idx` ON `event_promotions` (`eventId`);
--> statement-breakpoint
CREATE INDEX `event_promotions_status_idx` ON `event_promotions` (`status`);
--> statement-breakpoint
CREATE INDEX `event_promotions_ends_idx` ON `event_promotions` (`endsAt`);
