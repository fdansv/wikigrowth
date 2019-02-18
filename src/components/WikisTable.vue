<template>
    <table class="wikistable">
        <tr>
            <th @click = 'changeSorting(0)'
                :class='{"sorting": sortedColumn === 0}'
                class='wikiname'>
                Wiki
            </th>
            <th @click = 'changeSorting(1)'
                :class='{"sorting": sortedColumn === 1}'
                class='number'>
                Articles in January 2018
            </th>
            <th @click = 'changeSorting(2)'
                :class='{"sorting": sortedColumn === 2}'
                class='number'>
                Articles in December 2018
            </th>
            <th @click = 'changeSorting(3)'
                :class='{"sorting": sortedColumn === 3}'
                class='number'>
                Variation percentage
            </th>
        </tr>
        <tr v-for="wiki in formattedWikiData(sortedColumn, family)">
            <td
                class='wikiname'
                :class='{"sorting": sortedColumn === 0}'>
                <a :href="'https://stats.wikimedia.org/v2/#/' + wiki.wiki" >{{findWiki(wiki)}}</a>
            </td>
            <td
                class='number'
                :class='{"sorting": sortedColumn === 1}'>
                {{formatThousands(wiki.start)}}
            </td>
            <td
                class='number'
                :class='{"sorting": sortedColumn === 2}'>
                {{formatThousands(wiki.end)}}
            </td>
            <td
                class='number'
                :class='{"sorting": sortedColumn === 3}'>
                {{formatPercentage(wiki.variation)}}
            </td>
        </tr>
    </table>
</template>
<script type="text/javascript">
    import sitematrix from '../sitematrix.json';
    import {format} from 'd3-format';
    import allWikis from '../../families/allWikis2018.json'
    export default {
        name: 'wikis-table',
        props: ['family'],
        data () {
            return {
                sortedColumn: 3,
                local: false
            }
        },
        methods: {
            formattedWikiData (sortedColumn) {
                return allWikis
                    .filter( wiki => wiki.start > 0)
                    .filter( wiki => (wiki.wiki.indexOf(this.family) > -1) || !this.family)
                    .sort((el1 , el2) => {
                    switch(sortedColumn){
                        case 0:
                            if(this.findWiki(el2) > this.findWiki(el1)) { return -1; }
                            if(this.findWiki(el2) < this.findWiki(el1)) { return 1; }
                            return 0;
                        case 1:
                            return el2.start - el1.start;
                        case 2:
                            return el2.end - el1.end;
                        case 3:
                            return el2.variation - el1.variation;
                    }
                });
            },
            findWiki (w) {
                let family = '';
                const found = Object.keys(sitematrix.sitematrix)
                    .map(key => sitematrix.sitematrix[key])
                    .find((wikiObj) => {
                        const dotIndex = w.wiki.indexOf('.');
                        family = w.wiki.slice(dotIndex + 1);
                        return wikiObj.code === w.wiki.replace(w.wiki.slice(dotIndex), '');
                    });
                return (found && found.localname + ' ' + family) || w.wiki
            },
            formatPercentage(number) {
                return Math.round(number*100)/100 + '%';
            },
            formatThousands(number) {
                return format(",")(number);
            },
            changeSorting(index){
                this.sortedColumn = index;
            }
        }
    }
</script>

<style scoped>
.wikistable {
    margin: 0 auto;
}
.wikistable a {
    text-decoration: none;
    color: #2C5364;
}
.wikistable a:hover{
    text-decoration: underline;
    color: #0F2027;
}
.wikistable th {
    height: 40px;
    text-transform: uppercase;
    font-size: 10px;
    text-align: right;
    vertical-align: bottom;
    cursor: pointer;
}
.wikistable th.sorting{
    background: #0F2027;
    background: -webkit-linear-gradient(to right, #2C5364, #203A43, #0F2027);
    background: linear-gradient(to right, #2C5364, #203A43, #0F2027); 
    color: white;
    cursor: default;
}
.wikistable th:not(.sorting):hover{
    background-color: #2C5364;
    color: white;
}
.wikistable td.sorting{
    font-weight: bold;
}
.wikistable tr {
    height: 30px;
}
.wikistable td {
    border-bottom: solid 0.5px lightgray;
}
.wikistable .wikiname {
    text-transform: capitalize;
    text-align: left;
    font-weight: bold;
}
.wikistable .number {
    text-align: right;
}
.wikistable td.number {
    font-family: monospace;
    font-size: 15px
}
</style>
