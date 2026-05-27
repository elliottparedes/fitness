import type { ExerciseCategory } from './exercise';

export type ProgressTrendDirection = 'up' | 'down' | 'flat' | null;

export type ExerciseProgressPoint = {
	date: string;
	value: number;
	reps?: number;
};

export type ExerciseProgressCard = {
	exerciseId: string;
	exerciseName: string;
	category: ExerciseCategory;
	metricLabel: string;
	unit: 'kg' | 'lb' | 'min' | 'mi';
	points: ExerciseProgressPoint[];
	pr: number | null;
	prReps?: number;
	lastValue: number | null;
	trendPct: number | null;
	trendDirection: ProgressTrendDirection;
	isPr: boolean;
	sessionCount: number;
};
