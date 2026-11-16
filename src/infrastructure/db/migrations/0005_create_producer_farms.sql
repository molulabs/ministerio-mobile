CREATE TABLE `producer_farms` (
	`id` integer PRIMARY KEY NOT NULL,
	`document_number` text NOT NULL,
	`number` integer NOT NULL,
	`label` text NOT NULL,
	`renspa` text,
	`producer_lives_on_farm` integer
);
--> statement-breakpoint
CREATE INDEX `producer_farms_document_number_idx` ON `producer_farms` (`document_number`);--> statement-breakpoint
-- The farms come with the catalogues: without their ETag the next sync downloads them whole, even
-- if this phone already had the catalogues the API sends now (an older app kept them without farms).
DELETE FROM `sync_state` WHERE `key` = 'catalogsEtag';
