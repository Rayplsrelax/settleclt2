ALTER TABLE `referrals` ADD `leadScore` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `referrals` ADD `leadPriority` enum('hot','qualified','nurture','early','low') DEFAULT 'low' NOT NULL;--> statement-breakpoint
ALTER TABLE `referrals` ADD `nextAction` varchar(512);--> statement-breakpoint
ALTER TABLE `referrals` ADD `nextActionDueAt` timestamp;