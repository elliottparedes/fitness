<script lang="ts">
	import Textfield from '@smui/textfield';
	import Card, { Content } from '@smui/card';
	import HiddenField from '$lib/components/HiddenField.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let email = $state('');
	let password = $state('');
</script>

<div class="auth-page">
	<Card class="auth-card">
		<Content class="auth-card-content">
			<h1 class="page-title auth-title">Sign in</h1>
			{#if data.registered}
				<p class="muted">Account created. Sign in to continue.</p>
			{/if}
			{#if form?.message}
				<p class="error-text">{form.message}</p>
			{/if}
			<form method="POST" class="form-stack auth-form">
				<input type="hidden" name="providerId" value="credentials" />
				<input type="hidden" name="redirectTo" value="/" />
				<HiddenField name="email" value={email} />
				<HiddenField name="password" value={password} />
				<Textfield bind:value={email} label="Email" type="email" required style="width: 100%" />
				<Textfield bind:value={password} label="Password" type="password" required style="width: 100%" />
				<button type="submit" class="btn btn--primary btn--block auth-submit">Sign in</button>
			</form>
			<p class="muted">
				No account? <a href="/register">Register</a>
			</p>
		</Content>
	</Card>
</div>
