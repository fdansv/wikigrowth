(function () {
  "use strict";

  // ----- DOM refs -----
  const $ = (id) => document.getElementById(id);
  const phases = {
    input: $("input-phase"),
    match: $("match-phase"),
    result: $("result-phase"),
  };
  const itemsEl = $("items");
  const inputHint = $("input-hint");
  const startBtn = $("start-btn");
  const exampleBtn = $("example-btn");

  const progressFill = $("progress-fill");
  const progressCount = $("progress-count");
  const cardA = $("card-a");
  const cardB = $("card-b");
  const labelA = $("label-a");
  const labelB = $("label-b");
  const drawBtn = $("draw-btn");
  const undoBtn = $("undo-btn");
  const quitBtn = $("quit-btn");

  const rankingBody = $("ranking-body");
  const copyBtn = $("copy-btn");
  const copyStatus = $("copy-status");
  const editBtn = $("edit-btn");
  const restartBtn = $("restart-btn");

  // ----- State -----
  let items = [];
  let pairs = []; // [ [i, j], ... ]
  let currentIndex = 0;
  let history = []; // [ { pair: [i,j], result: "a"|"b"|"draw" } ]
  let scores = []; // parallel to items: { pts, w, d, l }

  // ----- Helpers -----
  function showPhase(name) {
    for (const key of Object.keys(phases)) {
      phases[key].classList.toggle("hidden", key !== name);
    }
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function parseItems(raw) {
    const seen = new Set();
    const out = [];
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
    }
    return out;
  }

  function updateInputHint() {
    const parsed = parseItems(itemsEl.value);
    const n = parsed.length;
    const matches = (n * (n - 1)) / 2;
    let note = n + " item" + (n === 1 ? "" : "s") + " \u00b7 " + matches + " match" + (matches === 1 ? "" : "es");
    if (n >= 2 && matches >= 40) {
      note += " (that's a lot \u2014 consider trimming)";
    }
    inputHint.textContent = note;
    startBtn.disabled = n < 2;
  }

  function buildPairs(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) out.push([i, j]);
    }
    // Fisher-Yates shuffle
    for (let i = out.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      [out[i], out[k]] = [out[k], out[i]];
    }
    // Randomize left/right within each pair
    for (let i = 0; i < out.length; i++) {
      if (Math.random() < 0.5) out[i] = [out[i][1], out[i][0]];
    }
    return out;
  }

  function makeScores(n) {
    const s = new Array(n);
    for (let i = 0; i < n; i++) s[i] = { pts: 0, w: 0, d: 0, l: 0 };
    return s;
  }

  // ----- Flow -----
  function startRanking() {
    items = parseItems(itemsEl.value);
    if (items.length < 2) return;
    pairs = buildPairs(items.length);
    scores = makeScores(items.length);
    history = [];
    currentIndex = 0;
    showPhase("match");
    renderMatch();
  }

  function renderMatch() {
    if (currentIndex >= pairs.length) {
      finish();
      return;
    }
    const [ai, bi] = pairs[currentIndex];
    labelA.textContent = items[ai];
    labelB.textContent = items[bi];
    const pct = pairs.length === 0 ? 100 : (currentIndex / pairs.length) * 100;
    progressFill.style.width = pct + "%";
    progressCount.textContent = currentIndex + " / " + pairs.length;
    undoBtn.disabled = history.length === 0;
  }

  function applyResult(result) {
    if (currentIndex >= pairs.length) return;
    const [ai, bi] = pairs[currentIndex];
    if (result === "a") {
      scores[ai].pts += 3; scores[ai].w += 1;
      scores[bi].l += 1;
    } else if (result === "b") {
      scores[bi].pts += 3; scores[bi].w += 1;
      scores[ai].l += 1;
    } else {
      scores[ai].pts += 1; scores[ai].d += 1;
      scores[bi].pts += 1; scores[bi].d += 1;
    }
    history.push({ pair: [ai, bi], result: result });
    currentIndex += 1;
    renderMatch();
  }

  function undo() {
    if (history.length === 0) return;
    const last = history.pop();
    const [ai, bi] = last.pair;
    if (last.result === "a") {
      scores[ai].pts -= 3; scores[ai].w -= 1;
      scores[bi].l -= 1;
    } else if (last.result === "b") {
      scores[bi].pts -= 3; scores[bi].w -= 1;
      scores[ai].l -= 1;
    } else {
      scores[ai].pts -= 1; scores[ai].d -= 1;
      scores[bi].pts -= 1; scores[bi].d -= 1;
    }
    currentIndex -= 1;
    renderMatch();
  }

  function finish() {
    // Build sortable array with head-to-head for tie-breaks
    const headToHead = new Map(); // key "i|j" -> result ("a" = first wins, etc.)
    for (const h of history) {
      headToHead.set(h.pair[0] + "|" + h.pair[1], h.result);
    }

    const ranked = items
      .map((label, idx) => ({ idx, label, ...scores[idx] }))
      .sort((x, y) => {
        if (y.pts !== x.pts) return y.pts - x.pts;
        if (y.w !== x.w) return y.w - x.w;
        // head-to-head
        const key1 = x.idx + "|" + y.idx;
        const key2 = y.idx + "|" + x.idx;
        if (headToHead.has(key1)) {
          const r = headToHead.get(key1);
          if (r === "a") return -1;
          if (r === "b") return 1;
        } else if (headToHead.has(key2)) {
          const r = headToHead.get(key2);
          if (r === "a") return 1;
          if (r === "b") return -1;
        }
        return x.label.localeCompare(y.label);
      });

    // Render with proper tie-aware ranking numbers (1224 style)
    rankingBody.innerHTML = "";
    let displayRank = 0;
    let prevPts = null;
    for (let i = 0; i < ranked.length; i++) {
      const row = ranked[i];
      if (row.pts !== prevPts) {
        displayRank = i + 1;
        prevPts = row.pts;
      }
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td class="rank">' + displayRank + "</td>" +
        '<td class="name"></td>' +
        '<td class="pts">' + row.pts + "</td>" +
        '<td class="w">' + row.w + "</td>" +
        '<td class="d">' + row.d + "</td>" +
        '<td class="l">' + row.l + "</td>";
      tr.querySelector(".name").textContent = row.label;
      rankingBody.appendChild(tr);
    }

    showPhase("result");
  }

  function resultsAsText() {
    const rows = Array.from(rankingBody.querySelectorAll("tr"));
    const lines = rows.map((tr) => {
      const cells = tr.children;
      return (
        cells[0].textContent + ". " +
        cells[1].textContent +
        "  (" + cells[2].textContent + " pts, " +
        cells[3].textContent + "W-" +
        cells[4].textContent + "D-" +
        cells[5].textContent + "L)"
      );
    });
    return lines.join("\n");
  }

  async function copyResults() {
    const text = resultsAsText();
    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = "Copied to clipboard.";
    } catch (err) {
      copyStatus.textContent = "Copy failed \u2014 select the table manually.";
    }
    setTimeout(() => { copyStatus.textContent = ""; }, 2500);
  }

  function confirmQuit() {
    if (history.length > 0 && !confirm("Quit and discard current matches?")) return;
    showPhase("input");
  }

  // ----- Events -----
  itemsEl.addEventListener("input", updateInputHint);
  startBtn.addEventListener("click", startRanking);
  exampleBtn.addEventListener("click", () => {
    itemsEl.value = [
      "Spain", "Germany", "France", "Italy",
      "Portugal", "Netherlands", "Belgium", "Sweden"
    ].join("\n");
    updateInputHint();
  });

  cardA.addEventListener("click", () => applyResult("a"));
  cardB.addEventListener("click", () => applyResult("b"));
  drawBtn.addEventListener("click", () => applyResult("draw"));
  undoBtn.addEventListener("click", undo);
  quitBtn.addEventListener("click", confirmQuit);

  copyBtn.addEventListener("click", copyResults);
  editBtn.addEventListener("click", () => showPhase("input"));
  restartBtn.addEventListener("click", () => {
    itemsEl.value = "";
    updateInputHint();
    showPhase("input");
  });

  // Keyboard shortcuts (only active in match phase)
  document.addEventListener("keydown", (e) => {
    if (phases.match.classList.contains("hidden")) return;
    if (e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT")) return;
    const key = e.key.toLowerCase();
    if (key === "1") { e.preventDefault(); applyResult("a"); }
    else if (key === "2") { e.preventDefault(); applyResult("b"); }
    else if (key === "d") { e.preventDefault(); applyResult("draw"); }
    else if (key === "u") { e.preventDefault(); undo(); }
  });

  // Init
  updateInputHint();
})();
