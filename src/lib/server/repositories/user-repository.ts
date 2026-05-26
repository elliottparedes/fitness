import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';

function isMissingWeightUnitColumn(error: unknown): boolean {
	if (error == null || typeof error !== 'object') return false;
	const maybeError = error as { message?: string; cause?: unknown; stack?: string };
	const message = maybeError.message ?? '';
	const stack = maybeError.stack ?? '';
	const causeMessage =
		maybeError.cause && typeof maybeError.cause === 'object' && 'message' in maybeError.cause
			? String((maybeError.cause as { message?: string }).message ?? '')
			: '';
	const combined = `${message}\n${causeMessage}\n${stack}`;
	return /unknown column .*weight_unit/i.test(combined);
}

export const userRepository = {
	async findById(id: string) {
		try {
			const [row] = await db
				.select({
					id: users.id,
					preferredWeightUnit: users.preferredWeightUnit
				})
				.from(users)
				.where(eq(users.id, id))
				.limit(1);
			return row ?? null;
		} catch (error) {
			if (!isMissingWeightUnitColumn(error)) throw error;
			const [row] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
			return row ?? null;
		}
	},

	async findByEmail(email: string) {
		const [row] = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				passwordHash: users.passwordHash
			})
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
		return row ?? null;
	},

	async emailExists(email: string): Promise<boolean> {
		const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
		return Boolean(row);
	},

	async create(input: { name: string; email: string; passwordHash: string }) {
		const id = crypto.randomUUID();
		await db.insert(users).values({
			id,
			name: input.name,
			email: input.email,
			passwordHash: input.passwordHash
		});
		return id;
	},

	async updatePreferredWeightUnit(id: string, preferredWeightUnit: 'kg' | 'lb') {
		try {
			await db.update(users).set({ preferredWeightUnit }).where(eq(users.id, id));
		} catch (error) {
			if (!isMissingWeightUnitColumn(error)) throw error;
		}
	}
};
