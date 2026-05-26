<script lang="ts">
	import Snackbar, { Label } from '@smui/snackbar';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getToastState, toast } from '$lib/ui/toast.svelte';

	const toastState = getToastState();
	let snackbar: Snackbar | undefined = $state();

	$effect(() => {
		if (toastState.pending && snackbar) {
			toastState.clearPending();
			snackbar.open();
		}
	});

	$effect(() => {
		const form = $page.form as { toast?: string } | null | undefined;
		if (form?.toast) {
			toast(form.toast);
		}
	});

	$effect(() => {
		const param = $page.url.searchParams.get('toast');
		if (!param) return;
		toast(param);
		const path = $page.url.pathname + $page.url.hash;
		goto(path, { replaceState: true, keepFocus: true, noScroll: true });
	});
</script>

<Snackbar class="toast-top" bind:this={snackbar} labelText={toastState.message} timeoutMs={4000}>
	<Label>{toastState.message}</Label>
</Snackbar>

<style>
	:global(.toast-top.mdc-snackbar) {
		top: 1rem;
		bottom: auto;
	}
</style>
