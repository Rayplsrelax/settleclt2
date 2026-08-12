DELETE duplicate_entry
FROM `passport_entries` AS duplicate_entry
INNER JOIN `passport_entries` AS canonical_entry
  ON canonical_entry.`userId` = duplicate_entry.`userId`
  AND canonical_entry.`serviceKey` = duplicate_entry.`serviceKey`
  AND canonical_entry.`id` < duplicate_entry.`id`
WHERE duplicate_entry.`serviceKey` IS NOT NULL;
--> statement-breakpoint
DELETE duplicate_entry
FROM `passport_entries` AS duplicate_entry
INNER JOIN `passport_entries` AS canonical_entry
  ON canonical_entry.`userId` = duplicate_entry.`userId`
  AND canonical_entry.`eventSlug` = duplicate_entry.`eventSlug`
  AND canonical_entry.`id` < duplicate_entry.`id`
WHERE duplicate_entry.`eventSlug` IS NOT NULL;
--> statement-breakpoint
ALTER TABLE `passport_entries`
  ADD CONSTRAINT `passport_entries_user_service_unique` UNIQUE(`userId`, `serviceKey`),
  ADD CONSTRAINT `passport_entries_user_event_unique` UNIQUE(`userId`, `eventSlug`);
