import { isExerciseCategory } from '$lib/domain/exercise';
import { exerciseRepository } from '$lib/server/repositories/exercise-repository';
import { formTrimmed } from '$lib/server/validation/form';
import type { ExerciseCategory } from '$lib/domain/exercise';
import type { ServiceResult } from './workout-service';

export const exerciseService = {
	async listForUser(userId: string, category?: ExerciseCategory) {
		return exerciseRepository.listForUser(userId, category);
	},

	async listPageData(userId: string, categoryFilter: string | null) {
		const category = isExerciseCategory(categoryFilter) ? categoryFilter : undefined;
		const all = await exerciseRepository.listForUser(userId);
		const exercises = category ? all.filter((e) => e.category === category) : all;
		return {
			exercises,
			category: category ?? null,
			myExercises: all.filter((e) => !e.isSystem)
		};
	},

	async createFromForm(userId: string, formData: FormData): Promise<ServiceResult<void>> {
		const name = formTrimmed(formData, 'name');
		const categoryRaw = formTrimmed(formData, 'category');

		if (!name || !isExerciseCategory(categoryRaw)) {
			return { ok: false, message: 'Name and category are required.' };
		}

		await exerciseRepository.createCustom({
			name,
			category: categoryRaw,
			muscleGroup: categoryRaw === 'cardio' ? null : formTrimmed(formData, 'muscleGroup') || null,
			description: formTrimmed(formData, 'description') || null,
			userId
		});

		return { ok: true, data: undefined };
	},

	async deleteCustom(userId: string, id: string | undefined): Promise<ServiceResult<void>> {
		if (!id) {
			return { ok: false, message: 'Exercise not found.' };
		}

		const exercise = await exerciseRepository.findById(id);
		if (!exercise || exercise.isSystem || exercise.createdByUserId !== userId) {
			return { ok: false, message: 'Exercise not found.' };
		}

		await exerciseRepository.deleteCustom(userId, id);
		return { ok: true, data: undefined };
	},

	async deleteFromForm(userId: string, formData: FormData): Promise<ServiceResult<void>> {
		return this.deleteCustom(userId, formTrimmed(formData, 'id'));
	}
};
