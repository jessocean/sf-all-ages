CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`venue_id` text,
	`address` text,
	`event_type` text,
	`start_time` text NOT NULL,
	`end_time` text,
	`is_recurring` integer DEFAULT false,
	`recurrence_rule` text,
	`has_kids_activities` integer DEFAULT false,
	`outdoor` integer DEFAULT false,
	`toddler_friendly` integer DEFAULT false,
	`young_kid_friendly` integer DEFAULT false,
	`teen_friendly` integer DEFAULT false,
	`source_url` text,
	`source_platform` text,
	`last_updated_at` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`frequency` text DEFAULT 'weekly',
	`filters_json` text,
	`verified` integer DEFAULT false,
	`verification_token` text,
	`unsubscribe_token` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_email_unique` ON `subscriptions` (`email`);--> statement-breakpoint
CREATE TABLE `venues` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`neighborhood` text,
	`latitude` real,
	`longitude` real,
	`venue_type` text,
	`hours_json` text,
	`has_play_area` integer DEFAULT false,
	`has_outdoor_space` integer DEFAULT false,
	`is_enclosed` integer DEFAULT false,
	`has_high_chairs` integer DEFAULT false,
	`has_changing_table` integer DEFAULT false,
	`stroller_accessible` integer DEFAULT false,
	`loud_ok` integer DEFAULT false,
	`toddler_friendly` integer DEFAULT false,
	`young_kid_friendly` integer DEFAULT false,
	`teen_friendly` integer DEFAULT false,
	`description` text,
	`website_url` text,
	`status` text DEFAULT 'active',
	`last_verified_at` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
