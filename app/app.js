/* Leonida Platinum Desk — tracker logic.
   Loads the official list from data/trophies.json, keeps earned state in
   localStorage, and renders the checklist, roadmap and missables views.
   No network beyond this app's own files; no build step. */

'use strict';

const POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const KINDS = [
  ['all', 'All kinds'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['online', 'Online'],
];

const STAGES = {
  1: ['Chapter 1 — first steps in Leonida', 'The campaign opens on Ocean Beach. Finish Gone Fishing and Chapter 1, and take the cocktail on Ocean Beach before you move on — it is one of the three missables.'],
  2: ['Chapter 2 — the heat rises', 'A short stage on paper: finish Chapter 2 and the story widens. Keep sampling activity types as they appear so Master of None builds quietly in the background.'],
  3: ['Chapter 3 — Vice City opens up', 'Finish Chapter 3. By now the map is opening; start the long collections (cards, meditation spots, WAiNK spots) whenever you pass them rather than saving them for a sweep.'],
  4: ['Chapter 4 — top of the world', 'Finish Chapter 4, the last numbered chapter. The endgame is close: check the Missables view once more before you commit to the finale.'],
  5: ['Campaign missions & the finale', 'The named campaign missions, played in the order the story presents them — the official descriptions do not fix which chapter each belongs to, so they are grouped here. Two of the three missables (the VCIA departure and the showroom escape) belong to this stretch: attempt them when their moments appear, then finish the final mission.'],
  6: ['Strangers & side strands', 'The stranger strands: Andy, Kenton, Billy, Randy, Tyrone and Bret. Each strand is a short chain ending in a final mission with its own trophy, and eight finished strands earn the Strangers & Freaks silver.'],
  7: ['Pastimes, feats & free-roam scores', 'Leonida at play: races, ranges, robberies, challenges and one-off feats. Most are short; the counters (250 stunts, 50 challenges) build fastest if you start them early and dip in often.'],
  8: ['Collections & the long counts', 'The sweeps: cards, spots, vehicles, areas, garages and the money totals. None of it is hard — it is simply long. Work it district by district and let the checklist keep count.'],
  9: ['100% completion & the platinum', 'The endgame. When every other stage is done, the 100% completion gold falls, and with it the platinum itself.'],
};

const DEMO_EARNED = [2, 3, 4, 8, 16, 21, 33, 36, 39, 41, 44, 51, 53];

const store = {
  earnedKey: 'lpd.earned.v1',
  spoilerKey: 'lpd.spoiler.v1',
  loadEarned() {
    try {
      const raw = localStorage.getItem(this.earnedKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr.filter((n) => Number.isInteger(n)) : []);
    } catch { return new Set(); }
  },
  saveEarned(set) {
    try { localStorage.setItem(this.earnedKey, JSON.stringify([...set])); } catch { /* private mode */ }
  },
  loadSpoiler() {
    try { return localStorage.getItem(this.spoilerKey) === '1'; } catch { return false; }
  },
  saveSpoiler(on) {
    try { localStorage.setItem(this.spoilerKey, on ? '1' : '0'); } catch { /* private mode */ }
  },
};

const state = {
  trophies: [],
  byId: new Map(),
  earned: new Set(),
  demo: false,
  view: 'checklist',
  kind: 'all',
  grade: 'all',
  query: '',
  unearnedOnly: false,
  spoiler: false,
  openId: null,
};

const $ = (sel) => document.querySelector(sel);

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isMasked(t) {
  return state.spoiler && t.kind === 'story' && !state.earned.has(t.id);
}

function displayName(t) {
  return isMasked(t) ? 'Hidden trophy — spoiler shield is on' : t.name;
}

function displayDesc(t) {
  return isMasked(t)
    ? 'A story trophy you have not earned yet. Turn the spoiler shield off, or earn it, to reveal what it asks.'
    : t.description;
}

function kindMatches(t) {
  if (state.kind === 'all') return true;
  if (state.kind === 'missable') return t.missable === true;
  return t.kind === state.kind;
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (!kindMatches(t)) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.unearnedOnly && state.earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function medalHtml(grade) {
  return `<span class="medal medal-${grade}" aria-hidden="true"></span>`;
}

function metaHtml(t) {
  const bits = [
    `${medalHtml(t.grade)}<span class="grade-word grade-word-${t.grade}">${t.grade}</span>`,
    `<span>${POINTS[t.grade]} pts</span>`,
    `<span>Stage ${t.stage}</span>`,
    `<span>${esc(t.kind)}</span>`,
  ];
  if (t.target) bits.push(`<span class="flag-target">Target: ${esc(t.target)}</span>`);
  if (t.missable) bits.push('<span class="flag-missable">MISSABLE</span>');
  return bits.join('');
}

/* ---------- stats ---------- */

function renderStats() {
  const total = state.trophies.length;
  const earnedCount = state.earned.size;
  const points = state.trophies.reduce(
    (sum, t) => sum + (state.earned.has(t.id) ? POINTS[t.grade] : 0), 0);
  $('#stat-earned').textContent = String(earnedCount);
  $('#stat-pct').textContent = `${Math.round((earnedCount / total) * 100)}%`;
  $('#stat-bar').style.width = `${(earnedCount / total) * 100}%`;
  $('#stat-bar').parentElement.setAttribute('aria-valuenow', String(earnedCount));
  $('#stat-points').textContent = points.toLocaleString('en-US');
  $('#stat-grades').innerHTML = GRADES.map((g) => {
    const all = state.trophies.filter((t) => t.grade === g).length;
    const got = state.trophies.filter((t) => t.grade === g && state.earned.has(t.id)).length;
    return `<li>${medalHtml(g)} ${g}: ${got}/${all}</li>`;
  }).join('');
  const miss = state.trophies.filter((t) => t.missable && !state.earned.has(t.id)).length;
  $('#missable-count').textContent = miss > 0 ? String(miss) : '';
}

/* ---------- filters ---------- */

function renderKindChips() {
  $('#kind-chips').innerHTML = KINDS.map(([key, label]) => {
    const n = key === 'all'
      ? state.trophies.length
      : state.trophies.filter((t) => (key === 'missable' ? t.missable : t.kind === key)).length;
    const active = state.kind === key ? ' is-active' : '';
    return `<button type="button" class="kind-chip${active}" data-kind="${key}">${label} <span class="chip-n">${n}</span></button>`;
  }).join('');
}

/* ---------- checklist ---------- */

function rowHtml(t) {
  const earned = state.earned.has(t.id);
  const open = state.openId === t.id ? ' is-open' : '';
  return `<li class="trophy-row${earned ? ' is-earned' : ''}${open}" data-open="${t.id}">
    <label class="trophy-check" title="Mark earned">
      <input type="checkbox" data-toggle="${t.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(t.name)} as earned">
    </label>
    <div class="trophy-main">
      <p class="trophy-name${isMasked(t) ? ' spoiler-name' : ''}">${esc(displayName(t))}</p>
      <p class="trophy-desc${isMasked(t) ? ' spoiler-desc' : ''}">${esc(displayDesc(t))}</p>
      <div class="trophy-meta">${metaHtml(t)}</div>
    </div>
    <div class="trophy-side">
      ${earned ? '<span class="earned-tag">Earned ✓</span>' : `<span class="trophy-points">${POINTS[t.grade]} pts</span>`}
    </div>
  </li>`;
}

function renderList() {
  const rows = visibleTrophies();
  $('#trophy-list').innerHTML = rows.map(rowHtml).join('');
  $('#result-count').textContent =
    `Showing ${rows.length} of ${state.trophies.length} trophies · ${state.earned.size} earned`;
  $('#empty-note').hidden = rows.length > 0;
}

/* ---------- guide pane ---------- */

function guideParagraphs(text) {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
  const paras = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paras.push(sentences.slice(i, i + 2).join(' ').trim());
  }
  return paras.filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('');
}

function renderGuide() {
  const t = state.byId.get(state.openId);
  const empty = $('#guide-empty');
  const card = $('#guide-card');
  if (!t) { empty.hidden = false; card.hidden = true; return; }
  empty.hidden = true;
  card.hidden = false;
  const earned = state.earned.has(t.id);
  const warn = t.missable
    ? `<p class="guide-warn"><strong>Missable — plan ahead.</strong> This trophy is tied to a specific
       story moment or place, and the official description does not promise a second chance.
       Read the guide before you play past it.</p>`
    : '';
  card.innerHTML = `
    <p class="kicker">Stage ${t.stage} · ${esc(STAGES[t.stage][0])}</p>
    <h2 class="${isMasked(t) ? 'spoiler-name' : ''}">${esc(displayName(t))}</h2>
    <p class="guide-desc ${isMasked(t) ? 'spoiler-desc' : ''}">“${esc(displayDesc(t))}”</p>
    <div class="guide-facts">${metaHtml(t)}</div>
    ${warn}
    <div class="guide-text">${guideParagraphs(t.guide)}</div>
    <p class="guide-sources">${esc(t.sources)}</p>
    <div class="guide-actions">
      <button type="button" data-toggle="${t.id}" class="${earned ? 'is-earned-btn' : ''}">
        ${earned ? 'Earned ✓ — tap to undo' : 'Mark as earned'}
      </button>
    </div>`;
}

/* ---------- roadmap & missables ---------- */

function stageTrophies(n) {
  return state.trophies.filter((t) => t.stage === n);
}

function renderRoadmap() {
  $('#roadmap-body').innerHTML = Object.keys(STAGES).map((key) => {
    const n = Number(key);
    const list = stageTrophies(n);
    const got = list.filter((t) => state.earned.has(t.id)).length;
    const rows = list.map((t) => {
      const earned = state.earned.has(t.id);
      return `<li class="trophy-row${earned ? ' is-earned' : ''}" data-open="${t.id}">
        <label class="trophy-check"><input type="checkbox" data-toggle="${t.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(t.name)} as earned"></label>
        <div class="trophy-main">
          <p class="trophy-name${isMasked(t) ? ' spoiler-name' : ''}">${esc(displayName(t))}</p>
          <p class="trophy-desc${isMasked(t) ? ' spoiler-desc' : ''}">${esc(displayDesc(t))}</p>
          <div class="trophy-meta">${metaHtml(t)}</div>
        </div>
        <div class="trophy-side">${earned ? '<span class="earned-tag">Earned ✓</span>' : ''}</div>
      </li>`;
    }).join('');
    return `<section class="stage-block">
      <div class="stage-head">
        <span class="stage-num">Stage ${n}</span>
        <h3>${esc(STAGES[n][0])}</h3>
        <span class="stage-progress">${got}/${list.length} earned</span>
      </div>
      <p class="stage-blurb">${esc(STAGES[n][1])}</p>
      <ol class="stage-list">${rows}</ol>
    </section>`;
  }).join('');
}

function renderMissables() {
  const list = state.trophies.filter((t) => t.missable);
  $('#missables-body').innerHTML = list.map((t) => {
    const earned = state.earned.has(t.id);
    return `<article class="missable-card" data-open="${t.id}">
      <h3>${esc(t.name)} ${earned ? '<span class="earned-tag">Earned ✓</span>' : ''}</h3>
      <p class="trophy-desc">“${esc(t.description)}”</p>
      <div class="guide-text">${guideParagraphs(t.guide)}</div>
      <p class="guide-sources">${esc(t.sources)}</p>
    </article>`;
  }).join('');
}

/* ---------- next up ---------- */

function renderNextUp() {
  const list = $('#next-up-list');
  const next = state.trophies
    .filter((t) => !state.earned.has(t.id))
    .sort((a, b) => (a.stage - b.stage) || (a.id - b.id))
    .slice(0, 3);
  if (next.length === 0) {
    list.innerHTML = '<li class="next-up-done">All 55 earned — the platinum is yours. 🏆</li>';
    return;
  }
  list.innerHTML = next.map((t) => `<li>
      ${medalHtml(t.grade)}
      <button type="button" data-open="${t.id}">${esc(displayName(t))}</button>
      <span class="nu-stage">Stage ${t.stage} · ${esc(STAGES[t.stage][0].split('—')[0].trim())}</span>
      ${t.missable ? '<span class="flag-missable">MISSABLE</span>' : ''}
    </li>`).join('');
}

/* ---------- views & events ---------- */

function renderView() {
  for (const v of ['checklist', 'roadmap', 'missables']) {
    $(`#view-${v}`).hidden = state.view !== v;
    $(`#tab-${v}`).classList.toggle('is-active', state.view === v);
  }
  $('#next-up').hidden = state.view !== 'checklist';
  if (state.view === 'roadmap') renderRoadmap();
  if (state.view === 'missables') renderMissables();
}

function renderAll() {
  renderStats();
  renderKindChips();
  renderList();
  renderNextUp();
  renderGuide();
  renderView();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  if (!state.demo) store.saveEarned(state.earned);
  renderAll();
}

function bindEvents() {
  document.addEventListener('click', (ev) => {
    const chip = ev.target.closest('[data-kind]');
    if (chip) { state.kind = chip.dataset.kind; renderKindChips(); renderList(); return; }
    const tab = ev.target.closest('[data-view]');
    if (tab) { state.view = tab.dataset.view; renderView(); return; }
    const toggleBtn = ev.target.closest('button[data-toggle]');
    if (toggleBtn) { toggleEarned(Number(toggleBtn.dataset.toggle)); return; }
    if (ev.target.closest('input[data-toggle]')) return;
    if (ev.target.closest('.trophy-check')) return;
    const opener = ev.target.closest('[data-open]');
    if (opener) {
      state.openId = Number(opener.dataset.open);
      renderList();
      renderGuide();
      if (state.view === 'roadmap') renderRoadmap();
      $('#guide-pane').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
  document.addEventListener('change', (ev) => {
    const box = ev.target.closest('input[data-toggle]');
    if (box) toggleEarned(Number(box.dataset.toggle));
  });
  $('#search').addEventListener('input', (ev) => { state.query = ev.target.value; renderList(); });
  $('#grade-filter').addEventListener('change', (ev) => { state.grade = ev.target.value; renderList(); });
  $('#unearned-only').addEventListener('change', (ev) => { state.unearnedOnly = ev.target.checked; renderList(); });
  $('#spoiler-toggle').addEventListener('change', (ev) => {
    state.spoiler = ev.target.checked;
    store.saveSpoiler(state.spoiler);
    renderAll();
  });
}

/* ---------- export / import / reset ---------- */

function note(msg) {
  const el = $('#save-note');
  el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
}

function bindSaveTools() {
  $('#export-btn').addEventListener('click', () => {
    const payload = {
      app: 'leonida-platinum-desk',
      game: 'Grand Theft Auto VI',
      platform: 'PlayStation 5',
      exportedAt: new Date().toISOString(),
      earned: [...state.earned].sort((a, b) => a - b),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leonida-platinum-desk-progress.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    note(`Exported ${state.earned.size} earned trophies.`);
  });

  $('#import-file').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('no "earned" list in that file');
      const valid = ids.filter((n) => Number.isInteger(n) && state.byId.has(n));
      state.earned = new Set(valid);
      if (!state.demo) store.saveEarned(state.earned);
      renderAll();
      note(`Imported ${valid.length} earned trophies.`);
    } catch (err) {
      note(`Import failed: ${err.message}`);
    }
  });

  $('#reset-btn').addEventListener('click', () => {
    if (!window.confirm('Clear all earned trophies and start over?')) return;
    state.earned = new Set();
    if (!state.demo) store.saveEarned(state.earned);
    renderAll();
    note('Progress reset.');
  });
}

/* ---------- boot ---------- */

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') {
    state.demo = true;
    state.earned = new Set(DEMO_EARNED.filter((id) => state.byId.has(id)));
  }
  const view = params.get('view');
  if (view && ['checklist', 'roadmap', 'missables'].includes(view)) state.view = view;
  const kind = params.get('kind');
  if (kind && KINDS.some(([k]) => k === kind)) state.kind = kind;
  const q = params.get('q');
  if (q) { state.query = q; $('#search').value = q; }
  if (params.get('spoiler') === '1') state.spoiler = true;
  if (params.get('spoiler') === '0') state.spoiler = false;
  $('#spoiler-toggle').checked = state.spoiler;
  const open = Number(params.get('open'));
  if (Number.isInteger(open) && state.byId.has(open)) state.openId = open;
}

async function boot() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  state.trophies = data.trophies.slice().sort((a, b) => a.id - b.id);
  state.byId = new Map(state.trophies.map((t) => [t.id, t]));
  state.earned = store.loadEarned();
  state.spoiler = store.loadSpoiler();
  $('#spoiler-toggle').checked = state.spoiler;
  bindEvents();
  bindSaveTools();
  applyUrlParams();
  renderAll();
}

boot().catch((err) => {
  document.querySelector('#trophy-list').innerHTML =
    `<li class="empty-note">The trophy list could not be loaded (${esc(err.message)}). Serve this folder over HTTP — see serve.ts — rather than opening the file directly.</li>`;
});
