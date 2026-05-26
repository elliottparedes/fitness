<script lang="ts">
	import Dialog, { Title, Content as DialogContent } from '@smui/dialog';
	import Button, { Label } from '@smui/button';

	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		danger = false,
		onconfirm
	}: {
		open?: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		onconfirm?: () => void | Promise<void>;
	} = $props();

	let confirming = $state(false);
	const titleId = $derived(`confirm-${title.replace(/\s+/g, '-').toLowerCase()}`);

	async function handleConfirm() {
		if (!onconfirm) {
			open = false;
			return;
		}
		confirming = true;
		try {
			await onconfirm();
		} finally {
			confirming = false;
		}
	}
</script>

<Dialog bind:open aria-labelledby={titleId}>
	<Title id={titleId}>{title}</Title>
	<DialogContent>
		<p class="confirm-message">{message}</p>
		<div class="dialog-actions">
			<Button type="button" disabled={confirming} onclick={() => (open = false)}>
				<Label>{cancelLabel}</Label>
			</Button>
			<Button
				variant="raised"
				color={danger ? 'secondary' : undefined}
				type="button"
				disabled={confirming}
				onclick={handleConfirm}
			>
				<Label>{confirmLabel}</Label>
			</Button>
		</div>
	</DialogContent>
</Dialog>

<style>
	.confirm-message {
		margin: 0;
	}
	.dialog-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1.25rem;
		flex-wrap: wrap;
	}
</style>
