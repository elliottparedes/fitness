<script lang="ts">
	import Textfield from '@smui/textfield';
	import Card, { Content } from '@smui/card';
	import HiddenField from '$lib/components/HiddenField.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const now = new Date();
	const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

	let title = $state('');
	let performedAt = $state(localIso);
	let notes = $state('');
</script>

<h1 class="page-title">New workout</h1>

<Card style="max-width: 480px">
	<Content style="padding: 1.5rem">
		{#if form?.message}
			<p class="error-text">{form.message}</p>
		{/if}
		<form method="POST" class="form-stack">
			<HiddenField name="title" value={title} />
			<HiddenField name="performedAt" value={performedAt} />
			<HiddenField name="notes" value={notes} />
			<Textfield bind:value={title} label="Title (optional)" style="width: 100%" />
			<Textfield bind:value={performedAt} label="Date & time" type="datetime-local" required style="width: 100%" />
			<Textfield bind:value={notes} label="Notes" textarea input$rows={3} style="width: 100%" />
			<div class="row-actions">
				<button type="submit" class="btn btn--primary">Start workout</button>
				<a href="/workouts" class="btn btn--secondary">Cancel</a>
			</div>
		</form>
	</Content>
</Card>
