CREATE TABLE `censuses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`schema_version` integer NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`errors` text,
	`conflict` text,
	`census_id` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`sent_at` integer
);
--> statement-breakpoint
CREATE INDEX `censuses_user_status_idx` ON `censuses` (`user_id`,`status`);