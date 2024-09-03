CREATE TABLE `english_recipes` (
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `french_recipes` (
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `german_recipes` (
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `italian_recipes` (
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `spanish_recipes` (
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `name_idx` ON `english_recipes` (`name`);