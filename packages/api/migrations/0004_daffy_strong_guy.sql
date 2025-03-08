CREATE TABLE `trending_recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`slug` text NOT NULL,
	`data` text,
	`trending_score` integer NOT NULL,
	`estimated_cost` text,
	`rank` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `english_recipe_details`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trending_status` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`refresh_in_progress` integer DEFAULT false NOT NULL,
	`last_refresh_started` text,
	`last_refresh_completed` text,
	`updated_at` text NOT NULL
);
