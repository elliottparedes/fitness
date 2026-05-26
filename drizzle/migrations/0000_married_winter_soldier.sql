CREATE TABLE `account` (
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` varchar(255),
	`access_token` varchar(255),
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` varchar(2048),
	`session_state` varchar(255),
	CONSTRAINT `account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `cardio_logs` (
	`workout_entry_id` varchar(36) NOT NULL,
	`duration_seconds` int NOT NULL,
	`distance_meters` int,
	`calories` int,
	`avg_heart_rate` int,
	`speed_kph` decimal(6,2),
	`incline_percent` decimal(5,2),
	`resistance_level` int,
	CONSTRAINT `cardio_logs_workout_entry_id` PRIMARY KEY(`workout_entry_id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`exercise_category` enum('machine','cardio','free_weight') NOT NULL,
	`muscle_group` varchar(100),
	`description` text,
	`is_system` boolean NOT NULL DEFAULT false,
	`created_by_user_id` varchar(255),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `strength_sets` (
	`id` varchar(36) NOT NULL,
	`workout_entry_id` varchar(36) NOT NULL,
	`set_number` int NOT NULL,
	`reps` int NOT NULL,
	`weight` decimal(8,2) NOT NULL,
	`weight_unit` enum('kg','lb') NOT NULL DEFAULT 'lb',
	`is_warmup` boolean NOT NULL DEFAULT false,
	CONSTRAINT `strength_sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp(3),
	`image` varchar(255),
	`passwordHash` varchar(255) NOT NULL,
	`weight_unit` enum('kg','lb') NOT NULL DEFAULT 'lb',
	`createdAt` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `verificationToken_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
CREATE TABLE `workout_entries` (
	`id` varchar(36) NOT NULL,
	`workout_id` varchar(36) NOT NULL,
	`exercise_id` varchar(36) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`machine_label` varchar(255),
	`notes` text,
	CONSTRAINT `workout_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`title` varchar(255),
	`performed_at` timestamp(3) NOT NULL,
	`notes` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `workouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cardio_logs` ADD CONSTRAINT `cardio_logs_workout_entry_id_workout_entries_id_fk` FOREIGN KEY (`workout_entry_id`) REFERENCES `workout_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exercises` ADD CONSTRAINT `exercises_created_by_user_id_user_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strength_sets` ADD CONSTRAINT `strength_sets_workout_entry_id_workout_entries_id_fk` FOREIGN KEY (`workout_entry_id`) REFERENCES `workout_entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_entries` ADD CONSTRAINT `workout_entries_workout_id_workouts_id_fk` FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workout_entries` ADD CONSTRAINT `workout_entries_exercise_id_exercises_id_fk` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workouts` ADD CONSTRAINT `workouts_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `exercises_category_idx` ON `exercises` (`exercise_category`);--> statement-breakpoint
CREATE INDEX `exercises_created_by_idx` ON `exercises` (`created_by_user_id`);