import type { Actions, PageServerLoad } from './$types';
import { requireSession } from '$lib/server/auth/session';
import { failIfError } from '$lib/server/actions/handle-result';
import { userService } from '$lib/server/services/user-service';
import { formString } from '$lib/server/validation/form';

export const load: PageServerLoad = async ({ parent }) => {
	const { session } = await parent();
	return {
		preferredWeightUnit: await userService.getPreferredWeightUnit(session.user.id)
	};
};

export const actions: Actions = {
	updatePreferredWeightUnit: async ({ request, locals }) => {
		const session = await requireSession(locals);
		const formData = await request.formData();
		const err = failIfError(
			await userService.updatePreferredWeightUnit(session.user.id, formString(formData, 'preferredWeightUnit'))
		);
		if (err) return err;
		return { success: true, toast: 'Preferences saved' };
	}
};
