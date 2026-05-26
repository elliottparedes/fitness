<script lang="ts">
	type ExerciseOption = {
		id: string;
		name: string;
	};

	let {
		id = 'exercise-combobox',
		label = 'Exercise',
		query = $bindable(''),
		open = $bindable(false),
		options = []
	}: {
		id?: string;
		label?: string;
		query?: string;
		open?: boolean;
		options: ExerciseOption[];
	} = $props();

	function closeDropdown() {
		setTimeout(() => (open = false), 120);
	}

	function pickOption(option: ExerciseOption) {
		query = option.name;
		open = false;
	}
</script>

<label for={id} class="muted" style="margin-top: 0.25rem">{label}</label>
<div class="exercise-combobox">
	<input
		{id}
		class="native-input"
		type="search"
		bind:value={query}
		placeholder="Search and pick an exercise"
		autocomplete="off"
		onfocus={() => (open = true)}
		onblur={closeDropdown}
	/>
	{#if open && options.length > 0}
		<div class="exercise-suggestions" role="listbox" aria-label={`${label} suggestions`}>
			{#each options as option (option.id)}
				<button
					type="button"
					class="exercise-suggestion"
					onmousedown={(event) => event.preventDefault()}
					onclick={() => pickOption(option)}
				>
					{option.name}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.exercise-combobox {
		position: relative;
		width: 100%;
	}

	.exercise-combobox .native-input {
		width: 100%;
	}

	.exercise-suggestions {
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		width: 100%;
		max-height: 15rem;
		overflow: auto;
		background: var(--app-input-bg, #fff);
		border: 1px solid var(--app-border, rgba(0, 0, 0, 0.12));
		border-radius: 6px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
		z-index: 20;
	}

	.exercise-suggestion {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.6rem 0.75rem;
		border: 0;
		background: transparent;
		color: var(--app-on-surface, inherit);
		font: inherit;
		cursor: pointer;
	}

	.exercise-suggestion:hover,
	.exercise-suggestion:focus-visible {
		background: rgba(255, 255, 255, 0.08);
		outline: none;
	}
</style>
