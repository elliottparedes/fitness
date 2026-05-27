import { and, count, desc, eq, gte, inArray, lte, max, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	cardioLogs,
	exercises,
	strengthSets,
	workoutEntries,
	workouts
} from '$lib/server/db/schema';
import type { CardioInput, StrengthSetInput } from '$lib/server/validation/form';
import type { CreateWorkoutInput, UpdateWorkoutInput } from '$lib/domain/workout';

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

		const cardio =
			entryIds.length === 0
				? []
				: await db.select().from(cardioLogs).where(inArray(cardioLogs.workoutEntryId, entryIds));

		return { entries, sets, cardio };
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
