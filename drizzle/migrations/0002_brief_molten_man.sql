CREATE TABLE `hold_sets` (
	`id` varchar(36) NOT NULL,
	`workout_entry_id` varchar(36) NOT NULL,
	`set_number` int NOT NULL,
	`duration_seconds` int NOT NULL,
	`reps` int NOT NULL,
	`weight` decimal(8,2),
	`weight_unit` enum('kg','lb') NOT NULL DEFAULT 'lb',
	CONSTRAINT `hold_sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `exercises` MODIFY COLUMN `exercise_category` enum('machine','cardio','free_weight','holds') NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_entries` ADD CONSTRAINT `workout_entries_workout_exercise_unique` UNIQUE(`workout_id`,`exercise_id`);--> statement-breakpoint
ALTER TABLE `hold_sets` ADD CONSTRAINT `hold_sets_workout_entry_id_workout_entries_id_fk` FOREIGN KEY (`workout_entry_id`) REFERENCES `workout_entries`(`id`) ON DELETE cascade ON UPDATE no action;