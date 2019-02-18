<template>
	<div>
		<select v-model="selectedFamily">
			<option v-for="family in families" :value="family.family">{{family.name}}</option>
		</select>
	</div>
</template>
<script type="text/javascript">
	import wikiFamilies from '../wikigroups.js'
	export default {
		name: 'family-selector',
		data () {
			return {
				families: wikiFamilies,
				selectedFamily: 'wikipedia'
			}
		},
		watch: {
			selectedFamily () {
				this.$emit('familyChanged', this.selectedFamily);
			}
		}
	}
</script>
<style scoped type="text/css"></style>
