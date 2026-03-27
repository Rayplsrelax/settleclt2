CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` enum('neighborhood','directory') NOT NULL,
	`targetId` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`tip` varchar(500) NOT NULL,
	`aspect` enum('vibe','food','safety','transit','nightlife','cost','general') NOT NULL DEFAULT 'general',
	`visible` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
