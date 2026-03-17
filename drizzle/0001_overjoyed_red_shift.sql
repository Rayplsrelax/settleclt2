CREATE TABLE `business_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL,
	`phone` varchar(32),
	`website` varchar(512),
	`area` varchar(255),
	`description` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moving_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`fromCity` varchar(255),
	`moveDate` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moving_quotes_id` PRIMARY KEY(`id`)
);
