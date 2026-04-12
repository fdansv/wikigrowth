#!/usr/bin/env python3
"""
Fetch wiki growth data from the Wikimedia API.

Replicates the logic from the Observable notebook:
https://observablehq.com/@fdansv/the-thing-that-gets-the-wikigrowth-stuff

For each wiki in the Wikimedia allowlist, fetches the full history of
monthly new-page counts, computes a cumulative sum, then calculates
year-over-year growth.

Usage:
    python3 scripts/fetch_data.py [start_year] [end_year]
    python3 scripts/fetch_data.py 2023 2025
"""

import json
import os
import subprocess
import sys
import time
import concurrent.futures

ALLOWLIST_URL = "https://raw.githubusercontent.com/wikimedia/analytics-refinery/master/static_data/pageview/allowlist/allowlist.tsv"
# Fetch all data from 1980 to 2027 to ensure we have everything
API_TEMPLATE = "https://wikimedia.org/api/rest_v1/metrics/edited-pages/new/{project}/all-editor-types/content/monthly/19800101/20270101"

DELAY_BETWEEN_REQUESTS = 0.3  # seconds - be polite to the API
MAX_WORKERS = 4  # parallel curl requests
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FAMILIES_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "families")


def curl_fetch(url, timeout=30):
    """Fetch a URL using curl (works through network restrictions)."""
    try:
        result = subprocess.run(
            ["curl", "-sS", "--max-time", str(timeout),
             "-H", "User-Agent: WikiGrowth/1.0 (https://github.com/fdansv/wikigrowth)",
             url],
            capture_output=True, text=True, timeout=timeout + 5
        )
        if result.returncode == 0:
            return result.stdout
        return None
    except (subprocess.TimeoutExpired, Exception):
        return None


def get_allowlist():
    """Fetch the Wikimedia project allowlist."""
    print("Fetching allowlist...")
    text = curl_fetch(ALLOWLIST_URL)
    if not text:
        print("ERROR: Could not fetch allowlist")
        sys.exit(1)

    wikis = []
    for line in text.strip().split("\n"):
        parts = line.split("\t")
        if len(parts) >= 2 and parts[0] == "project":
            wikis.append(parts[1])
    print(f"  Found {len(wikis)} wiki projects")
    return wikis


def fetch_wiki_data(project):
    """Fetch new-page metrics for a wiki project."""
    url = API_TEMPLATE.replace("{project}", project)
    text = curl_fetch(url, timeout=20)
    if not text:
        return None
    try:
        data = json.loads(text)
        if "items" in data and len(data["items"]) > 0:
            return data["items"][0].get("results", [])
    except (json.JSONDecodeError, KeyError, IndexError):
        pass
    return None


def compute_growth(results, year):
    """
    Compute year-over-year growth for a wiki.

    Builds a cumulative sum of new_pages, then compares
    the total at Jan 1 of `year` vs Jan 1 of `year+1`.
    Growth = (end - start) * 100 / start
    """
    start_ts = f"{year}-01-01T00:00:00.000Z"
    end_ts = f"{year + 1}-01-01T00:00:00.000Z"

    # Build cumulative sum (matches notebook logic exactly)
    accumulation = []
    for i, item in enumerate(results):
        prev = accumulation[i - 1] if i > 0 else 0
        accumulation.append(item.get("new_pages", 0) + prev)

    # Find indices for start and end timestamps
    start_idx = None
    end_idx = None
    for i, item in enumerate(results):
        ts = item.get("timestamp", "")
        if ts == start_ts:
            start_idx = i
        if ts == end_ts:
            end_idx = i

    if start_idx is None or end_idx is None:
        return None

    start_val = accumulation[start_idx]
    end_val = accumulation[end_idx]

    if start_val == 0:
        return None

    variation = (end_val - start_val) * 100 / start_val
    return {"start": start_val, "end": end_val, "variation": variation}


def process_wiki(args):
    """Process a single wiki - fetch data and compute growth for all years."""
    project, years = args
    time.sleep(DELAY_BETWEEN_REQUESTS)  # Rate limiting

    results = fetch_wiki_data(project)
    if results is None:
        return project, None

    growths = {}
    for year in years:
        growth = compute_growth(results, year)
        if growth is not None:
            parts = project.split(".")
            language = parts[0] if len(parts) >= 2 else project
            family = parts[1] if len(parts) >= 2 else ""
            growths[year] = {
                "wiki": project,
                "language": language,
                "family": family,
                "start": growth["start"],
                "end": growth["end"],
                "variation": growth["variation"]
            }
    return project, growths


def main():
    start_year = int(sys.argv[1]) if len(sys.argv) > 1 else 2023
    end_year = int(sys.argv[2]) if len(sys.argv) > 2 else 2025
    years = list(range(start_year, end_year + 1))

    print(f"Fetching wiki growth data for years {start_year}-{end_year}")
    print(f"Using {MAX_WORKERS} parallel workers with {DELAY_BETWEEN_REQUESTS}s delay")

    wikis = get_allowlist()

    # Initialize year data containers
    year_data = {year: [] for year in years}
    failed = 0
    processed = 0

    # Process wikis with a thread pool
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(process_wiki, (wiki, years)): wiki
            for wiki in wikis
        }

        for future in concurrent.futures.as_completed(futures):
            processed += 1
            if processed % 50 == 0:
                print(f"  Progress: {processed}/{len(wikis)} "
                      f"({sum(len(v) for v in year_data.values())} entries so far)")

            project, growths = future.result()
            if growths is None:
                failed += 1
                continue

            for year, entry in growths.items():
                year_data[year].append(entry)

    # Sort and write output files
    for year in years:
        data = sorted(year_data[year], key=lambda x: x["wiki"])
        filename = os.path.join(FAMILIES_DIR, f"allWikis{year}.json")
        with open(filename, "w") as f:
            json.dump(data, f)
        print(f"  Wrote {filename} ({len(data)} entries)")

    print(f"\nDone! Processed {processed} wikis, {failed} failed")
    print(f"Years: {', '.join(str(y) + ': ' + str(len(year_data[y])) + ' wikis' for y in years)}")


if __name__ == "__main__":
    main()
