<template>
  <div id="app">
    <wiki-header @familyChanged="familyChanged"></wiki-header>
    <wikis-table :family="family"></wikis-table>
    <wiki-footer></wiki-footer>
  </div>
</template>

<script>
import WikiHeader from './components/WikiHeader.vue';
import WikisTable from './components/WikisTable.vue';
import WikiFooter from './components/WikiFooter.vue';

export default {
  name: 'app',
  data () {
    return {
      family: 'wikipedia'
    }
  },
  components: {
    WikiHeader,
    WikisTable,
    WikiFooter
  },
  methods: {
    familyChanged (family) {
      this.family = family;
    }
  }
}
</script>

<style>
body, html {
  margin:0;
  padding:0;
}
#app {
  font-family: Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
