<script lang="ts">
	import Card, { Content } from '@smui/card';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	let preferredWeightUnit = $state<'kg' | 'lb'>('lb');

	$effect(() => {
		preferredWeightUnit = data.preferredWeightUnit;
	});
</script>

<h1 class="page-title">Preferences</h1>
<p class="muted">Manage your default workout settings.</p>

<Card style="margin-top: 1rem">
	<Content style="padding: 1rem">
		<h2 class="section-title section-title--on-surface">Strength unit</h2>
		<form method="POST" action="?/updatePreferredWeightUnit" class="form-stack">
			<label class="form-field">
				<span class="form-field__label">Default unit</span>
				<select class="native-input" name="preferredWeightUnit" bind:value={preferredWeightUnit}>
					<option value="lb">lbs</option>
					<option value="kg">kg</option>
				</select>
			</label>

			{#if form?.message}
				<p class="error-text" style="margin: 0">{form.message}</p>
			{/if}

			<button type="submit" class="btn btn--primary">Save preferences</button>
		</form>
	</Content>
</Card>
