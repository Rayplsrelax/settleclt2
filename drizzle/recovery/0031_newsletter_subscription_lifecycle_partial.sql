-- RECOVERY ONLY: use after 0031's newsletter_subscribers ADD COLUMN ALTER
-- committed, but a later 0031 statement failed before release completion.
-- Do not run as a normal migration and do not run against an unknown schema.

SET @lifecycle_column_count = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND COLUMN_NAME IN (
      'status', 'consentVersion', 'consentedAt', 'confirmationTokenHash',
      'confirmationExpiresAt', 'confirmationSentAt', 'unsubscribeTokenHash',
      'confirmedAt', 'unsubscribedAt', 'updatedAt'
    )
);
SET @guard_sql = IF(
  @lifecycle_column_count = 10,
  'SELECT ''0031 lifecycle columns verified''',
  'SELECT * FROM __settleclt_0031_recovery_refused_missing_columns__'
);
PREPARE settleclt_0031_guard FROM @guard_sql;
EXECUTE settleclt_0031_guard;
DEALLOCATE PREPARE settleclt_0031_guard;

UPDATE `newsletter_subscribers`
SET `source` = COALESCE(NULLIF(TRIM(`source`), ''), 'homepage'),
    `email` = LOWER(TRIM(`email`)),
    `status` = IF(`status` = 'pending', 'active', `status`),
    `consentVersion` = COALESCE(`consentVersion`, 'legacy-2026-08'),
    `consentedAt` = COALESCE(`consentedAt`, `createdAt`),
    `confirmedAt` = COALESCE(`confirmedAt`, `createdAt`),
    `unsubscribeTokenHash` = COALESCE(
      `unsubscribeTokenHash`,
      SHA2(CONCAT(UUID(), ':', `id`, ':', `email`), 256)
    );

UPDATE `users` SET `newsletterOptIn` = false;
UPDATE `users` AS `u`
INNER JOIN `newsletter_subscribers` AS `n`
  ON LOWER(TRIM(`u`.`email`)) = `n`.`email`
SET `u`.`newsletterOptIn` = true
WHERE `n`.`status` = 'active';

ALTER TABLE `newsletter_subscribers`
  MODIFY COLUMN `source` varchar(64) NOT NULL DEFAULT 'homepage',
  MODIFY COLUMN `consentVersion` varchar(32) NOT NULL,
  MODIFY COLUMN `consentedAt` timestamp NOT NULL,
  MODIFY COLUMN `unsubscribeTokenHash` varchar(64) NOT NULL;

SET @confirmation_index_sql = IF(
  EXISTS(
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'newsletter_subscribers'
      AND INDEX_NAME = 'newsletter_subscribers_confirmation_token_unique'
  ),
  'SELECT ''confirmation token index already present''',
  'ALTER TABLE `newsletter_subscribers` ADD CONSTRAINT `newsletter_subscribers_confirmation_token_unique` UNIQUE (`confirmationTokenHash`)'
);
PREPARE settleclt_0031_confirmation_index FROM @confirmation_index_sql;
EXECUTE settleclt_0031_confirmation_index;
DEALLOCATE PREPARE settleclt_0031_confirmation_index;

SET @unsubscribe_index_sql = IF(
  EXISTS(
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'newsletter_subscribers'
      AND INDEX_NAME = 'newsletter_subscribers_unsubscribe_token_unique'
  ),
  'SELECT ''unsubscribe token index already present''',
  'ALTER TABLE `newsletter_subscribers` ADD CONSTRAINT `newsletter_subscribers_unsubscribe_token_unique` UNIQUE (`unsubscribeTokenHash`)'
);
PREPARE settleclt_0031_unsubscribe_index FROM @unsubscribe_index_sql;
EXECUTE settleclt_0031_unsubscribe_index;
DEALLOCATE PREPARE settleclt_0031_unsubscribe_index;

SELECT 'settleclt_0031_recovery_complete' AS recovery_status;
