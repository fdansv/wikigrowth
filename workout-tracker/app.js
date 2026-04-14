import { DEFAULT_WORKOUTS, DEFAULT_UNIT } from "./defaults.js";

// ---------- Storage ----------
const STORAGE_KEY = "liftlog.v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initialState() {
  return {
    unit: DEFAULT_UNIT, // "kg" or "lb"
    workouts: deepClone(DEFAULT_WORKOUTS), // templates (editable)
    history: [], // array of completed sessions
    activeSession: null, // in-progress session
    view: "today",
    createdAt: new Date().toISOString(),
  };
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

let state = loadState() || initialState();
// migrate: ensure required fields
if (!Array.isArray(state.workouts)) state.workouts = deepClone(DEFAULT_WORKOUTS);
if (!Array.isArray(state.history)) state.history = [];
if (!state.unit) state.unit = DEFAULT_UNIT;

// ---------- View router ----------
const root = document.getElementById("view-root");
const titleEl = document.getElementById("view-title");
const headerAction = document.getElementById("header-action");
const tabs = document.querySelectorAll(".tab");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const v = tab.dataset.view;
    navigate(v);
  });
});

function navigate(view) {
  state.view = view;
  saveState();
  render();
}

function setActiveTab(view) {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.view === view));
}

// ---------- Utils ----------
function fmtDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function totalVolume(session) {
  let v = 0;
  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      if (s.done && s.weight != null && s.reps != null) {
        v += Number(s.weight) * Number(s.reps);
      }
    }
  }
  return v;
}

function totalSetsDone(session) {
  let n = 0;
  for (const ex of session.exercises) {
    for (const s of ex.sets) if (s.done) n++;
  }
  return n;
}

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function lastUsedWeightFor(exerciseName) {
  // Scan history in reverse for most recent logged weight for this exercise.
  for (let i = state.history.length - 1; i >= 0; i--) {
    const sess = state.history[i];
    for (const ex of sess.exercises) {
      if (ex.name === exerciseName) {
        const done = ex.sets.filter((s) => s.done && s.weight != null);
        if (done.length) return done[done.length - 1].weight;
      }
    }
  }
  return null;
}

// ---------- Sessions ----------
function startSession(template) {
  const session = {
    id: uid("sess"),
    templateId: template.id,
    name: template.name,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exercises: template.exercises.map((ex) => {
      const lastWeight = lastUsedWeightFor(ex.name);
      return {
        name: ex.name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        sets: Array.from({ length: ex.sets }, () => ({
          weight: lastWeight != null ? lastWeight : ex.weight,
          reps: ex.reps,
          done: false,
        })),
      };
    }),
  };
  state.activeSession = session;
  saveState();
  navigate("today");
}

function finishSession() {
  if (!state.activeSession) return;
  state.activeSession.finishedAt = new Date().toISOString();
  state.history.push(state.activeSession);
  state.activeSession = null;
  saveState();
  navigate("history");
}

function abandonSession() {
  state.activeSession = null;
  saveState();
  render();
}

// ---------- Render ----------
function render() {
  setActiveTab(state.view);
  headerAction.hidden = true;
  headerAction.onclick = null;

  switch (state.view) {
    case "today": renderToday(); break;
    case "workouts": renderWorkouts(); break;
    case "history": renderHistory(); break;
    case "settings": renderSettings(); break;
    default: renderToday();
  }
}

// ---------- Today view ----------
function renderToday() {
  titleEl.textContent = state.activeSession ? "Workout" : "Today";

  if (state.activeSession) {
    renderActiveSession();
    return;
  }

  // Stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekSessions = state.history.filter((s) => new Date(s.startedAt) >= weekStart);
  const weekVolume = weekSessions.reduce((acc, s) => acc + totalVolume(s), 0);
  const weekSets = weekSessions.reduce((acc, s) => acc + totalSetsDone(s), 0);

  const lastSess = state.history[state.history.length - 1];

  root.innerHTML = `
    ${!navigator.standalone && !window.matchMedia('(display-mode: standalone)').matches ? `
      <div class="install-banner">
        Tip — in Safari tap <b>Share</b> → <b>Add to Home Screen</b> to install this app.
      </div>
    ` : ""}

    <div class="hero">
      <h2>Ready to lift?</h2>
      <div class="muted" style="margin-top:4px">Pick a workout to start. Your weights are saved automatically.</div>
    </div>

    <div class="stat-row">
      <div class="stat"><div class="n">${weekSessions.length}</div><div class="l">Sessions 7d</div></div>
      <div class="stat"><div class="n">${weekSets}</div><div class="l">Sets 7d</div></div>
      <div class="stat"><div class="n">${Math.round(weekVolume)}</div><div class="l">Volume 7d (${esc(state.unit)})</div></div>
    </div>

    ${lastSess ? `
      <div class="section-heading">Last session</div>
      <div class="card">
        <div class="row">
          <div>
            <div style="font-weight:600">${esc(lastSess.name)}</div>
            <div class="muted">${fmtDate(lastSess.startedAt)} · ${totalSetsDone(lastSess)} sets · ${Math.round(totalVolume(lastSess))} ${esc(state.unit)}</div>
          </div>
        </div>
      </div>
    ` : ""}

    <div class="section-heading">Start a workout</div>
    <div id="start-list"></div>
  `;

  const list = root.querySelector("#start-list");
  state.workouts.forEach((w) => {
    const el = document.createElement("div");
    el.className = "list-item";
    el.innerHTML = `
      <div>
        <div class="title">${esc(w.name)}</div>
        <div class="sub">${w.exercises.length} exercises · ${esc(w.category || "")}</div>
      </div>
      <button class="btn small">Start</button>
    `;
    el.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      startSession(w);
    });
    el.addEventListener("click", () => openWorkoutEditor(w.id));
    list.appendChild(el);
  });
}

function renderActiveSession() {
  const sess = state.activeSession;
  const setsDone = totalSetsDone(sess);
  const volume = Math.round(totalVolume(sess));

  root.innerHTML = `
    <div class="hero">
      <h2>${esc(sess.name)}</h2>
      <div class="muted">Started ${fmtDateTime(sess.startedAt)}</div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="n">${setsDone}</div><div class="l">Sets Done</div></div>
      <div class="stat"><div class="n">${volume}</div><div class="l">Volume (${esc(state.unit)})</div></div>
      <div class="stat"><div class="n">${sess.exercises.length}</div><div class="l">Exercises</div></div>
    </div>
    <div id="ex-list"></div>
    <div class="actions-row" style="margin-top:16px">
      <button class="btn full" id="finish-btn">Finish workout</button>
    </div>
    <div class="actions-row">
      <button class="btn ghost full" id="abandon-btn">Discard</button>
    </div>
  `;

  const list = root.querySelector("#ex-list");
  sess.exercises.forEach((ex, exIdx) => {
    const card = document.createElement("div");
    card.className = "ex-card";
    const last = lastUsedWeightFor(ex.name);
    card.innerHTML = `
      <div class="ex-header">
        <div>
          <div class="name">${esc(ex.name)}</div>
          <div class="meta">${ex.targetSets}×${ex.targetReps}${last != null ? ` · last: ${last} ${esc(state.unit)}` : ""}</div>
        </div>
      </div>
      <div class="set-header">
        <span>#</span><span>${esc(state.unit)}</span><span>Reps</span><span>✓</span><span></span>
      </div>
      <div class="sets"></div>
      <button class="add-set">+ Add set</button>
    `;
    const setsEl = card.querySelector(".sets");
    ex.sets.forEach((s, i) => setsEl.appendChild(buildSetRow(exIdx, i, s)));
    card.querySelector(".add-set").addEventListener("click", () => {
      const prev = ex.sets[ex.sets.length - 1];
      ex.sets.push({
        weight: prev ? prev.weight : 0,
        reps: prev ? prev.reps : ex.targetReps,
        done: false,
      });
      saveState();
      renderActiveSession();
    });
    list.appendChild(card);
  });

  root.querySelector("#finish-btn").addEventListener("click", () => {
    if (totalSetsDone(sess) === 0) {
      if (!confirm("No sets marked done. Finish anyway?")) return;
    }
    finishSession();
  });
  root.querySelector("#abandon-btn").addEventListener("click", () => {
    if (confirm("Discard this workout? Progress will be lost.")) abandonSession();
  });
}

function buildSetRow(exIdx, setIdx, s) {
  const row = document.createElement("div");
  row.className = "set-grid";
  row.innerHTML = `
    <div class="idx">${setIdx + 1}</div>
    <input type="number" inputmode="decimal" step="0.5" value="${s.weight ?? ""}" aria-label="Weight" />
    <input type="number" inputmode="numeric" step="1" value="${s.reps ?? ""}" aria-label="Reps" />
    <button class="done ${s.done ? "is-done" : ""}" aria-label="Mark done">${s.done ? "✓" : ""}</button>
    <button class="remove" aria-label="Remove set">×</button>
  `;
  const [weightI, repsI] = row.querySelectorAll("input");
  weightI.addEventListener("change", (e) => {
    s.weight = e.target.value === "" ? null : Number(e.target.value);
    saveState();
  });
  repsI.addEventListener("change", (e) => {
    s.reps = e.target.value === "" ? null : Number(e.target.value);
    saveState();
  });
  row.querySelector(".done").addEventListener("click", () => {
    s.done = !s.done;
    saveState();
    renderActiveSession();
  });
  row.querySelector(".remove").addEventListener("click", () => {
    const ex = state.activeSession.exercises[exIdx];
    ex.sets.splice(setIdx, 1);
    saveState();
    renderActiveSession();
  });
  return row;
}

// ---------- Workouts view (library) ----------
function renderWorkouts() {
  titleEl.textContent = "Workouts";
  headerAction.hidden = false;
  headerAction.textContent = "+";
  headerAction.onclick = () => openWorkoutEditor(null);

  if (state.workouts.length === 0) {
    root.innerHTML = `
      <div class="empty">
        No workouts yet. Tap <b>+</b> to add one.
        <div class="actions-row" style="margin-top:14px;justify-content:center">
          <button class="btn" id="restore">Restore defaults</button>
        </div>
      </div>
    `;
    root.querySelector("#restore").addEventListener("click", () => {
      state.workouts = deepClone(DEFAULT_WORKOUTS);
      saveState();
      render();
    });
    return;
  }

  root.innerHTML = `<div id="wk-list"></div>`;
  const list = root.querySelector("#wk-list");
  state.workouts.forEach((w) => {
    const el = document.createElement("div");
    el.className = "list-item";
    el.innerHTML = `
      <div style="flex:1;min-width:0">
        <div class="title">${esc(w.name)}</div>
        <div class="sub">${w.exercises.length} exercises · ${esc(w.category || "")}</div>
        <div class="chip-row">
          ${w.exercises.slice(0, 4).map((e) => `<span class="chip">${esc(e.name)}</span>`).join("")}
          ${w.exercises.length > 4 ? `<span class="chip">+${w.exercises.length - 4}</span>` : ""}
        </div>
      </div>
      <button class="btn small">Start</button>
    `;
    el.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      startSession(w);
    });
    el.addEventListener("click", () => openWorkoutEditor(w.id));
    list.appendChild(el);
  });
}

// ---------- Workout editor (create/edit template) ----------
function openWorkoutEditor(id) {
  const isNew = id == null;
  const original = isNew
    ? { id: uid("tpl"), name: "", category: "Custom", note: "", exercises: [] }
    : state.workouts.find((w) => w.id === id);
  if (!original) return;
  const wk = deepClone(original);

  function content() {
    return `
      <div class="grabber"></div>
      <h2>${isNew ? "New Workout" : "Edit Workout"}</h2>
      <div class="field">
        <label>Name</label>
        <input id="f-name" type="text" value="${esc(wk.name)}" placeholder="e.g. Push Day" />
      </div>
      <div class="field">
        <label>Category</label>
        <input id="f-cat" type="text" value="${esc(wk.category || "")}" placeholder="e.g. Strength" />
      </div>
      <div class="field">
        <label>Note</label>
        <textarea id="f-note">${esc(wk.note || "")}</textarea>
      </div>

      <div class="section-heading" style="margin-left:2px">Exercises</div>
      <div id="ex-edit"></div>
      <button class="add-set" id="add-ex">+ Add exercise</button>

      <div class="actions-row" style="margin-top:14px">
        <button class="btn full" id="save">Save</button>
      </div>
      ${!isNew ? `
        <div class="actions-row">
          <button class="btn danger full" id="delete">Delete workout</button>
        </div>
      ` : ""}
      <div class="actions-row">
        <button class="btn ghost full" id="cancel">Cancel</button>
      </div>
    `;
  }

  openModal(content(), (modal) => {
    const exWrap = modal.querySelector("#ex-edit");

    function renderEx() {
      exWrap.innerHTML = "";
      wk.exercises.forEach((ex, i) => {
        const el = document.createElement("div");
        el.className = "ex-card";
        el.innerHTML = `
          <div class="ex-header">
            <input type="text" value="${esc(ex.name)}" data-k="name" style="background:var(--bg-elev-2);border:1px solid var(--border);border-radius:8px;padding:8px;flex:1;margin-right:8px" placeholder="Exercise name" />
            <button class="remove" style="background:transparent;border:none;color:var(--fg-dim);font-size:22px">×</button>
          </div>
          <div class="set-grid" style="grid-template-columns:1fr 1fr 1fr">
            <div>
              <label style="font-size:11px;color:var(--fg-dim);display:block;text-align:center;margin-bottom:2px">Sets</label>
              <input type="number" inputmode="numeric" value="${ex.sets}" data-k="sets" />
            </div>
            <div>
              <label style="font-size:11px;color:var(--fg-dim);display:block;text-align:center;margin-bottom:2px">Reps</label>
              <input type="number" inputmode="numeric" value="${ex.reps}" data-k="reps" />
            </div>
            <div>
              <label style="font-size:11px;color:var(--fg-dim);display:block;text-align:center;margin-bottom:2px">Weight (${esc(state.unit)})</label>
              <input type="number" inputmode="decimal" step="0.5" value="${ex.weight}" data-k="weight" />
            </div>
          </div>
        `;
        el.querySelectorAll("input").forEach((inp) => {
          inp.addEventListener("change", (e) => {
            const k = e.target.dataset.k;
            const v = k === "name" ? e.target.value : Number(e.target.value);
            ex[k] = v;
          });
        });
        el.querySelector(".remove").addEventListener("click", () => {
          wk.exercises.splice(i, 1);
          renderEx();
        });
        exWrap.appendChild(el);
      });
    }
    renderEx();

    modal.querySelector("#add-ex").addEventListener("click", () => {
      wk.exercises.push({ name: "", sets: 3, reps: 10, weight: 20 });
      renderEx();
    });

    modal.querySelector("#save").addEventListener("click", () => {
      wk.name = modal.querySelector("#f-name").value.trim() || "Untitled";
      wk.category = modal.querySelector("#f-cat").value.trim();
      wk.note = modal.querySelector("#f-note").value.trim();
      wk.exercises = wk.exercises.filter((e) => e.name.trim() !== "");
      if (isNew) {
        state.workouts.push(wk);
      } else {
        const idx = state.workouts.findIndex((w) => w.id === wk.id);
        if (idx >= 0) state.workouts[idx] = wk;
      }
      saveState();
      closeModal();
      render();
    });

    if (!isNew) {
      modal.querySelector("#delete").addEventListener("click", () => {
        if (!confirm("Delete this workout?")) return;
        state.workouts = state.workouts.filter((w) => w.id !== wk.id);
        saveState();
        closeModal();
        render();
      });
    }

    modal.querySelector("#cancel").addEventListener("click", () => {
      closeModal();
    });
  });
}

// ---------- History view ----------
function renderHistory() {
  titleEl.textContent = "History";

  if (state.history.length === 0) {
    root.innerHTML = `<div class="empty">No workouts logged yet. Start one from the Today tab.</div>`;
    return;
  }

  const sessions = [...state.history].reverse();
  root.innerHTML = `<div id="hist-list"></div>`;
  const list = root.querySelector("#hist-list");

  sessions.forEach((s) => {
    const vol = Math.round(totalVolume(s));
    const sets = totalSetsDone(s);
    const el = document.createElement("div");
    el.className = "list-item";
    el.innerHTML = `
      <div style="flex:1;min-width:0">
        <div class="title">${esc(s.name)}</div>
        <div class="sub">${fmtDateTime(s.startedAt)} · ${sets} sets · ${vol} ${esc(state.unit)}</div>
      </div>
      <span class="tag">${s.exercises.length} ex</span>
    `;
    el.addEventListener("click", () => openSessionDetail(s.id));
    list.appendChild(el);
  });
}

function openSessionDetail(sessId) {
  const s = state.history.find((x) => x.id === sessId);
  if (!s) return;

  const body = `
    <div class="grabber"></div>
    <h2>${esc(s.name)}</h2>
    <div class="muted" style="margin-bottom:8px">${fmtDateTime(s.startedAt)}</div>
    <div class="stat-row">
      <div class="stat"><div class="n">${totalSetsDone(s)}</div><div class="l">Sets</div></div>
      <div class="stat"><div class="n">${Math.round(totalVolume(s))}</div><div class="l">Volume (${esc(state.unit)})</div></div>
      <div class="stat"><div class="n">${s.exercises.length}</div><div class="l">Exercises</div></div>
    </div>
    ${s.exercises.map((ex) => `
      <div class="ex-card">
        <div class="ex-header">
          <div class="name">${esc(ex.name)}</div>
        </div>
        <div class="set-header" style="grid-template-columns:28px 1fr 1fr 48px">
          <span>#</span><span>${esc(state.unit)}</span><span>Reps</span><span>✓</span>
        </div>
        ${ex.sets.map((st, i) => `
          <div class="set-grid" style="grid-template-columns:28px 1fr 1fr 48px">
            <div class="idx">${i + 1}</div>
            <div style="text-align:center;padding:10px 0">${st.weight ?? "—"}</div>
            <div style="text-align:center;padding:10px 0">${st.reps ?? "—"}</div>
            <div style="text-align:center;padding:10px 0">${st.done ? "✓" : "·"}</div>
          </div>
        `).join("")}
      </div>
    `).join("")}
    <div class="actions-row">
      <button class="btn danger full" id="del-sess">Delete this session</button>
    </div>
    <div class="actions-row">
      <button class="btn ghost full" id="close-sess">Close</button>
    </div>
  `;

  openModal(body, (modal) => {
    modal.querySelector("#del-sess").addEventListener("click", () => {
      if (!confirm("Delete this session from your history?")) return;
      state.history = state.history.filter((x) => x.id !== sessId);
      saveState();
      closeModal();
      render();
    });
    modal.querySelector("#close-sess").addEventListener("click", closeModal);
  });
}

// ---------- Settings ----------
function renderSettings() {
  titleEl.textContent = "Settings";

  root.innerHTML = `
    <div class="card">
      <h2>Units</h2>
      <div class="muted" style="margin-bottom:10px">Choose how weights are displayed.</div>
      <div class="seg" id="unit-seg">
        <button data-unit="kg" class="${state.unit === "kg" ? "active" : ""}">Kilograms</button>
        <button data-unit="lb" class="${state.unit === "lb" ? "active" : ""}">Pounds</button>
      </div>
    </div>

    <div class="card">
      <h2>Data</h2>
      <div class="muted" style="margin-bottom:10px">Your data is stored on this device only.</div>
      <div class="actions-row">
        <button class="btn secondary" id="export">Export JSON</button>
        <button class="btn secondary" id="import">Import JSON</button>
      </div>
      <div class="actions-row">
        <button class="btn secondary full" id="restore">Restore default workouts</button>
      </div>
      <div class="actions-row">
        <button class="btn danger full" id="wipe">Erase all data</button>
      </div>
    </div>

    <div class="card">
      <h2>About</h2>
      <div class="muted">Lift Log — a tiny local-first workout tracker.</div>
      <div class="muted" style="margin-top:6px">Sessions: ${state.history.length} · Workouts: ${state.workouts.length}</div>
    </div>
  `;

  root.querySelectorAll("#unit-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      state.unit = b.dataset.unit;
      saveState();
      render();
    });
  });

  root.querySelector("#export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liftlog-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  root.querySelector("#import").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const txt = await file.text();
        const imported = JSON.parse(txt);
        if (!imported || typeof imported !== "object") throw new Error("bad");
        if (!confirm("Replace current data with imported data?")) return;
        state = imported;
        if (!Array.isArray(state.workouts)) state.workouts = [];
        if (!Array.isArray(state.history)) state.history = [];
        saveState();
        render();
      } catch {
        alert("Couldn't import: invalid file.");
      }
    });
    input.click();
  });

  root.querySelector("#restore").addEventListener("click", () => {
    if (!confirm("Restore the default workout templates? Your custom ones will be kept.")) return;
    const existingIds = new Set(state.workouts.map((w) => w.id));
    DEFAULT_WORKOUTS.forEach((w) => {
      if (!existingIds.has(w.id)) state.workouts.push(deepClone(w));
    });
    saveState();
    render();
  });

  root.querySelector("#wipe").addEventListener("click", () => {
    if (!confirm("This will erase ALL workouts and history. Continue?")) return;
    if (!confirm("Really erase everything?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = initialState();
    saveState();
    render();
  });
}

// ---------- Modal helpers ----------
const modalRoot = document.getElementById("modal-root");

function openModal(html, onMount) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal" role="dialog" aria-modal="true">${html}</div>
  `;
  modalRoot.style.pointerEvents = "auto";
  modalRoot.querySelector(".modal-backdrop").addEventListener("click", closeModal);
  if (onMount) onMount(modalRoot.querySelector(".modal"));
}

function closeModal() {
  modalRoot.innerHTML = "";
  modalRoot.style.pointerEvents = "none";
}

// ---------- Service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

// ---------- Kickoff ----------
render();
