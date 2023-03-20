<template>
    <div
        class = 'yearSelector'
        v-on:mousedown="onDragStart"
        v-on:mousemove="onDragging"
        v-on:mouseup="onDragEnd"
        v-on:mouseout="onDragEnd" >
        <div
            :class='{selecting}' unselectable>
            {{year}}
        </div>
    </div>
</template>
<script type="text/javascript">
    import * as scale from 'd3-scale';
    const maxYear = 2022;
    export default {
        name: 'year-selector',
        data () {
            return {
                year: maxYear,
                selecting: false,
                draggingInfo: {
                    enterPosition: 0
                }
            }
        },
        methods: {
            activateSelecting () {
                this.selecting = true;
            },
            onInput (e) {
                const newYear = parseInt(e.target.textContent);
                if (parseInt(newYear) >= 2001 && parseInt(newYear) < maxYear) {
                    this.year = newYear;
                    this.selecting = false;
                }
            },
            onClick(evnt) {
                const el = evnt.target;
                el.textContent = '20';
            },
            onDragStart (evnt) {
                this.draggingInfo.enterPosition = evnt.clientX;
                this.selecting = true;
            },
            onDragging (evnt) {
                if(!this.selecting) return;
                const offset = evnt.clientX - this.draggingInfo.enterPosition;
                const yearRange = [2002, maxYear];
                const interpolatedYear = scale.scaleLinear()
                        .domain([0, 100])
                        .range(yearRange)(evnt.offsetX);
                this.year = Math.ceil(interpolatedYear);
            },
            onDragEnd (evnt) {
                this.lockSelection(this.year);
            },
            lockSelection (year) {
                this.selecting = false;
                this.$emit('newYear', year);
            },
            selectAll (evnt) {
                const el = evnt.target;
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        },
        watch: {
        }
    }
</script>
<style scoped>
.yearSelector {
    display: inline-block;
    border-bottom: 4px dotted white;
}
.yearSelector:hover {
    cursor: ew-resize;
    color: #bbb;
}
.yearSelector div {
    user-select: none;
    margin-bottom: -4px;
}
.selecting {
    background-color: #FFFFDD;
    color: #000;
}
</style>
