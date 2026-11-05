CREATE TABLE `forest_species` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `livestock_breeds` (
	`id` integer PRIMARY KEY NOT NULL,
	`species` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `livestock_breeds_species_idx` ON `livestock_breeds` (`species`);--> statement-breakpoint
CREATE TABLE `localities` (
	`id` integer PRIMARY KEY NOT NULL,
	`department` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `localities_department_idx` ON `localities` (`department`);--> statement-breakpoint
CREATE TABLE `producer_index` (
	`document_number` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL
);
