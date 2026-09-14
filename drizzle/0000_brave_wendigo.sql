CREATE TABLE `documents` (
	`key` text PRIMARY KEY NOT NULL,
	`draft` text NOT NULL,
	`published` text,
	`updated` text NOT NULL,
	`editor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`attachment` text,
	`filename` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_submissions_created` ON `submissions` (`created`);