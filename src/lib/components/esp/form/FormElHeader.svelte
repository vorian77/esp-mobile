<script lang="ts">
	import type { FieldHeader } from '$comps/esp/form/fieldHeader'
	export let field: FieldHeader
	export let formValues: {} | undefined

	const FILENAME = 'FormElHeader.svelte'

	const dynamicLabel = formValues[field.dynamicLabelKey]
</script>

<h3 class="h3">
	<span class="font-semibold"
		>{field.staticLabel}
		{#if dynamicLabel}
			<span>{dynamicLabel}</span>
		{/if}
	</span>
</h3>
