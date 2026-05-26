import { hash } from 'bcryptjs';
import { userRepository } from '$lib/server/repositories/user-repository';
import { formTrimmed } from '$lib/server/validation/form';
import type { ServiceResult } from './workout-service';

const MIN_PASSWORD_LENGTH = 8;

export const userService = {
	async getPreferredWeightUnit(userId: string): Promise<'kg' | 'lb'> {
		try {
			const user = await userRepository.findById(userId);
			return user && 'preferredWeightUnit' in user && user.preferredWeightUnit === 'kg' ? 'kg' : 'lb';
		} catch {
			return 'lb';
		}
	},

	async updatePreferredWeightUnit(userId: string, rawUnit: string | undefined): Promise<ServiceResult<void>> {
		const normalized = rawUnit === 'kg' ? 'kg' : rawUnit === 'lb' || rawUnit === 'lbs' ? 'lb' : null;
		if (!normalized) {
			return { ok: false, message: 'Select a valid unit.' };
		}

		try {
			await userRepository.updatePreferredWeightUnit(userId, normalized);
		} catch {
			return { ok: false, message: 'Could not save default unit yet. Run DB migration and try again.' };
		}
		return { ok: true, data: undefined };
	},

	async registerFromForm(formData: FormData): Promise<ServiceResult<void>> {
		const name = formTrimmed(formData, 'name');
		const email = formTrimmed(formData, 'email')?.toLowerCase();
		const password = formData.get('password')?.toString();

		if (!name || !email || !password) {
			return { ok: false, message: 'All fields are required.' };
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
		}
		if (await userRepository.emailExists(email)) {
			return { ok: false, message: 'An account with this email already exists.' };
		}

		const passwordHash = await hash(password, 12);
		await userRepository.create({ name, email, passwordHash });
		return { ok: true, data: undefined };
	}
};
