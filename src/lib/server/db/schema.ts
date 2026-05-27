import {
	boolean,
	decimal,
	index,
	int,
	mysqlEnum,
	mysqlTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const weightUnitEnum = mysqlEnum('weight_unit', ['kg', 'lb']);

export const users = mysqlTable('user', {
	id: varchar('id', { length: 255 })
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar('name', { length: 255 }),
	email: varchar('email', { length: 255 }).notNull().unique(),
	emailVerified: timestamp('emailVerified', { mode: 'date', fsp: 3 }),
	image: varchar('image', { length: 255 }),
	passwordHash: varchar('passwordHash', { length: 255 }).notNull(),
	preferredWeightUnit: weightUnitEnum.notNull().default('lb'),
	createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 }).defaultNow().notNull()
});

export const accounts = mysqlTable(
	'account',
	{
		userId: varchar('userId', { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: varchar('type', { length: 255 }).notNull(),
		provider: varchar('provider', { length: 255 }).notNull(),
		providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
		refresh_token: varchar('refresh_token', { length: 255 }),
		access_token: varchar('access_token', { length: 255 }),
		expires_at: int('expires_at'),
		token_type: varchar('token_type', { length: 255 }),
		scope: varchar('scope', { length: 255 }),
		id_token: varchar('id_token', { length: 2048 }),
		session_state: varchar('session_state', { length: 255 })
	},
	(account) => ({
		compositePk: primaryKey({
			columns: [account.provider, account.providerAccountId]
		})
	})
);

export const sessions = mysqlTable('session', {
	sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
	userId: varchar('userId', { length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { mode: 'date' }).notNull()
});

export const verificationTokens = mysqlTable(
	'verificationToken',
	{
		identifier: varchar('identifier', { length: 255 }).notNull(),
		token: varchar('token', { length: 255 }).notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(vt) => ({
		compositePk: primaryKey({ columns: [vt.identifier, vt.token] })
	})
);

export const exerciseCategoryEnum = mysqlEnum('exercise_category', [
	'machine',
	'cardio',
	'free_weight'
]);

export const exercises = mysqlTable(
	'exercises',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: varchar('name', { length: 255 }).notNull(),
		category: exerciseCategoryEnum.notNull(),
		muscleGroup: varchar('muscle_group', { length: 100 }),
		description: text('description'),
		isSystem: boolean('is_system').notNull().default(false),
		createdByUserId: varchar('created_by_user_id', { length: 255 }).references(() => users.id, {
			onDelete: 'set null'
		}),
		createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
	},
	(table) => ({
		categoryIdx: index('exercises_category_idx').on(table.category),
		createdByIdx: index('exercises_created_by_idx').on(table.createdByUserId)
	})
);

export const workouts = mysqlTable('workouts', {
	id: varchar('id', { length: 36 })
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: varchar('user_id', { length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 255 }),
	performedAt: timestamp('performed_at', { mode: 'date', fsp: 3 }).notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).defaultNow().notNull()
});

export const workoutEntries = mysqlTable(
	'workout_entries',
	{
		id: varchar('id', { length: 36 })
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		workoutId: varchar('workout_id', { length: 36 })
			.notNull()
			.references(() => workouts.id, { onDelete: 'cascade' }),
		exerciseId: varchar('exercise_id', { length: 36 })
			.notNull()
			.references(() => exercises.id, { onDelete: 'restrict' }),
		sortOrder: int('sort_order').notNull().default(0),
		machineLabel: varchar('machine_label', { length: 255 }),
		notes: text('notes')
	},
	(table) => ({
		uniqueWorkoutExercise: uniqueIndex('workout_entries_workout_exercise_unique').on(
			table.workoutId,
			table.exerciseId
		)
	})
);

export const strengthSets = mysqlTable('strength_sets', {
	id: varchar('id', { length: 36 })
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	workoutEntryId: varchar('workout_entry_id', { length: 36 })
		.notNull()
		.references(() => workoutEntries.id, { onDelete: 'cascade' }),
	setNumber: int('set_number').notNull(),
	reps: int('reps').notNull(),
	weight: decimal('weight', { precision: 8, scale: 2 }).notNull(),
	weightUnit: weightUnitEnum.notNull().default('lb'),
	isWarmup: boolean('is_warmup').notNull().default(false)
});

export const cardioLogs = mysqlTable('cardio_logs', {
	workoutEntryId: varchar('workout_entry_id', { length: 36 })
		.primaryKey()
		.references(() => workoutEntries.id, { onDelete: 'cascade' }),
	durationSeconds: int('duration_seconds').notNull(),
	distanceMeters: int('distance_meters'),
	calories: int('calories'),
	avgHeartRate: int('avg_heart_rate'),
	speedKph: decimal('speed_kph', { precision: 6, scale: 2 }),
	inclinePercent: decimal('incline_percent', { precision: 5, scale: 2 }),
	resistanceLevel: int('resistance_level')
});

export const usersRelations = relations(users, ({ many }) => ({
	workouts: many(workouts),
	exercises: many(exercises)
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [exercises.createdByUserId],
		references: [users.id]
	}),
	workoutEntries: many(workoutEntries)
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
	user: one(users, {
		fields: [workouts.userId],
		references: [users.id]
	}),
	entries: many(workoutEntries)
}));

export const workoutEntriesRelations = relations(workoutEntries, ({ one, many }) => ({
	workout: one(workouts, {
		fields: [workoutEntries.workoutId],
		references: [workouts.id]
	}),
	exercise: one(exercises, {
		fields: [workoutEntries.exerciseId],
		references: [exercises.id]
	}),
	strengthSets: many(strengthSets),
	cardioLog: one(cardioLogs, {
		fields: [workoutEntries.id],
		references: [cardioLogs.workoutEntryId]
	})
}));

export const strengthSetsRelations = relations(strengthSets, ({ one }) => ({
	workoutEntry: one(workoutEntries, {
		fields: [strengthSets.workoutEntryId],
		references: [workoutEntries.id]
	})
}));

export const cardioLogsRelations = relations(cardioLogs, ({ one }) => ({
	workoutEntry: one(workoutEntries, {
		fields: [cardioLogs.workoutEntryId],
		references: [workoutEntries.id]
	})
}));
