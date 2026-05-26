<script lang="ts">
	import Button, { Label } from '@smui/button';
	import Card, { Content } from '@smui/card';
	import Select, { Option } from '@smui/select';
	import HiddenField from '$lib/components/HiddenField.svelte';
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
			<HiddenField name="preferredWeightUnit" value={preferredWeightUnit} />
			<Select bind:value={preferredWeightUnit} label="Default unit">
				<Option value="lb">lbs</Option>
				<Option value="kg">kg</Option>
			</Select>

			{#if form?.message}
				<p class="error-text" style="margin: 0">{form.message}</p>
			{/if}

			<Button variant="raised" type="submit">
				<Label>Save preferences</Label>
			</Button>
		</form>
	</Content>
</Card>
