import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../../src/lib/server/db/index.js';
import { exercises } from '../../src/lib/server/db/schema.js';

type SeedExercise = {
	name: string;
	category: 'machine' | 'cardio' | 'free_weight' | 'holds';
	muscleGroup?: string;
	description?: string;
};

const catalog: SeedExercise[] = [
	{ name: 'Bench Press', category: 'free_weight', muscleGroup: 'chest' },
	{ name: 'Incline Bench Press', category: 'free_weight', muscleGroup: 'chest' },
	{ name: 'Dumbbell Fly', category: 'free_weight', muscleGroup: 'chest' },
	{ name: 'Push-Up', category: 'free_weight', muscleGroup: 'chest' },
	{ name: 'Back Squat', category: 'free_weight', muscleGroup: 'legs' },
	{ name: 'Front Squat', category: 'free_weight', muscleGroup: 'legs' },
	{ name: 'Romanian Deadlift', category: 'free_weight', muscleGroup: 'legs' },
	{ name: 'Conventional Deadlift', category: 'free_weight', muscleGroup: 'back' },
	{ name: 'Barbell Row', category: 'free_weight', muscleGroup: 'back' },
	{ name: 'Pull-Up', category: 'free_weight', muscleGroup: 'back' },
	{ name: 'Overhead Press', category: 'free_weight', muscleGroup: 'shoulders' },
	{ name: 'Lateral Raise', category: 'free_weight', muscleGroup: 'shoulders' },
	{ name: 'Barbell Curl', category: 'free_weight', muscleGroup: 'arms' },
	{ name: 'Tricep Extension', category: 'free_weight', muscleGroup: 'arms' },
	{ name: 'Walking Lunge', category: 'free_weight', muscleGroup: 'legs' },
	{ name: 'Leg Press', category: 'machine', muscleGroup: 'legs' },
	{ name: 'Lat Pulldown', category: 'machine', muscleGroup: 'back' },
	{ name: 'Seated Row', category: 'machine', muscleGroup: 'back' },
	{ name: 'Cable Fly', category: 'machine', muscleGroup: 'chest' },
	{ name: 'Smith Machine Squat', category: 'machine', muscleGroup: 'legs' },
	{ name: 'Pec Deck', category: 'machine', muscleGroup: 'chest' },
	{ name: 'Leg Extension', category: 'machine', muscleGroup: 'legs' },
	{ name: 'Leg Curl', category: 'machine', muscleGroup: 'legs' },
	{ name: 'Cable Tricep Pushdown', category: 'machine', muscleGroup: 'arms' },
	{ name: 'Cable Bicep Curl', category: 'machine', muscleGroup: 'arms' },
	{ name: 'Hip Abductor', category: 'machine', muscleGroup: 'legs' },
	{ name: 'Hip Adductor', category: 'machine', muscleGroup: 'legs' },
	{ name: 'Plank', category: 'holds', muscleGroup: 'core' },
	{ name: 'Side Plank', category: 'holds', muscleGroup: 'core' },
	{ name: 'Hollow Hold', category: 'holds', muscleGroup: 'core' },
	{ name: 'Dead Hang', category: 'holds', muscleGroup: 'back', description: 'Hanging from a bar with arms extended' },
	{ name: 'Wall Sit', category: 'holds', muscleGroup: 'legs' },
	{ name: 'L-Sit', category: 'holds', muscleGroup: 'core' },
	{ name: 'Bottom Squat Hold', category: 'holds', muscleGroup: 'legs' },
	{ name: 'Treadmill Run', category: 'cardio', description: 'Running on treadmill' },
	{ name: 'Treadmill Walk', category: 'cardio', description: 'Walking on treadmill' },
	{ name: 'Stationary Bike', category: 'cardio', description: 'Upright or recumbent bike' },
	{ name: 'Rowing Machine', category: 'cardio', description: 'Indoor rower' },
	{ name: 'Elliptical', category: 'cardio', description: 'Elliptical trainer' },
	{ name: 'Stair Climber', category: 'cardio', description: 'Stair stepper' },
	{ name: 'Jump Rope', category: 'cardio', description: 'Skipping rope' },
	{ name: 'Assault Bike', category: 'cardio', description: 'Air bike intervals' }
];

async function seed() {
	let inserted = 0;
	for (const item of catalog) {
		const existing = await db
			.select({ id: exercises.id })
			.from(exercises)
			.where(eq(exercises.name, item.name))
			.limit(1);

		if (existing.length > 0) continue;

		await db.insert(exercises).values({
			name: item.name,
			category: item.category,
			muscleGroup: item.muscleGroup ?? null,
			description: item.description ?? null,
			isSystem: true,
			createdByUserId: null
		});
		inserted++;
	}

	console.log(`Seed complete: ${inserted} new exercises (${catalog.length} in catalog).`);
	process.exit(0);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
