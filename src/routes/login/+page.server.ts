import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { signIn } from '../../auth';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.auth();
	if (session?.user) redirect(303, '/');
	return { registered: url.searchParams.get('registered') === '1' };
};

export const actions = { default: signIn };
