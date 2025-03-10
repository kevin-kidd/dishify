PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_featured_recipes` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`recipe_id` text NOT NULL,
	`generating` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `english_recipe_details`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_featured_recipes`("id", "recipe_id", "generating", "created_at", "updated_at") SELECT "id", "recipe_id", "generating", "created_at", "updated_at" FROM `featured_recipes`;--> statement-breakpoint
DROP TABLE `featured_recipes`;--> statement-breakpoint
ALTER TABLE `__new_featured_recipes` RENAME TO `featured_recipes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;