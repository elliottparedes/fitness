<script lang="ts">
	/** Keeps SMUI inputs in sync with native form submission (SMUI does not expose `name`). */
	let { name, value }: { name: string; value: string | number | boolean } = $props();
</script>

<input type="hidden" {name} value={String(value)} />
