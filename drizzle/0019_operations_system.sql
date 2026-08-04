CREATE TABLE `agent_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentRole` enum('manager','directory_curator','events_editor','content_editor','community_moderator','business_success','analyst','reliability_watchdog') NOT NULL,
	`taskType` varchar(128) NOT NULL,
	`riskLevel` enum('R0','R1','R2','R3','R4') NOT NULL,
	`targetEntity` varchar(255),
	`targetType` enum('business','event','blog','claim','review','comment','submission','infrastructure','seo','other') NOT NULL,
	`title` varchar(500) NOT NULL,
	`payload` json,
	`evidence` json,
	`status` enum('discovered','source_identified','verified','draft_ready','pending_approval','approved','rejected','executed','failed','archived') NOT NULL DEFAULT 'discovered',
	`confidence` int DEFAULT 0,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`approverUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	`resolutionNotes` text,
	CONSTRAINT `agent_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`targetEntity` varchar(255) NOT NULL,
	`targetType` enum('business','event','blog','claim','review','comment','submission','infrastructure','seo','other') NOT NULL,
	`actionType` varchar(128) NOT NULL,
	`riskLevel` enum('R0','R1','R2','R3','R4') NOT NULL,
	`payloadHash` varchar(64) NOT NULL,
	`payloadSnapshot` json,
	`evidence` json,
	`approverUserId` int,
	`decision` enum('approved','rejected','expired') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`decidedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`executionId` varchar(64),
	`executionOutcome` enum('pending','success','failed','rolled_back'),
	`executionNotes` text,
	`rollbackRef` varchar(255),
	CONSTRAINT `approval_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentRole` enum('manager','directory_curator','events_editor','content_editor','community_moderator','business_success','analyst','reliability_watchdog') NOT NULL,
	`actionType` varchar(128) NOT NULL,
	`riskLevel` enum('R0','R1','R2','R3','R4') NOT NULL,
	`targetEntity` varchar(255),
	`targetType` enum('business','event','blog','claim','review','comment','submission','infrastructure','seo','other') NOT NULL,
	`outcome` enum('success','failed','blocked','skipped') NOT NULL,
	`summary` text NOT NULL,
	`details` json,
	`approvalId` int,
	`taskId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
