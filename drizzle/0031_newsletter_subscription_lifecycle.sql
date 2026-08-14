DELETE `duplicate` FROM `newsletter_subscribers` AS `duplicate`
INNER JOIN `newsletter_subscribers` AS `keeper`
  ON LOWER(TRIM(`duplicate`.`email`)) = LOWER(TRIM(`keeper`.`email`))
  AND `duplicate`.`id` > `keeper`.`id`;
--> statement-breakpoint
UPDATE `newsletter_subscribers`
SET `source` = COALESCE(NULLIF(TRIM(`source`), ''), 'homepage');
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `newsletterOptIn` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `newsletter_subscribers`
  MODIFY COLUMN `source` varchar(64) NOT NULL DEFAULT 'homepage',
  ADD COLUMN `status` enum('pending','active','unsubscribed','bounced','complained') NOT NULL DEFAULT 'pending',
  ADD COLUMN `consentVersion` varchar(32) NULL,
  ADD COLUMN `consentedAt` timestamp NULL,
  ADD COLUMN `confirmationTokenHash` varchar(64) NULL,
  ADD COLUMN `confirmationExpiresAt` timestamp NULL,
  ADD COLUMN `confirmationSentAt` timestamp NULL,
  ADD COLUMN `unsubscribeTokenHash` varchar(64) NULL,
  ADD COLUMN `confirmedAt` timestamp NULL,
  ADD COLUMN `unsubscribedAt` timestamp NULL,
  ADD COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
--> statement-breakpoint
UPDATE `newsletter_subscribers`
SET `email` = LOWER(TRIM(`email`)),
    `status` = 'active',
    `consentVersion` = 'legacy-2026-08',
    `consentedAt` = `createdAt`,
    `confirmedAt` = `createdAt`,
    `unsubscribeTokenHash` = SHA2(CONCAT(UUID(), ':', `id`, ':', `email`), 256);
--> statement-breakpoint
UPDATE `users`
SET `newsletterOptIn` = false;
--> statement-breakpoint
UPDATE `users` AS `u`
INNER JOIN `newsletter_subscribers` AS `n`
  ON LOWER(TRIM(`u`.`email`)) = `n`.`email`
SET `u`.`newsletterOptIn` = true
WHERE `n`.`status` = 'active';
--> statement-breakpoint
ALTER TABLE `newsletter_subscribers`
  MODIFY COLUMN `consentVersion` varchar(32) NOT NULL,
  MODIFY COLUMN `consentedAt` timestamp NOT NULL,
  MODIFY COLUMN `unsubscribeTokenHash` varchar(64) NOT NULL,
  ADD CONSTRAINT `newsletter_subscribers_confirmation_token_unique` UNIQUE (`confirmationTokenHash`),
  ADD CONSTRAINT `newsletter_subscribers_unsubscribe_token_unique` UNIQUE (`unsubscribeTokenHash`);