-- Phase 1 business growth tools: lead pipeline metadata, service menus, and external booking links
ALTER TABLE `business_leads`
  ADD COLUMN `followUpAt` timestamp NULL AFTER `status`,
  ADD COLUMN `notes` text NULL AFTER `followUpAt`,
  ADD COLUMN `source` varchar(128) NULL AFTER `notes`,
  ADD COLUMN `estimatedValueCents` int NULL AFTER `source`,
  ADD COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `estimatedValueCents`;

ALTER TABLE `business_listing_overrides`
  ADD COLUMN `serviceMenu` text NULL AFTER `tagline`,
  ADD COLUMN `bookingProvider` varchar(64) NULL AFTER `serviceMenu`,
  ADD COLUMN `bookingUrl` varchar(512) NULL AFTER `bookingProvider`;
