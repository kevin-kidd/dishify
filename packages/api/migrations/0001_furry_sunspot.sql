CREATE TABLE `featured_recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`slug` text NOT NULL,
	`dish_name` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`cuisine` text NOT NULL,
	`difficulty` text NOT NULL,
	`cooking_time` text NOT NULL,
	`servings` text NOT NULL,
	`key_ingredients` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `english_recipe_details`(`id`) ON UPDATE no action ON DELETE no action
);
