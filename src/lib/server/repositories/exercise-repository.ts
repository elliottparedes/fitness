import { and, eq, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { exercises } from '$lib/server/db/schema';
import type { ExerciseCategory } from '$lib/domain/exercise';

export const exerciseRepository = {
	async findById(id: string) {
		const [row] = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
		return row ?? null;
	},

	async listForUser(userId: string, category?: ExerciseCategory) {
		const visibility = or(eq(exercises.isSystem, true), eq(exercises.createdByUserId, userId));
		const conditions = category ? and(visibility, eq(exercises.category, category)) : visibility;

		return db
			.select()
			.from(exercises)
			.where(conditions)
			.orderBy(exercises.category, exercises.name);
	},

	async createCustom(input: {
		name: string;
		category: ExerciseCategory;
		muscleGroup: string | null;
		description: string | null;
		userId: string;
	}) {
		const id = crypto.randomUUID();
		await db.insert(exercises).values({
			id,
			name: input.name,
			category: input.category,
			muscleGroup: input.muscleGroup,
			description: input.description,
			isSystem: false,
			createdByUserId: input.userId
		});
		return id;
	},
	async deleteCustom(userId: string, id: string) {
		await db
			.delete(exercises)
			.where(
				and(
					eq(exercises.id, id),
					eq(exercises.isSystem, false),
					eq(exercises.createdByUserId, userId)
				)
			);
	}
};
