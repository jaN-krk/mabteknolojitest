CREATE TABLE `admin_events` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_admin_events_entity` ON `admin_events` (`entity_id`,`created`);--> statement-breakpoint
CREATE TABLE `lead_followups` (
	`submission_id` text PRIMARY KEY NOT NULL,
	`stage` text DEFAULT 'new' NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`next_contact` text DEFAULT '' NOT NULL,
	`updated` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `submissions` ADD `payload_hash` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `claim_id` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `lease_until` integer DEFAULT 0 NOT NULL;