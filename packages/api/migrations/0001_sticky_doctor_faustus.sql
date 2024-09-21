DROP INDEX IF EXISTS `name_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `name_idx` ON `english_recipes` (`name`);