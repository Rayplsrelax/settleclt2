CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`referralType` enum('buying','selling','renting','relocating','investing') NOT NULL,
	`budget` varchar(128),
	`neighborhoods` text,
	`timeline` varchar(128),
	`notes` text,
	`currentCity` varchar(255),
	`status` enum('new','contacted','matched','closed','lost') NOT NULL DEFAULT 'new',
	`adminNotes` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
