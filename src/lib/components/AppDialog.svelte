<script lang="ts">
	import Dialog, { Title, Content as DialogContent } from '@smui/dialog';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		titleId,
		children
	}: {
		open?: boolean;
		title: string;
		titleId?: string;
		children?: Snippet;
	} = $props();

	const resolvedTitleId = $derived(titleId ?? `dialog-${title.replace(/\s+/g, '-').toLowerCase()}`);
</script>

<Dialog bind:open aria-labelledby={resolvedTitleId}>
	<Title id={resolvedTitleId}>{title}</Title>
	<DialogContent>
		{@render children?.()}
	</DialogContent>
</Dialog>
