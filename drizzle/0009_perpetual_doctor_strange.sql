CREATE TABLE `blog_research_ideas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`outline` text,
	`source` varchar(512),
	`category` varchar(128),
	`keywords` text,
	`status` enum('idea','researching','drafted','published','dismissed') NOT NULL DEFAULT 'idea',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_research_ideas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tag_engagement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tagId` int NOT NULL,
	`engagementType` enum('view','click','stamp','share') NOT NULL,
	`userId` int,
	`contentType` varchar(64),
	`contentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tag_engagement_id` PRIMARY KEY(`id`)
);
