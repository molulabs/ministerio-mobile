CREATE TABLE `map_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`version` text NOT NULL,
	`name` text NOT NULL,
	`bounds` text,
	`minzoom` integer,
	`maxzoom` integer,
	`attribution` text,
	`requires` text,
	`installed_at` integer NOT NULL
);
