<template>
    <div class='yearSelector'>
        <select
            v-model="year"
            @change="onSelect"
            class="yearDropdown">
            <option v-for="y in years" :key="y" :value="y">{{y}}</option>
        </select>
    </div>
</template>
<script type="text/javascript">
    const minYear = 2002;
    const maxYear = 2025;
    export default {
        name: 'year-selector',
        data () {
            return {
                year: maxYear
            }
        },
        computed: {
            years () {
                const yrs = [];
                for (let y = maxYear; y >= minYear; y--) {
                    yrs.push(y);
                }
                return yrs;
            }
        },
        methods: {
            onSelect () {
                this.$emit('newYear', this.year);
            }
        }
    }
</script>
<style scoped>
.yearSelector {
    display: inline-block;
    border-bottom: 4px dotted white;
}
.yearDropdown {
    font-size: inherit;
    font-weight: inherit;
    font-family: inherit;
    color: white;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: center;
    text-align-last: center;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    padding: 0;
    margin: 0;
}
.yearDropdown:hover {
    color: #bbb;
}
.yearDropdown option {
    color: #2c3e50;
    background: white;
}
</style>
