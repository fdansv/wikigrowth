#!/usr/bin/env node
/**
 * Fetches wiki growth data from the Wikimedia Analytics API.
 *
 * Replicates the logic from the Observable notebook:
 *   https://observablehq.com/@fdansv/the-thing-that-gets-the-wikigrowth-stuff
 *
 * For each wiki project listed in the Wikimedia allowlist, it:
 *   1. Fetches monthly "new pages" counts from the REST API
 *   2. Computes a cumulative sum (total pages to date)
 *   3. Calculates year-over-year growth as a percentage
 *
 * Usage:
 *   node scripts/fetch_data.js [startYear] [endYear]
 *   e.g. node scripts/fetch_data.js 2023 2025
 *
 * Output:
 *   families/allWikis{YEAR}.json for each year in the range
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ALLOWLIST_URL = 'https://raw.githubusercontent.com/wikimedia/analytics-refinery/master/static_data/pageview/allowlist/allowlist.tsv';
const BASE_API = 'https://wikimedia.org/api/rest_v1/metrics/edited-pages/new';
const USER_AGENT = 'WikiGrowth/1.0 (https://github.com/fdansv/wikigrowth)';
const DELAY_MS = 500;

const startYear = parseInt(process.argv[2]) || 2023;
const endYear = parseInt(process.argv[3]) || 2025;

function curlFetch(url) {
    try {
        const result = execSync(
            `curl -s -H "User-Agent: ${USER_AGENT}" "${url}"`,
            { encoding: 'utf8', timeout: 30000 }
        );
        return result;
    } catch (err) {
        throw new Error(`Failed to fetch ${url}: ${err.message}`);
    }
}

function sleep(ms) {
    execSync(`sleep ${ms / 1000}`);
}

function fetchAllowlist() {
    console.log('Fetching wiki allowlist...');
    const text = curlFetch(ALLOWLIST_URL);
    const lines = text.trim().split('\n');
    const projects = [];
    for (const line of lines) {
        const parts = line.split('\t');
        if (parts[0] === 'project') {
            projects.push(parts[1]);
        }
    }
    console.log(`Found ${projects.length} wiki projects`);
    return projects;
}

function fetchWikiData(project) {
    const endDate = `${endYear + 1}020100`;
    const url = `${BASE_API}/${project}/all-editor-types/content/monthly/1980010100/${endDate}`;
    const text = curlFetch(url);
    return JSON.parse(text);
}

function processWikiData(project, data) {
    if (!data || !data.items || !data.items[0] || !data.items[0].results) {
        return null;
    }

    const results = data.items[0].results;

    // Compute cumulative sum of new_pages (same as the Observable notebook)
    const accumulation = [];
    for (let i = 0; i < results.length; i++) {
        const prev = i > 0 ? accumulation[i - 1] : 0;
        accumulation.push(results[i].new_pages + prev);
    }

    // For each year in range, find start (Jan 1 of year) and end (Jan 1 of year+1)
    const yearData = {};
    for (let year = startYear; year <= endYear; year++) {
        const startTimestamp = `${year}-01-01T00:00:00.000Z`;
        const endTimestamp = `${year + 1}-01-01T00:00:00.000Z`;

        const startIdx = results.findIndex(d => d.timestamp === startTimestamp);
        const endIdx = results.findIndex(d => d.timestamp === endTimestamp);

        if (startIdx === -1 || endIdx === -1) continue;

        const startVal = accumulation[startIdx];
        const endVal = accumulation[endIdx];
        const variation = startVal > 0 ? (endVal - startVal) * 100 / startVal : null;

        const language = project.split('.')[0];
        const family = project.split('.')[1];

        yearData[year] = {
            wiki: project,
            language,
            family,
            start: startVal,
            end: endVal,
            variation
        };
    }
    return yearData;
}

function main() {
    console.log(`Generating wiki growth data for years ${startYear}-${endYear}\n`);

    const projects = fetchAllowlist();

    const allResults = {};
    for (let year = startYear; year <= endYear; year++) {
        allResults[year] = [];
    }

    let completed = 0;
    let errors = 0;
    const total = projects.length;

    for (const project of projects) {
        try {
            const data = fetchWikiData(project);
            const yearData = processWikiData(project, data);
            if (yearData) {
                for (const year of Object.keys(yearData)) {
                    allResults[year].push(yearData[year]);
                }
            }
        } catch (err) {
            errors++;
        }
        completed++;
        if (completed % 50 === 0 || completed === total) {
            process.stdout.write(`\rProgress: ${completed}/${total} projects fetched (${errors} errors)`);
        }
        sleep(DELAY_MS);
    }
    console.log('');

    if (errors > 0) {
        console.log(`\n${errors} projects had errors (this is normal for some small wikis)`);
    }

    const familiesDir = path.join(__dirname, '..', 'families');

    for (let year = startYear; year <= endYear; year++) {
        const data = allResults[year]
            .filter(item => item && item.variation !== null && !isNaN(item.variation));
        const filePath = path.join(familiesDir, `allWikis${year}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data));
        console.log(`Wrote ${filePath} (${data.length} wikis)`);
    }

    console.log('\nDone!');
}

main();
