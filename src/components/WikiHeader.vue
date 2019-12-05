<template>
	<div class="wikiheader">
		<div class="box">
			<div class= 'logobox'>
				<div>
					<img class='logo' src="../assets/logo.png">
				</div>
				<div>
					<span class='wikistatstitle'>WIKISTATS</span>
				</div>
			</div>
			<div class='title'>
				<year-selector @newYear="yearChanged" /> WIKIS BY GROWTH
			</div>
		</div>
		<family-selector @familyChanged="familyChanged"/>
	</div>
</template>
<script type="text/javascript">
	import FamilySelector from './FamilySelector.vue';
	import YearSelector from './YearSelector.vue';
	export default {
		name: 'wiki-header',
		components: {
			FamilySelector,
			YearSelector
		},
		methods: {
			familyChanged (family) {
				this.$emit('familyChanged', family);
			},
			yearChanged (year) {
				this.$emit('yearChanged', year);
			}
		}
	};
</script>

<style>
	.box{
		padding-top:15px;
	}
	.title{
		height: 30px;
	}
	.wikiheader {
		color: white;
		font-weight: bold;
		font-size: 45px;
		height: 200px;
		background: #0F2027;  /* fallback for old browsers */
		background: -webkit-linear-gradient(to right, #2C5364, #203A43, #0F2027);  /* Chrome 10-25, Safari 5.1-6 */
		background: linear-gradient(to right, #2C5364, #203A43, #0F2027); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */

		text-align: center;
	}
	@media only screen and (max-width: 600px) {
	  .wikiheader {
	    font-size: 35px;
	  }
	}
	.logo {
		width: 70px;
		filter: brightness(0) invert(1);
	}
	.logobox {
		text-align: center;
		display: inline;
		font-size: 12px;
	}
	.wikistatstitle {
		width: 70px
	}
</style>