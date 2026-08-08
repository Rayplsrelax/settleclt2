ALTER TABLE `users`
  MODIFY COLUMN `openId` varchar(128) NOT NULL,
  ADD COLUMN `passwordHash` text NULL,
  ADD COLUMN `emailVerifiedAt` timestamp NULL,
  ADD COLUMN `googleSubject` varchar(255) NULL,
  ADD COLUMN `authVersion` int NOT NULL DEFAULT 1,
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_googleSubject_unique` (`googleSubject`);

CREATE TABLE `auth_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NULL,
  `tokenHash` varchar(64) NOT NULL,
  `purpose` enum('verify_email','reset_password','google_oauth') NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `consumedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_tokens_tokenHash_unique` (`tokenHash`),
  KEY `auth_tokens_user_idx` (`userId`),
  KEY `auth_tokens_expiry_idx` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
