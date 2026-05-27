<script lang="ts">
	import Textfield from '@smui/textfield';
	import Card, { Content } from '@smui/card';
	import HiddenField from '$lib/components/HiddenField.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
</script>

<div class="auth-page">
	<Card class="auth-card">
		<Content class="form-stack" style="padding: 1.5rem">
			<h1 class="page-title" style="margin-bottom: 0.5rem">Create account</h1>
			{#if form?.message}
				<p class="error-text">{form.message}</p>
			{/if}
			<form method="POST" class="form-stack">
				<HiddenField name="name" value={name} />
				<HiddenField name="email" value={email} />
				<HiddenField name="password" value={password} />
				<Textfield bind:value={name} label="Name" required style="width: 100%" />
				<Textfield bind:value={email} label="Email" type="email" required style="width: 100%" />
				<Textfield bind:value={password} label="Password (min 8 characters)" type="password" required style="width: 100%" />
				<button type="submit" class="btn btn--primary btn--block">Register</button>
			</form>
			<p class="muted">
				Already have an account? <a href="/login">Sign in</a>
			</p>
		</Content>
	</Card>
</div>
