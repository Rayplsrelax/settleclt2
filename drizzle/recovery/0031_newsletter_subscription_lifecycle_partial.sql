-- RECOVERY ONLY: roll forward after 0031's lifecycle-column ALTER committed
-- but a later 0031 statement failed. Never run during normal migration execution.
--
-- Required in this same MySQL session before SOURCE-ing this file:
--   SET @settleclt_0031_expected_database = 'the_exact_database_name';
--   SET @settleclt_0031_confirm_writes_stopped = 'WRITES_STOPPED';
--   SET @settleclt_0031_confirm_backup_verified = 'BACKUP_VERIFIED';
--   SET @settleclt_0031_confirm_journal_absent = 'JOURNAL_ABSENT';
-- The application must remain stopped until this script completes and its final
-- marker is recorded by the release operator.

SET @settleclt_0031_journal_table_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = '__drizzle_migrations'
);
SET @settleclt_0031_journal_probe_sql = IF(
  @settleclt_0031_journal_table_exists = 1,
  'SELECT COUNT(*) INTO @settleclt_0031_journal_rows FROM `__drizzle_migrations` WHERE `created_at` = 1786575600000',
  'SET @settleclt_0031_journal_rows = 0'
);
PREPARE settleclt_0031_journal_probe FROM @settleclt_0031_journal_probe_sql;
EXECUTE settleclt_0031_journal_probe;
DEALLOCATE PREPARE settleclt_0031_journal_probe;

SET @settleclt_0031_column_fingerprint_count = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND (
      (COLUMN_NAME = 'source' AND COLUMN_TYPE = 'varchar(64)' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT = 'homepage' AND EXTRA = '') OR
      (COLUMN_NAME = 'status' AND COLUMN_TYPE = 'enum(''pending'',''active'',''unsubscribed'',''bounced'',''complained'')' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT = 'pending' AND EXTRA = '') OR
      (COLUMN_NAME = 'consentVersion' AND COLUMN_TYPE = 'varchar(32)' AND IS_NULLABLE IN ('YES', 'NO') AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'consentedAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE IN ('YES', 'NO') AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'confirmationTokenHash' AND COLUMN_TYPE = 'varchar(64)' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'confirmationExpiresAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'confirmationSentAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'unsubscribeTokenHash' AND COLUMN_TYPE = 'varchar(64)' AND IS_NULLABLE IN ('YES', 'NO') AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'confirmedAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'unsubscribedAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'updatedAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'NO' AND UPPER(COLUMN_DEFAULT) IN ('CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP()') AND LOWER(EXTRA) = 'default_generated on update current_timestamp')
    )
);
SET @settleclt_0031_finalized_required_count = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND COLUMN_NAME IN ('consentVersion', 'consentedAt', 'unsubscribeTokenHash')
    AND IS_NULLABLE = 'NO'
);

SET @settleclt_0031_user_column_ok = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'newsletterOptIn'
    AND COLUMN_TYPE = 'tinyint(1)'
    AND IS_NULLABLE = 'NO'
    AND COLUMN_DEFAULT IN ('0', 0)
    AND EXTRA = ''
);
SET @settleclt_0031_bad_normalized_rows = (
  SELECT COUNT(*)
  FROM newsletter_subscribers
  WHERE BINARY email <> BINARY LOWER(TRIM(email))
     OR source IS NULL
     OR TRIM(source) = ''
     OR BINARY source <> BINARY TRIM(source)
);
SET @settleclt_0031_duplicate_rows = (
  SELECT COUNT(*)
  FROM (
    SELECT LOWER(TRIM(email)) AS normalized_email
    FROM newsletter_subscribers
    GROUP BY LOWER(TRIM(email))
    HAVING COUNT(*) > 1
  ) AS duplicates
);

SET @settleclt_0031_confirmation_index_rows = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND INDEX_NAME = 'newsletter_subscribers_confirmation_token_unique'
);
SET @settleclt_0031_confirmation_index_exact = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND INDEX_NAME = 'newsletter_subscribers_confirmation_token_unique'
    AND NON_UNIQUE = 0
    AND SEQ_IN_INDEX = 1
    AND COLUMN_NAME = 'confirmationTokenHash'
    AND SUB_PART IS NULL
    AND COLLATION = 'A'
    AND INDEX_TYPE = 'BTREE'
    AND IS_VISIBLE = 'YES'
    AND EXPRESSION IS NULL
);
SET @settleclt_0031_unsubscribe_index_rows = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND INDEX_NAME = 'newsletter_subscribers_unsubscribe_token_unique'
);
SET @settleclt_0031_unsubscribe_index_exact = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND INDEX_NAME = 'newsletter_subscribers_unsubscribe_token_unique'
    AND NON_UNIQUE = 0
    AND SEQ_IN_INDEX = 1
    AND COLUMN_NAME = 'unsubscribeTokenHash'
    AND SUB_PART IS NULL
    AND COLLATION = 'A'
    AND INDEX_TYPE = 'BTREE'
    AND IS_VISIBLE = 'YES'
    AND EXPRESSION IS NULL
);

SET @settleclt_0031_guard_ok = (
  BINARY DATABASE() = BINARY @settleclt_0031_expected_database
  AND BINARY @settleclt_0031_confirm_writes_stopped = BINARY 'WRITES_STOPPED'
  AND BINARY @settleclt_0031_confirm_backup_verified = BINARY 'BACKUP_VERIFIED'
  AND BINARY @settleclt_0031_confirm_journal_absent = BINARY 'JOURNAL_ABSENT'
  AND @settleclt_0031_journal_rows = 0
  AND @settleclt_0031_column_fingerprint_count = 11
  AND @settleclt_0031_finalized_required_count IN (0, 3)
  AND @settleclt_0031_user_column_ok = 1
  AND @settleclt_0031_bad_normalized_rows = 0
  AND @settleclt_0031_duplicate_rows = 0
  AND (
    @settleclt_0031_confirmation_index_rows = 0 OR
    (@settleclt_0031_confirmation_index_rows = 1 AND @settleclt_0031_confirmation_index_exact = 1)
  )
  AND (
    @settleclt_0031_unsubscribe_index_rows = 0 OR
    (@settleclt_0031_unsubscribe_index_rows = 1 AND @settleclt_0031_unsubscribe_index_exact = 1)
  )
);
SET @settleclt_0031_guard_sql = IF(
  @settleclt_0031_guard_ok,
  'SELECT ''0031 recovery preconditions verified''',
  'SELECT * FROM __settleclt_0031_recovery_refused_preconditions_failed__'
);
PREPARE settleclt_0031_guard FROM @settleclt_0031_guard_sql;
EXECUTE settleclt_0031_guard;
DEALLOCATE PREPARE settleclt_0031_guard;

-- MySQL does not support LOCK TABLES through PREPARE. The direct lock is
-- short-lived even when the guard is false; every mutation below is separately
-- conditioned on @settleclt_0031_guard_ok before the tables are unlocked.
LOCK TABLES newsletter_subscribers AS ns WRITE, newsletter_subscribers AS n WRITE, users AS u WRITE;

-- Only untouched pre-0031 rows are grandfathered. Token-bearing double-opt-in
-- requests remain pending and are never activated by recovery.
UPDATE newsletter_subscribers AS ns
SET ns.status = 'active',
    consentVersion = 'legacy-2026-08',
    consentedAt = createdAt,
    confirmedAt = createdAt,
    unsubscribeTokenHash = SHA2(CONCAT(UUID(), ':', id, ':', email), 256)
WHERE @settleclt_0031_guard_ok
  AND status = 'pending'
  AND consentVersion IS NULL
  AND consentedAt IS NULL
  AND confirmationTokenHash IS NULL
  AND confirmationExpiresAt IS NULL
  AND confirmationSentAt IS NULL
  AND unsubscribeTokenHash IS NULL
  AND confirmedAt IS NULL
  AND unsubscribedAt IS NULL;

UPDATE users AS u
LEFT JOIN newsletter_subscribers AS n
  ON LOWER(TRIM(u.email)) = n.email
  AND n.status = 'active'
SET u.newsletterOptIn = IF(n.id IS NULL, false, true)
WHERE @settleclt_0031_guard_ok
  AND u.newsletterOptIn <> IF(n.id IS NULL, false, true);

UNLOCK TABLES;

SET @settleclt_0031_finalize_columns_sql = IF(
  @settleclt_0031_guard_ok,
  'ALTER TABLE newsletter_subscribers MODIFY COLUMN source varchar(64) NOT NULL DEFAULT ''homepage'', MODIFY COLUMN consentVersion varchar(32) NOT NULL, MODIFY COLUMN consentedAt timestamp NOT NULL, MODIFY COLUMN unsubscribeTokenHash varchar(64) NOT NULL',
  'SELECT ''0031 recovery column finalization skipped'''
);
PREPARE settleclt_0031_finalize_columns FROM @settleclt_0031_finalize_columns_sql;
EXECUTE settleclt_0031_finalize_columns;
DEALLOCATE PREPARE settleclt_0031_finalize_columns;

SET @settleclt_0031_confirmation_index_sql = IF(
  @settleclt_0031_guard_ok AND @settleclt_0031_confirmation_index_rows = 0,
  'ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_confirmation_token_unique UNIQUE (confirmationTokenHash)',
  'SELECT ''confirmation token index already verified'''
);
PREPARE settleclt_0031_confirmation_index FROM @settleclt_0031_confirmation_index_sql;
EXECUTE settleclt_0031_confirmation_index;
DEALLOCATE PREPARE settleclt_0031_confirmation_index;

SET @settleclt_0031_unsubscribe_index_sql = IF(
  @settleclt_0031_guard_ok AND @settleclt_0031_unsubscribe_index_rows = 0,
  'ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_unsubscribe_token_unique UNIQUE (unsubscribeTokenHash)',
  'SELECT ''unsubscribe token index already verified'''
);
PREPARE settleclt_0031_unsubscribe_index FROM @settleclt_0031_unsubscribe_index_sql;
EXECUTE settleclt_0031_unsubscribe_index;
DEALLOCATE PREPARE settleclt_0031_unsubscribe_index;

SET @settleclt_0031_final_column_count = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND (
      (COLUMN_NAME = 'source' AND COLUMN_TYPE = 'varchar(64)' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT = 'homepage' AND EXTRA = '') OR
      (COLUMN_NAME = 'status' AND COLUMN_TYPE = 'enum(''pending'',''active'',''unsubscribed'',''bounced'',''complained'')' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT = 'pending' AND EXTRA = '') OR
      (COLUMN_NAME = 'consentVersion' AND COLUMN_TYPE = 'varchar(32)' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'consentedAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'confirmationTokenHash' AND COLUMN_TYPE = 'varchar(64)' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'confirmationExpiresAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'confirmationSentAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'unsubscribeTokenHash' AND COLUMN_TYPE = 'varchar(64)' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'confirmedAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'unsubscribedAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'YES' AND COLUMN_DEFAULT IS NULL AND EXTRA = '') OR
      (COLUMN_NAME = 'updatedAt' AND COLUMN_TYPE = 'timestamp' AND IS_NULLABLE = 'NO' AND UPPER(COLUMN_DEFAULT) IN ('CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP()') AND LOWER(EXTRA) = 'default_generated on update current_timestamp')
    )
);
SET @settleclt_0031_final_confirmation_index_rows = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND INDEX_NAME = 'newsletter_subscribers_confirmation_token_unique'
);
SET @settleclt_0031_final_confirmation_index_exact = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND INDEX_NAME = 'newsletter_subscribers_confirmation_token_unique'
    AND NON_UNIQUE = 0
    AND SEQ_IN_INDEX = 1
    AND COLUMN_NAME = 'confirmationTokenHash'
    AND SUB_PART IS NULL
    AND COLLATION = 'A'
    AND INDEX_TYPE = 'BTREE'
    AND IS_VISIBLE = 'YES'
    AND EXPRESSION IS NULL
);
SET @settleclt_0031_final_unsubscribe_index_rows = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND INDEX_NAME = 'newsletter_subscribers_unsubscribe_token_unique'
);
SET @settleclt_0031_final_unsubscribe_index_exact = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'newsletter_subscribers'
    AND INDEX_NAME = 'newsletter_subscribers_unsubscribe_token_unique'
    AND NON_UNIQUE = 0
    AND SEQ_IN_INDEX = 1
    AND COLUMN_NAME = 'unsubscribeTokenHash'
    AND SUB_PART IS NULL
    AND COLLATION = 'A'
    AND INDEX_TYPE = 'BTREE'
    AND IS_VISIBLE = 'YES'
    AND EXPRESSION IS NULL
);
SET @settleclt_0031_final_guard_sql = IF(
  @settleclt_0031_guard_ok
    AND @settleclt_0031_final_column_count = 11
    AND @settleclt_0031_final_confirmation_index_rows = 1
    AND @settleclt_0031_final_confirmation_index_exact = 1
    AND @settleclt_0031_final_unsubscribe_index_rows = 1
    AND @settleclt_0031_final_unsubscribe_index_exact = 1,
  'SELECT ''settleclt_0031_recovery_complete'' AS recovery_status',
  'SELECT * FROM __settleclt_0031_recovery_failed_postconditions__'
);
PREPARE settleclt_0031_final_guard FROM @settleclt_0031_final_guard_sql;
EXECUTE settleclt_0031_final_guard;
DEALLOCATE PREPARE settleclt_0031_final_guard;
