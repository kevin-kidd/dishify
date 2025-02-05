CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`idToken` text,
	`password` text,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`token` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	`expiresAt` integer,
	`ipAddress` text,
	`userAgent` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emailVerified` integer,
	`email` text NOT NULL,
	`image` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `english_recipes` (
	`id` text NOT NULL,
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `english_recipes_id_unique` ON `english_recipes` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `english_name_idx` ON `english_recipes` (`name`);--> statement-breakpoint
CREATE TABLE `english_recipe_details` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`data` text,
	`status` text DEFAULT 'generating' NOT NULL,
	`moved_to_recipe_id` text,
	`error_message` text,
	`search_query` text,
	`image_query` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`ratings` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `english_recipe_details_name_unique` ON `english_recipe_details` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `english_recipe_name_idx` ON `english_recipe_details` (`name`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`recipe_data` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipe_id`) REFERENCES `english_recipe_details`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_recipe_idx` ON `favorites` (`user_id`,`recipe_id`);--> statement-breakpoint
CREATE TABLE `french_recipes` (
	`id` text NOT NULL,
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `french_recipes_id_unique` ON `french_recipes` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `french_name_idx` ON `french_recipes` (`name`);--> statement-breakpoint
CREATE TABLE `german_recipes` (
	`id` text NOT NULL,
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `german_recipes_id_unique` ON `german_recipes` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `german_name_idx` ON `german_recipes` (`name`);--> statement-breakpoint
CREATE TABLE `italian_recipes` (
	`id` text NOT NULL,
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `italian_recipes_id_unique` ON `italian_recipes` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `italian_name_idx` ON `italian_recipes` (`name`);--> statement-breakpoint
CREATE TABLE `recipe_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `english_recipe_details`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_recipe_emoji_idx` ON `recipe_reactions` (`user_id`,`recipe_id`,`emoji`);--> statement-breakpoint
CREATE TABLE `spanish_recipes` (
	`id` text NOT NULL,
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `spanish_recipes_id_unique` ON `spanish_recipes` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `spanish_name_idx` ON `spanish_recipes` (`name`);