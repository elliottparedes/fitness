import { error } from '@sveltejs/kit';
import type { Session } from '@auth/core/types';

/** Returns the authenticated session or throws 401. Use in form actions. */
export async function requireSession(
	locals: App.Locals
): Promise<Session & { user: { id: string } }> {
	const session = await locals.auth();
	if (!session?.user?.id) {
		error(401, 'Unauthorized');
	}
	return session as Session & { user: { id: string } };
}

export function getUserId(session: Session): string {
	if (!session.user?.id) {
		error(401, 'Unauthorized');
	}
	return session.user.id;
}
