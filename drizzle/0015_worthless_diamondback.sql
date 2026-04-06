CREATE TABLE `business_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceKey` varchar(255) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`claimantName` varchar(255) NOT NULL,
	`claimantEmail` varchar(320) NOT NULL,
	`claimantPhone` varchar(32),
	`claimantRole` varchar(128) NOT NULL,
	`verificationMethod` enum('owner','manager','employee','authorized_rep') NOT NULL,
	`message` text,
	`userId` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_listing_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceKey` varchar(255) NOT NULL,
	`claimId` int NOT NULL,
	`displayName` varchar(255),
	`description` text,
	`phone` varchar(32),
	`website` varchar(512),
	`email` varchar(320),
	`hours` text,
	`photoUrls` text,
	`socialLinks` text,
	`tagline` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_listing_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_listing_overrides_serviceKey_unique` UNIQUE(`serviceKey`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('claim','review','payment','event','community','system') NOT NULL,
	`inApp` boolean NOT NULL DEFAULT true,
	`email` boolean NOT NULL DEFAULT true,
	`push` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('claim','review','payment','event','community','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`actionUrl` varchar(500),
	`icon` varchar(64),
	`isRead` boolean NOT NULL DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `premium_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceKey` varchar(255) NOT NULL,
	`tier` enum('basic','featured','premium') NOT NULL DEFAULT 'basic',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`paymentStatus` enum('active','past_due','canceled','trialing') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`claimId` int,
	`billingEmail` varchar(320),
	`viewsThisPeriod` int NOT NULL DEFAULT 0,
	`clicksThisPeriod` int NOT NULL DEFAULT 0,
	`leadsThisPeriod` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premium_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
