CREATE TABLE `business_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceKey` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`message` text NOT NULL,
	`userId` int,
	`status` enum('new','contacted','qualified','closed','archived') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_leads_id` PRIMARY KEY(`id`)
);
