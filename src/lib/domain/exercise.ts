/** Domain constants and types — no framework or DB imports. */

export const EXERCISE_CATEGORIES = ['machine', 'cardio', 'free_weight'] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
	machine: 'Machines',
	cardio: 'Cardio',
	free_weight: 'Free weights'
};

export function isExerciseCategory(value: string | null | undefined): value is ExerciseCategory {
	return EXERCISE_CATEGORIES.includes(value as ExerciseCategory);
}

export function isStrengthCategory(category: ExerciseCategory): boolean {
	return category === 'machine' || category === 'free_weight';
}
