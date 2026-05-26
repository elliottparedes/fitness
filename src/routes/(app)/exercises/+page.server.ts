import type { Actions, PageServerLoad } from './$types';
import { requireSession } from '$lib/server/auth/session';
import { failIfError } from '$lib/server/actions/handle-result';
import { exerciseService } from '$lib/server/services/exercise-service';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { session } = await parent();
	return exerciseService.listPageData(session.user.id, url.searchParams.get('category'));
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const session = await requireSession(locals);
		const result = await exerciseService.createFromForm(
			session.user.id,
			await request.formData()
		);
		const err = failIfError(result);
		if (err) return err;
		return { success: true, toast: 'Exercise added' };
	},

	delete: async ({ request, locals }) => {
		const session = await requireSession(locals);
		const formData = await request.formData();
		const exerciseId = formData.get('id');

		if (!exerciseId || typeof exerciseId !== 'string') {
			throw new Error('Invalid exercise ID');
		}

		const result = await exerciseService.deleteFromForm(session.user.id, formData);
		const err = failIfError(result);
		if (err) return err;
		return { success: true, toast: 'Exercise deleted' };
	}
};
