import { and, asc, count, desc, eq, gte, inArray, lt, lte, max, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	cardioLogs,
	exercises,
	holdSets,
	strengthSets,
	workoutEntries,
	workouts
} from '$lib/server/db/schema';
import type { CardioInput, HoldSetInput, StrengthSetInput } from '$lib/server/validation/form';
import type { CreateWorkoutInput, UpdateWorkoutInput } from '$lib/domain/workout';
import { weightToLbs } from '$lib/progress/metrics';

export const workoutRepository = {
	async listForUser(userId: string, limit = 50) {
		return db
			.select({
				id: workouts.id,
				title: workouts.title,
				performedAt: workouts.performedAt,
				notes: workouts.notes,
				entryCount: count(workoutEntries.id)
			})
			.from(workouts)
			.leftJoin(workoutEntries, eq(workoutEntries.workoutId, workouts.id))
			.where(eq(workouts.userId, userId))
			.groupBy(workouts.id)
			.orderBy(desc(workouts.performedAt))
			.limit(limit);
	},

	async findForUser(workoutId: string, userId: string) {
		const [row] = await db
			.select()
			.from(workouts)
			.where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
			.limit(1);
		return row ?? null;
	},

	async create(input: CreateWorkoutInput & { id?: string }) {
		const id = input.id ?? crypto.randomUUID();
		await db.insert(workouts).values({
			id,
			userId: input.userId,
			title: input.title,
			performedAt: input.performedAt,
			notes: input.notes
		});
		return id;
	},

	async update(workoutId: string, userId: string, input: UpdateWorkoutInput) {
		await db
			.update(workouts)
			.set(input)
			.where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
	},

	async delete(workoutId: string, userId: string) {
		await db
			.delete(workouts)
			.where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
	},

	async getDetailRaw(workoutId: string) {
		const entries = await db
			.select({
				id: workoutEntries.id,
				sortOrder: workoutEntries.sortOrder,
				machineLabel: workoutEntries.machineLabel,
				notes: workoutEntries.notes,
				exerciseId: exercises.id,
				exerciseName: exercises.name,
				category: exercises.category
			})
			.from(workoutEntries)
			.innerJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
			.where(eq(workoutEntries.workoutId, workoutId))
			.orderBy(workoutEntries.sortOrder);

		const entryIds = entries.map((e) => e.id);
		const sets =
			entryIds.length === 0
				? []
				: await db.select().from(strengthSets).where(inArray(strengthSets.workoutEntryId, entryIds));

		const holdSetRows =
			entryIds.length === 0
				? []
				: await db.select().from(holdSets).where(inArray(holdSets.workoutEntryId, entryIds));

		const cardio =
			entryIds.length === 0
				? []
				: await db.select().from(cardioLogs).where(inArray(cardioLogs.workoutEntryId, entryIds));

		return { entries, sets, holdSets: holdSetRows, cardio };
	},

	async nextEntrySortOrder(workoutId: string): Promise<number> {
		const [row] = await db
			.select({ value: max(workoutEntries.sortOrder) })
			.from(workoutEntries)
			.where(eq(workoutEntries.workoutId, workoutId));
		return (row?.value ?? 0) + 1;
	},

	async hasEntryForExercise(workoutId: string, exerciseId: string): Promise<boolean> {
		const [row] = await db
			.select({ id: workoutEntries.id })
			.from(workoutEntries)
			.where(and(eq(workoutEntries.workoutId, workoutId), eq(workoutEntries.exerciseId, exerciseId)))
			.limit(1);
		return Boolean(row);
	},

	async createEntry(input: {
		id?: string;
		workoutId: string;
		exerciseId: string;
		sortOrder: number;
		machineLabel: string | null;
	}) {
		const id = input.id ?? crypto.randomUUID();
		await db.insert(workoutEntries).values({
			id,
			workoutId: input.workoutId,
			exerciseId: input.exerciseId,
			sortOrder: input.sortOrder,
			machineLabel: input.machineLabel
		});
		return id;
	},

	async deleteEntry(entryId: string) {
		await db.delete(workoutEntries).where(eq(workoutEntries.id, entryId));
	},

	async insertCardioLog(workoutEntryId: string, input: CardioInput) {
		await db.insert(cardioLogs).values({ workoutEntryId, ...input });
	},

	async updateCardioLog(workoutEntryId: string, input: CardioInput) {
		await db.update(cardioLogs).set(input).where(eq(cardioLogs.workoutEntryId, workoutEntryId));
	},

	async insertStrengthSet(workoutEntryId: string, setNumber: number, input: StrengthSetInput) {
		await db.insert(strengthSets).values({
			workoutEntryId,
			setNumber,
			...input
		});
	},

	async nextSetNumber(workoutEntryId: string): Promise<number> {
		const [row] = await db
			.select({ value: max(strengthSets.setNumber) })
			.from(strengthSets)
			.where(eq(strengthSets.workoutEntryId, workoutEntryId));
		return (row?.value ?? 0) + 1;
	},

	async findStrengthSetForUser(setId: string, userId: string) {
		const [row] = await db
			.select({
				id: strengthSets.id,
				workoutEntryId: strengthSets.workoutEntryId
			})
			.from(strengthSets)
			.innerJoin(workoutEntries, eq(strengthSets.workoutEntryId, workoutEntries.id))
			.innerJoin(workouts, eq(workoutEntries.workoutId, workouts.id))
			.where(and(eq(strengthSets.id, setId), eq(workouts.userId, userId)))
			.limit(1);
		return row ?? null;
	},

	async deleteStrengthSet(setId: string) {
		const [set] = await db
			.select({ workoutEntryId: strengthSets.workoutEntryId })
			.from(strengthSets)
			.where(eq(strengthSets.id, setId))
			.limit(1);
		if (!set) return;

		await db.delete(strengthSets).where(eq(strengthSets.id, setId));

		const remaining = await db
			.select({ id: strengthSets.id, setNumber: strengthSets.setNumber })
			.from(strengthSets)
			.where(eq(strengthSets.workoutEntryId, set.workoutEntryId))
			.orderBy(asc(strengthSets.setNumber));

		for (let i = 0; i < remaining.length; i++) {
			const nextNumber = i + 1;
			if (remaining[i].setNumber !== nextNumber) {
				await db
					.update(strengthSets)
					.set({ setNumber: nextNumber })
					.where(eq(strengthSets.id, remaining[i].id));
			}
		}
	},

	async insertHoldSet(workoutEntryId: string, setNumber: number, input: HoldSetInput) {
		await db.insert(holdSets).values({
			workoutEntryId,
			setNumber,
			durationSeconds: input.durationSeconds,
			reps: input.reps,
			weight: input.weight,
			weightUnit: input.weightUnit
		});
	},

	async nextHoldSetNumber(workoutEntryId: string): Promise<number> {
		const [row] = await db
			.select({ value: max(holdSets.setNumber) })
			.from(holdSets)
			.where(eq(holdSets.workoutEntryId, workoutEntryId));
		return (row?.value ?? 0) + 1;
	},

	async findHoldSetForUser(setId: string, userId: string) {
		const [row] = await db
			.select({ id: holdSets.id, workoutEntryId: holdSets.workoutEntryId })
			.from(holdSets)
			.innerJoin(workoutEntries, eq(holdSets.workoutEntryId, workoutEntries.id))
			.innerJoin(workouts, eq(workoutEntries.workoutId, workouts.id))
			.where(and(eq(holdSets.id, setId), eq(workouts.userId, userId)))
			.limit(1);
		return row ?? null;
	},

	async deleteHoldSet(setId: string) {
		const [set] = await db
			.select({ workoutEntryId: holdSets.workoutEntryId })
			.from(holdSets)
			.where(eq(holdSets.id, setId))
			.limit(1);
		if (!set) return;

		await db.delete(holdSets).where(eq(holdSets.id, setId));

		const remaining = await db
			.select({ id: holdSets.id, setNumber: holdSets.setNumber })
			.from(holdSets)
			.where(eq(holdSets.workoutEntryId, set.workoutEntryId))
			.orderBy(asc(holdSets.setNumber));

		for (let i = 0; i < remaining.length; i++) {
			const nextNumber = i + 1;
			if (remaining[i].setNumber !== nextNumber) {
				await db
					.update(holdSets)
					.set({ setNumber: nextNumber })
					.where(eq(holdSets.id, remaining[i].id));
			}
		}
	},

	async getLastHoldSetsByExercise(
		userId: string,
		excludeWorkoutId: string,
		before: Date
	): Promise<Map<string, { durationSeconds: number; reps: number; weight: string | null; weightUnit: 'kg' | 'lb' | null }>> {
		const rows = await db
			.select({
				exerciseId: exercises.id,
				workoutId: workouts.id,
				durationSeconds: holdSets.durationSeconds,
				reps: holdSets.reps,
				weight: holdSets.weight,
				weightUnit: holdSets.weightUnit,
				performedAt: workouts.performedAt
			})
			.from(holdSets)
			.innerJoin(workoutEntries, eq(holdSets.workoutEntryId, workoutEntries.id))
			.innerJoin(workouts, eq(workoutEntries.workoutId, workouts.id))
			.innerJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
			.where(
				and(
					eq(workouts.userId, userId),
					ne(workouts.id, excludeWorkoutId),
					lt(workouts.performedAt, before),
					eq(exercises.category, 'holds')
				)
			)
			.orderBy(desc(workouts.performedAt));

		const lastWorkoutByExercise = new Map<string, string>();
		const setsFromLastWorkout = new Map<
			string,
			{ durationSeconds: number; reps: number; weight: string | null; weightUnit: 'kg' | 'lb' | null }[]
		>();

		for (const row of rows) {
			if (!lastWorkoutByExercise.has(row.exerciseId)) {
				lastWorkoutByExercise.set(row.exerciseId, row.workoutId);
			}
			if (lastWorkoutByExercise.get(row.exerciseId) !== row.workoutId) continue;
			const list = setsFromLastWorkout.get(row.exerciseId) ?? [];
			list.push({
				durationSeconds: row.durationSeconds,
				reps: row.reps,
				weight: row.weight,
				weightUnit: row.weightUnit as 'kg' | 'lb' | null
			});
			setsFromLastWorkout.set(row.exerciseId, list);
		}

		const map = new Map<string, { durationSeconds: number; reps: number; weight: string | null; weightUnit: 'kg' | 'lb' | null }>();
		for (const [exerciseId, sets] of setsFromLastWorkout) {
			const best = sets.reduce((b, s) => (s.durationSeconds > b.durationSeconds ? s : b));
			map.set(exerciseId, best);
		}
		return map;
	},

	async getStrengthSetsForProgress(userId: string, since: Date) {
		return db
			.select({
				exerciseId: exercises.id,
				exerciseName: exercises.name,
				category: exercises.category,
				workoutId: workouts.id,
				performedAt: workouts.performedAt,
				reps: strengthSets.reps,
				weight: strengthSets.weight,
				weightUnit: strengthSets.weightUnit,
				isWarmup: strengthSets.isWarmup
			})
			.from(strengthSets)
			.innerJoin(workoutEntries, eq(strengthSets.workoutEntryId, workoutEntries.id))
			.innerJoin(workouts, eq(workoutEntries.workoutId, workouts.id))
			.innerJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
			.where(
			and(
				eq(workouts.userId, userId),
				gte(workouts.performedAt, since),
				ne(exercises.category, 'cardio'),
				ne(exercises.category, 'holds')
			)
			)
			.orderBy(workouts.performedAt);
	},

	async getCardioLogsForProgress(userId: string, since: Date) {
		return db
			.select({
				exerciseId: exercises.id,
				exerciseName: exercises.name,
				category: exercises.category,
				workoutId: workouts.id,
				performedAt: workouts.performedAt,
				durationSeconds: cardioLogs.durationSeconds,
				distanceMeters: cardioLogs.distanceMeters
			})
			.from(cardioLogs)
			.innerJoin(workoutEntries, eq(cardioLogs.workoutEntryId, workoutEntries.id))
			.innerJoin(workouts, eq(workoutEntries.workoutId, workouts.id))
			.innerJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
			.where(and(eq(workouts.userId, userId), gte(workouts.performedAt, since), eq(exercises.category, 'cardio')))
			.orderBy(workouts.performedAt);
	},

	async listWorkoutsInRange(userId: string, from: Date, to: Date) {
		return db
			.select({ id: workouts.id, performedAt: workouts.performedAt })
			.from(workouts)
			.where(and(eq(workouts.userId, userId), gte(workouts.performedAt, from), lt(workouts.performedAt, to)))
			.orderBy(workouts.performedAt);
	},

	async getPreviousWorkoutPerformedAt(userId: string, before: Date, excludeWorkoutId: string) {
		const [row] = await db
			.select({ performedAt: workouts.performedAt })
			.from(workouts)
			.where(
				and(
					eq(workouts.userId, userId),
					lt(workouts.performedAt, before),
					ne(workouts.id, excludeWorkoutId)
				)
			)
			.orderBy(desc(workouts.performedAt))
			.limit(1);
		return row?.performedAt ?? null;
	},

	async getLastStrengthSetsByExercise(
		userId: string,
		excludeWorkoutId: string,
		before: Date
	): Promise<Map<string, { reps: number; weight: string; weightUnit: 'kg' | 'lb' }>> {
		const rows = await db
			.select({
				exerciseId: exercises.id,
				workoutId: workouts.id,
				reps: strengthSets.reps,
				weight: strengthSets.weight,
				weightUnit: strengthSets.weightUnit,
				performedAt: workouts.performedAt
			})
			.from(strengthSets)
			.innerJoin(workoutEntries, eq(strengthSets.workoutEntryId, workoutEntries.id))
			.innerJoin(workouts, eq(workoutEntries.workoutId, workouts.id))
			.innerJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
			.where(
				and(
					eq(workouts.userId, userId),
				ne(workouts.id, excludeWorkoutId),
				lt(workouts.performedAt, before),
				ne(exercises.category, 'cardio'),
				ne(exercises.category, 'holds'),
				eq(strengthSets.isWarmup, false)
				)
			)
			.orderBy(desc(workouts.performedAt));

		const lastWorkoutByExercise = new Map<string, string>();
		const setsFromLastWorkout = new Map<
			string,
			{ reps: number; weight: string; weightUnit: 'kg' | 'lb' }[]
		>();

		for (const row of rows) {
			if (!lastWorkoutByExercise.has(row.exerciseId)) {
				lastWorkoutByExercise.set(row.exerciseId, row.workoutId);
			}
			if (lastWorkoutByExercise.get(row.exerciseId) !== row.workoutId) continue;

			const list = setsFromLastWorkout.get(row.exerciseId) ?? [];
			list.push({
				reps: row.reps,
				weight: row.weight,
				weightUnit: row.weightUnit
			});
			setsFromLastWorkout.set(row.exerciseId, list);
		}

		const map = new Map<string, { reps: number; weight: string; weightUnit: 'kg' | 'lb' }>();
		for (const [exerciseId, sets] of setsFromLastWorkout) {
			const best = sets.reduce((currentBest, set) => {
				const setLbs = weightToLbs(set.weight, set.weightUnit);
				const bestLbs = weightToLbs(currentBest.weight, currentBest.weightUnit);
				if (setLbs > bestLbs || (setLbs === bestLbs && set.reps > currentBest.reps)) {
					return set;
				}
				return currentBest;
			});
			map.set(exerciseId, best);
		}
		return map;
	},

	async getHistoricalMaxWeightLbsByExercise(
		userId: string,
		before: Date,
		excludeWorkoutId: string
	): Promise<Map<string, number>> {
		const rows = await db
			.select({
				exerciseId: exercises.id,
				maxLbs: sql<string>`max(case when ${strengthSets.weightUnit} = 'kg' then ${strengthSets.weight} * 2.20462 else ${strengthSets.weight} end)`
			})
			.from(strengthSets)
			.innerJoin(workoutEntries, eq(strengthSets.workoutEntryId, workoutEntries.id))
			.innerJoin(workouts, eq(workoutEntries.workoutId, workouts.id))
			.innerJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
			.where(
				and(
					eq(workouts.userId, userId),
					lt(workouts.performedAt, before),
					ne(workouts.id, excludeWorkoutId),
				eq(strengthSets.isWarmup, false),
				ne(exercises.category, 'cardio'),
				ne(exercises.category, 'holds')
			)
			)
			.groupBy(exercises.id);

		return new Map(rows.map((row) => [row.exerciseId, Number(row.maxLbs)]));
	},

	async strengthVolumeForUser(userId: string, from: Date, to: Date): Promise<number> {
		const [row] = await db
			.select({
				value: sql<string>`coalesce(sum((case when ${strengthSets.weightUnit} = 'kg' then ${strengthSets.weight} * 2.20462 else ${strengthSets.weight} end) * ${strengthSets.reps}), 0)`
			})
			.from(strengthSets)
			.innerJoin(workoutEntries, eq(strengthSets.workoutEntryId, workoutEntries.id))
			.innerJoin(workouts, eq(workoutEntries.workoutId, workouts.id))
			.where(
				and(eq(workouts.userId, userId), gte(workouts.performedAt, from), lte(workouts.performedAt, to))
			);

		return Number(row?.value ?? 0);
	}
};
