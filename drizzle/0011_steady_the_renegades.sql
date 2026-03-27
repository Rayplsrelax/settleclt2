CREATE TABLE `search_queries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(512) NOT NULL,
	`queryNormalized` varchar(512) NOT NULL,
	`resultCount` int NOT NULL DEFAULT 0,
	`userId` int,
	`source` varchar(64) NOT NULL DEFAULT 'global-search',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_queries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_tag_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tagId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`lastEngagedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_tag_preferences_id` PRIMARY KEY(`id`)
);
