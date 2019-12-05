<template>
	<div class="wikiheader footer">
		<div class="box">
			<div class= 'logobox'>
				<div>
					<img class='logo' src="../assets/logo.png">
				</div>
				<div>
					<span class='wikistatstitle'>WIKISTATS</span>
				</div>
				<p>
					Growth in this page is measured by the variation in number of articles created over one year. <a target="_blank" href="https://meta.wikimedia.org/wiki/Research:Wikistats_metrics/Pages_to_date">Learn more about the pages to date Wikistats metric</a>.
				</p>
				<p>
					Made by <a target="_blank" href='http://francisco.dance/'>Francisco Dans</a> using the <a target="_blank" href="https://wikitech.wikimedia.org/wiki/Analytics/Data_Lake">Analytics Data Lake</a> by the <a target="_blank" href='https://wikitech.wikimedia.org/wiki/Analytics'>A-Team</a>
				</p>
			</div>
		</div>
	</div>
</template>
<script type="text/javascript">
	export default {
		name: 'wiki-footer'
	}
</script>
<style>
	.wikiheader p a{
		text-decoration:none;
		color: yellow;
	}
	.wikiheader .footer {
		position: fixed;
	    left: 0;
	    bottom: 0;
	}
</style>