import type { ExerciseCategory } from './exercise';

/** View model for a workout entry on the detail page. */
export type WorkoutEntryView = {
	id: string;
	sortOrder: number;
	machineLabel: string | null;
	notes: string | null;
	exerciseId: string;
	exerciseName: string;
	category: ExerciseCategory;
	sets: StrengthSetView[];
	cardio: CardioLogView | null;
};

export type StrengthSetView = {
	id: string;
	workoutEntryId: string;
	setNumber: number;
	reps: number;
	weight: string;
	weightUnit: 'kg' | 'lb';
	isWarmup: boolean;
};

/** Last logged working set for an exercise from a prior workout. */
export type LastRecordedSet = {
	reps: number;
	weight: string;
	weightUnit: 'kg' | 'lb';
};

export type CardioLogView = {
	workoutEntryId: string;
	durationSeconds: number;
	distanceMeters: number | null;
	calories: number | null;
	avgHeartRate: number | null;
	speedKph: string | null;
	inclinePercent: string | null;
	resistanceLevel: number | null;
};

export type CreateWorkoutInput = {
	userId: string;
	title: string | null;
	performedAt: Date;
	notes: string | null;
};

export type UpdateWorkoutInput = {
	title: string | null;
	performedAt: Date;
	notes: string | null;
};
