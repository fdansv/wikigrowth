<template>
    <div class='yearSelector' @click="toggleDropdown" ref="container">
        <div v-if="!open">
            {{year}}
        </div>
        <select
            v-else
            v-model="year"
            @change="onSelect"
            @blur="open = false"
            ref="dropdown"
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
                year: maxYear,
                open: false
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
            toggleDropdown () {
                if (!this.open) {
                    this.open = true;
                    this.$nextTick(() => {
                        this.$refs.dropdown.focus();
                    });
                }
            },
            onSelect () {
                this.open = false;
                this.$emit('newYear', this.year);
            }
        }
    }
</script>
<style scoped>
.yearSelector {
    display: inline-block;
    border-bottom: 4px dotted white;
    cursor: pointer;
    min-width: 100px;
}
.yearSelector:hover {
    color: #bbb;
}
.yearSelector div {
    user-select: none;
    margin-bottom: -4px;
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
    outline: none;
    -webkit-appearance: none;
    appearance: none;
}
.yearDropdown option {
    color: #2c3e50;
    background: white;
}
</style>
