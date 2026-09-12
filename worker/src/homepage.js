// Token Monitor Hub homepage — server-rendered shell, data loads client-side
// from this Worker's own JSON API (same origin). Styling: DaisyUI, icons: Lucide.

export function homepageHtml() {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Token Monitor Hub</title>
<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
<style>
  :root { --neon: #22d3ee; --neon2: #e879f9; }
  body { font-family: 'Space Grotesk', system-ui, sans-serif; }
  .num, .stat-value, td.num, code { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
  body::before {
    content: ''; position: fixed; inset: 0; z-index: -1;
    background:
      radial-gradient(600px 300px at 15% -5%, rgba(34,211,238,.12), transparent 60%),
      radial-gradient(700px 350px at 85% 0%, rgba(232,121,249,.10), transparent 60%),
      radial-gradient(500px 500px at 50% 110%, rgba(34,211,238,.07), transparent 60%),
      #05070d;
  }
  body::after {
    content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none; opacity: .5;
    background-image: linear-gradient(rgba(148,163,184,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148,163,184,.05) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%);
  }
  .navbar { background: rgba(10,14,24,.75); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(148,163,184,.12); }
  .logo-grad { background: linear-gradient(90deg, var(--neon), var(--neon2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .card { background: rgba(15,23,42,.66); backdrop-filter: blur(14px); border: 1px solid rgba(148,163,184,.12); border-radius: 1rem; box-shadow: 0 8px 32px rgba(0,0,0,.45); transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
  .card:hover { transform: translateY(-2px); border-color: rgba(34,211,238,.35); box-shadow: 0 12px 40px rgba(0,0,0,.55), 0 0 24px rgba(34,211,238,.08); }
  .card-title { letter-spacing: .02em; }
  .stat-value, .card .text-3xl { text-shadow: 0 0 24px rgba(34,211,238,.25); }
  .badge-success { box-shadow: 0 0 12px rgba(74,222,128,.5); }
  .progress { height: .55rem; }
  .progress-primary { --tw-progress: var(--neon); }
  .progress::-webkit-progress-value { box-shadow: 0 0 10px rgba(34,211,238,.6); }
  .join .btn-active { background: linear-gradient(90deg, rgba(34,211,238,.25), rgba(232,121,249,.25)); border-color: rgba(34,211,238,.5); }
  .table th { text-transform: uppercase; font-size: .65rem; letter-spacing: .08em; opacity: .55; }
  .table tbody tr { border-color: rgba(148,163,184,.08); }
  .table tbody tr:hover { background: rgba(34,211,238,.05); }
  #spark polyline { stroke: var(--neon); filter: drop-shadow(0 0 6px rgba(34,211,238,.7)); fill: none; stroke-width: 2; }
  #heatTip { position: fixed; z-index: 50; pointer-events: none; max-width: 230px; }
  .hcell { cursor: default; border: 1px solid transparent; border-radius: 3px; }
  .hcell:hover { border-color: #fff; transform: scale(1.3); box-shadow: 0 0 10px rgba(57,211,83,.8); }
  ::-webkit-scrollbar { height: 8px; width: 8px; }
  ::-webkit-scrollbar-thumb { background: rgba(34,211,238,.3); border-radius: 4px; }
</style>
</head>
<body class="min-h-screen">
<div class="navbar shadow-sm sticky top-0 z-10">
  <div class="flex-1">
    <span class="btn btn-ghost text-xl gap-2 font-bold"><i data-lucide="terminal" class="w-6 h-6 text-cyan-300"></i><span class="logo-grad">TOKEN&nbsp;MONITOR&nbsp;//&nbsp;HUB</span></span>
  </div>
  <div class="flex-none gap-2 items-center">
    <span id="syncAge" class="text-xs opacity-60 num hidden sm:inline">—</span>
    <span id="liveBadge" class="badge badge-ghost gap-1"><i data-lucide="circle" class="w-3 h-3"></i><span>offline</span></span>
    <a class="btn btn-ghost btn-square" href="/api/health" target="_blank" title="Health JSON"><i data-lucide="heart-pulse" class="w-5 h-5"></i></a>
    <button id="themeBtn" class="btn btn-ghost btn-square" title="Toggle theme"><i data-lucide="sun-medium" class="w-5 h-5"></i></button>
  </div>
</div>

<main class="max-w-5xl mx-auto p-4 flex flex-col gap-4">
  <div id="err" class="alert alert-error hidden"><i data-lucide="triangle-alert" class="w-5 h-5"></i><span id="errMsg"></span></div>
  <div id="staleBanner" class="alert hidden"><i data-lucide="cloud-off" class="w-5 h-5"></i><span id="staleMsg"></span></div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card bg-base-100 shadow"><div class="card-body">
      <h2 class="card-title text-sm opacity-70 gap-2"><i data-lucide="zap" class="w-4 h-4"></i>Today</h2>
      <p id="tTokens" class="text-3xl font-bold num">—</p>
      <p id="tCost" class="opacity-70 num">—</p>
    </div></div>
    <div class="card bg-base-100 shadow"><div class="card-body">
      <h2 class="card-title text-sm opacity-70 gap-2"><i data-lucide="calendar-range" class="w-4 h-4"></i>This week</h2>
      <p id="wTokens" class="text-3xl font-bold num">—</p>
      <p id="wCost" class="opacity-70 num">—</p>
    </div></div>
    <div class="card bg-base-100 shadow"><div class="card-body">
      <h2 class="card-title text-sm opacity-70 gap-2"><i data-lucide="calendar-days" class="w-4 h-4"></i>Month</h2>
      <p id="mTokens" class="text-3xl font-bold num">—</p>
      <p id="mCost" class="opacity-70 num">—</p>
    </div></div>
    <div class="card bg-base-100 shadow"><div class="card-body">
      <h2 class="card-title text-sm opacity-70 gap-2"><i data-lucide="infinity" class="w-4 h-4"></i>All time</h2>
      <p id="aTokens" class="text-3xl font-bold num">—</p>
      <p id="aCost" class="opacity-70 num">—</p>
    </div></div>
  </div>

  <div class="card bg-base-100 shadow"><div class="card-body">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <h2 class="card-title gap-2"><i data-lucide="wrench" class="w-5 h-5"></i>By tool</h2>
      <div class="join" id="periodSeg">
        <button data-p="today" class="join-item btn btn-sm">Today</button>
        <button data-p="week" class="join-item btn btn-sm">Week</button>
        <button data-p="month" class="join-item btn btn-sm btn-active">Month</button>
        <button data-p="allTime" class="join-item btn btn-sm">All time</button>
      </div>
    </div>
    <div id="clients" class="flex flex-col gap-2"></div>
  </div></div>

  <div class="card bg-base-100 shadow"><div class="card-body">
    <h2 class="card-title gap-2"><i data-lucide="boxes" class="w-5 h-5"></i>Models <span id="modelPeriod" class="text-sm font-normal opacity-60">(month)</span></h2>
    <div class="overflow-x-auto"><table class="table table-sm">
      <thead><tr><th>Model</th><th class="text-right">Tokens</th><th class="text-right">Cost</th><th class="w-40">Share</th></tr></thead>
      <tbody id="models"></tbody>
    </table></div>
  </div></div>

  <div class="card bg-base-100 shadow"><div class="card-body">
    <h2 class="card-title gap-2"><i data-lucide="blend" class="w-5 h-5"></i>Token mix <span id="mixPeriod" class="text-sm font-normal opacity-60">(month)</span></h2>
    <div id="mixBar" class="flex h-4 rounded-lg overflow-hidden bg-base-300"></div>
    <div id="mixLegend" class="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2"></div>
    <div id="perfLine" class="text-xs opacity-60 mt-1"></div>
  </div></div>

  <div class="card bg-base-100 shadow"><div class="card-body">
    <h2 class="card-title gap-2"><i data-lucide="flame" class="w-5 h-5"></i>Activity</h2>
    <div id="streaks" class="flex flex-wrap gap-2"></div>
  </div></div>

  <div id="projectsCard" class="card bg-base-100 shadow hidden"><div class="card-body">
    <h2 class="card-title gap-2"><i data-lucide="folder-git-2" class="w-5 h-5"></i>Top projects <span id="projPeriod" class="text-sm font-normal opacity-60">(month)</span></h2>
    <div class="overflow-x-auto"><table class="table table-sm">
      <thead><tr><th>Project</th><th class="text-right">Tokens</th><th class="text-right">Cost</th></tr></thead>
      <tbody id="projects"></tbody>
    </table></div>
  </div></div>

  <div id="sessionsCard" class="card bg-base-100 shadow hidden"><div class="card-body">
    <h2 class="card-title gap-2"><i data-lucide="messages-square" class="w-5 h-5"></i>Top sessions <span id="sessPeriod" class="text-sm font-normal opacity-60">(month)</span></h2>
    <div class="overflow-x-auto"><table class="table table-sm">
      <thead><tr><th>Session</th><th>Client</th><th>Date</th><th class="text-right">Tokens</th><th class="text-right">Cost</th></tr></thead>
      <tbody id="sessions"></tbody>
    </table></div>
  </div></div>

  <div class="card bg-base-100 shadow"><div class="card-body">
    <h2 class="card-title gap-2"><i data-lucide="chart-line" class="w-5 h-5"></i>Daily tokens <span class="text-sm font-normal opacity-60">(30d)</span></h2>
    <svg id="spark" viewBox="0 0 300 80" class="w-full h-20 text-primary" preserveAspectRatio="none"></svg>
  </div></div>

  <div class="card bg-base-100 shadow"><div class="card-body">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <h2 class="card-title gap-2"><i data-lucide="layout-grid" class="w-5 h-5"></i>Contribution graph</h2>
      <div class="flex items-center gap-1 text-xs opacity-70">Less
        <span class="flex gap-1"><span class="w-3 h-3 rounded-sm bg-base-300 inline-block"></span><span class="w-3 h-3 rounded-sm inline-block" style="background:#0e4429"></span><span class="w-3 h-3 rounded-sm inline-block" style="background:#006d32"></span><span class="w-3 h-3 rounded-sm inline-block" style="background:#26a641"></span><span class="w-3 h-3 rounded-sm inline-block" style="background:#39d353"></span></span>
      More</div>
    </div>
    <div class="overflow-x-auto"><div id="heatmap" class="flex gap-1 py-1"></div></div>
    <p id="heatTotal" class="text-xs opacity-60"></p>
  </div></div>
  </div></div>

  <div class="card bg-base-100 shadow"><div class="card-body">
    <h2 class="card-title gap-2"><i data-lucide="calendar-range" class="w-5 h-5"></i>Week wise <span class="text-sm font-normal opacity-60">(Mon–Sun)</span></h2>
    <div id="weeks" class="flex flex-col gap-2"></div>
  </div></div>

  <div class="card bg-base-100 shadow"><div class="card-body">
    <h2 class="card-title gap-2"><i data-lucide="monitor-smartphone" class="w-5 h-5"></i>Devices <span id="devCount" class="badge"></span></h2>
    <div class="overflow-x-auto"><table class="table table-sm">
      <thead><tr><th>Device</th><th>Platform</th><th>Seen</th><th class="text-right">Today</th><th>Status</th></tr></thead>
      <tbody id="devices"></tbody>
    </table></div>
  </div></div>

  <div class="card bg-base-100 shadow"><div class="card-body">
    <h2 class="card-title gap-2"><i data-lucide="gauge" class="w-5 h-5"></i>Limits</h2>
    <div id="limits" class="flex flex-col gap-3"></div>
  </div></div>

  <p class="text-center text-xs opacity-50 pb-6">Token Monitor Hub · data refreshes live over SSE · secret never leaves this browser except to this hub</p>
</main>
<div id="heatTip" class="card bg-base-100 shadow-2xl border border-cyan-400/40 px-3 py-2 text-xs hidden" style="z-index:100"></div>

<script>
const $ = (id) => document.getElementById(id);
// Built-in hub secret: the page connects without asking. Anyone who opens
// this URL can view-source and read it — treat it as public to visitors.
const BUILTIN_SECRET = 'uD_3fv9IfdDhbn-iWv5waP2-tDfHVHXz';
const store = { get: () => localStorage.getItem('tm-secret') || BUILTIN_SECRET, set: (v) => localStorage.setItem('tm-secret', v) };
let es = null, pollTimer = null;

function fmtTokens(n) {
  n = Number(n) || 0;
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n));
}
function fmtCost(n) {
  n = Number(n) || 0;
  return '$' + (n >= 10 ? n.toFixed(2) : n.toFixed(4));
}
function ago(iso) {
  const ms = Date.now() - Date.parse(iso || '');
  if (!Number.isFinite(ms)) return '—';
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function icons() { if (window.lucide) lucide.createIcons(); }

function showError(msg) {
  $('errMsg').textContent = msg;
  $('err').classList.remove('hidden');
  setLive(false);
  icons();
}
function clearError() { $('err').classList.add('hidden'); }
function setLive(on) {
  const b = $('liveBadge');
  b.className = 'badge gap-1 ' + (on ? 'badge-success' : 'badge-ghost');
  b.querySelector('span').textContent = on ? 'live' : 'offline';
}

let period = 'month';
let lastStats = null;
let lastSyncAt = 0;
let sparkDays = [];
const PERIOD_LABEL = { today: 'today', week: 'this week', month: 'month', allTime: 'all time' };

function weekRollup() {
  const out = { clients: {}, clientCosts: {}, models: {}, modelCosts: {}, projects: {}, sessions: {},
    cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0, unclassifiedTokens: 0 };
  const mon = mondayOf(new Date());
  for (let i = 0; i < 7; i++) {
    const rec = heatDays.get(dayKey(new Date(mon.getTime() + i * 86400000)));
    if (!rec) continue;
    for (const [c, v] of Object.entries(rec.perClient || {})) {
      out.clients[c] = (out.clients[c] || 0) + (Number(v.tokens) || 0);
      out.clientCosts[c] = (out.clientCosts[c] || 0) + (Number(v.cost) || 0);
    }
    for (const [mname, v] of Object.entries(rec.perModel || {})) {
      out.models[mname] = (out.models[mname] || 0) + (Number(v.tokens) || 0);
      out.modelCosts[mname] = (out.modelCosts[mname] || 0) + (Number(v.cost) || 0);
    }
    out.cacheReadTokens += Number(rec.cacheReadTokens) || 0;
    out.cacheWriteTokens += Number(rec.cacheWriteTokens) || 0;
    out.outputTokens += Number(rec.outputTokens) || 0;
    out.unclassifiedTokens += Number(rec.unclassifiedTokens) || 0;
  }
  return out;
}

function renderPeriodBlocks() {
  if (!lastStats) return;
  const p = period === 'week' ? weekRollup() : (lastStats.periods || {})[period] || {};
  $('modelPeriod').textContent = '(' + (PERIOD_LABEL[period] || period) + ')';
  $('mixPeriod').textContent = '(' + (PERIOD_LABEL[period] || period) + ')';
  $('projPeriod').textContent = '(' + (PERIOD_LABEL[period] || period) + ')';
  $('sessPeriod').textContent = '(' + (PERIOD_LABEL[period] || period) + ')';

  const clients = p.clients || {};
  const costs = p.clientCosts || {};
  const max = Math.max(1, ...Object.values(clients).map(Number));
  const names = Object.keys(clients).sort((x, y) => clients[y] - clients[x]);
  $('clients').innerHTML = names.length ? names.map((c) =>
    '<div><div class="flex justify-between text-sm mb-1"><span class="flex items-center gap-2"><i data-lucide="bot" class="w-4 h-4 opacity-60"></i>' + esc(c) +
    '</span><span class="num">' + esc(fmtTokens(clients[c])) + ' · ' + esc(fmtCost(costs[c])) +
    '</span></div><progress class="progress progress-primary w-full" value="' + Number(clients[c]) + '" max="' + max + '"></progress></div>'
  ).join('') : '<p class="opacity-60 text-sm">No usage yet.</p>';

  const models = p.models || {};
  const mcosts = p.modelCosts || {};
  const mtotal = Math.max(1, Object.values(models).reduce((s, v) => s + Number(v), 0));
  const mrows = Object.keys(models).sort((x, y) => models[y] - models[x]).slice(0, 15);
  $('models').innerHTML = mrows.length ? mrows.map((mname) => {
    const pct = (Number(models[mname]) / mtotal * 100).toFixed(1);
    return '<tr><td class="font-mono text-xs break-all">' + esc(mname) + '</td>' +
      '<td class="text-right num">' + esc(fmtTokens(models[mname])) + '</td>' +
      '<td class="text-right num">' + esc(fmtCost(mcosts[mname])) + '</td>' +
      '<td><div class="flex items-center gap-2"><progress class="progress progress-primary flex-1" value="' + pct + '" max="100"></progress><span class="text-xs num w-12 text-right">' + pct + '%</span></div></td></tr>';
  }).join('') : '<tr><td colspan="4" class="opacity-60">No models.</td></tr>';

  const mix = [
    ['Cache read', Number(p.cacheReadTokens) || 0, '#26a641'],
    ['Cache write', Number(p.cacheWriteTokens) || 0, '#0e4429'],
    ['Output', Number(p.outputTokens) || 0, '#8839ef'],
    ['Unclassified', Number(p.unclassifiedTokens) || 0, '#9aa4b2']
  ];
  const msum = Math.max(1, mix.reduce((s, m) => s + m[1], 0));
  $('mixBar').innerHTML = mix.filter((m) => m[1] > 0).map((m) =>
    '<div style="width:' + (m[1] / msum * 100).toFixed(2) + '%;background:' + m[2] + '" title="' + esc(m[0] + ': ' + fmtTokens(m[1])) + '"></div>'
  ).join('');
  $('mixLegend').innerHTML = mix.map((m) =>
    '<span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm inline-block" style="background:' + m[2] + '"></span>' + esc(m[0]) + ' <b class="num">' + esc(fmtTokens(m[1])) + '</b></span>'
  ).join('');
  $('perfLine').textContent = p.timedTokens
    ? 'Measured throughput: ' + fmtTokens(p.timedTokens) + ' tokens in ' + (Number(p.timedDurationMs) / 1000).toFixed(0) + 's'
    : '';

  const projs = p.projects || {};
  const prows = Object.keys(projs).sort((x, y) => (projs[y].tokens || projs[y].totalTokens || 0) - (projs[x].tokens || projs[x].totalTokens || 0)).slice(0, 10);
  $('projectsCard').classList.toggle('hidden', !prows.length);
  $('projects').innerHTML = prows.map((k) => {
    const pr = projs[k] || {};
    return '<tr><td class="font-medium break-all">' + esc(pr.label || pr.projectLabel || k) + '</td>' +
      '<td class="text-right num">' + esc(fmtTokens(pr.tokens || pr.totalTokens)) + '</td>' +
      '<td class="text-right num">' + esc(fmtCost(pr.costUsd || pr.cost)) + '</td></tr>';
  }).join('');

  const sess = p.sessions || {};
  const srows = Object.keys(sess).map((k) => ({ k, s: sess[k] }))
    .sort((a, b) => (b.s.totalTokens || 0) - (a.s.totalTokens || 0)).slice(0, 10);
  $('sessionsCard').classList.toggle('hidden', !srows.length);
  $('sessions').innerHTML = srows.map(({ k, s }) =>
    '<tr><td class="break-all"><span class="font-medium">' + esc(s.title || s.sessionId || k) + '</span></td>' +
    '<td class="text-xs">' + esc(s.client || '') + '</td>' +
    '<td class="text-xs whitespace-nowrap">' + esc(fmtDate(s.lastUsedAt || s.startedAt)) + '</td>' +
    '<td class="text-right num">' + esc(fmtTokens(s.totalTokens)) + '</td>' +
    '<td class="text-right num">' + esc(fmtCost(s.costUsd)) + '</td></tr>'
  ).join('');
  icons();
}

function renderActivity(stats) {
  const sum = (stats.historyPreview && stats.historyPreview.summary) || {};
  const chips = [
    ['flame', 'Current streak', (sum.currentStreak || 0) + 'd'],
    ['trophy', 'Longest', (sum.longestStreak || 0) + 'd'],
    ['calendar-check', 'Active days', fmtTokens(sum.activeDays || 0)],
    ['arrow-up-right', 'Peak day', fmtTokens(sum.peakDayTokens || 0)],
    ['star', 'Top model', sum.favoriteModel || '—'],
    ['message-square-text', 'Messages', fmtTokens(sum.messages || 0)]
  ];
  $('streaks').innerHTML = chips.map(([ic, label, val]) =>
    '<div class="stat bg-base-200 rounded-box px-4 py-2"><div class="stat-title flex items-center gap-1 text-xs"><i data-lucide="' + ic + '" class="w-3 h-3"></i>' + esc(label) +
    '</div><div class="stat-value text-lg num break-all">' + esc(String(val)) + '</div></div>'
  ).join('');
}

function render(stats) {
  clearError();
  setLive(true);
  lastStats = stats;
  lastSyncAt = Date.now();
  const staleDevs = (stats.devices || []).filter((d) => d.stale);
  if (staleDevs.length) {
    $('staleMsg').textContent = staleDevs.length + ' device(s) stale: ' + staleDevs.map((d) => d.deviceId).join(', ') + ' — no ingest for 10+ min.';
    $('staleBanner').classList.remove('hidden');
  } else {
    $('staleBanner').classList.add('hidden');
  }
  const p = stats.periods || {};
  const t = p.today || {}, m = p.month || {}, a = p.allTime || {};
  $('tTokens').textContent = fmtTokens(t.totalTokens);
  $('tCost').textContent = fmtCost(t.costUsd);
  $('mTokens').textContent = fmtTokens(m.totalTokens);
  $('mCost').textContent = fmtCost(m.costUsd);
  $('aTokens').textContent = fmtTokens(a.totalTokens);
  $('aCost').textContent = fmtCost(a.costUsd);

  renderPeriodBlocks();
  renderActivity(stats);

  const daily = (stats.historyPreview && stats.historyPreview.daily) || [];
  sparkDays = daily;
  const pts = daily.map((d) => Number(d.tokens) || 0);
  const peak = Math.max(1, ...pts);
  $('spark').innerHTML = pts.length > 1
    ? '<polyline points="' + pts.map((v, i) => (i / (pts.length - 1) * 300).toFixed(1) + ',' + (78 - v / peak * 76).toFixed(1)).join(' ') + '" />'
    : '<text x="10" y="40" class="opacity-60" font-size="10">no history yet</text>';

  const devs = stats.devices || [];
  $('devCount').textContent = devs.length;
  $('devices').innerHTML = devs.map((d) =>
    '<tr><td class="font-medium">' + esc(d.deviceId) + '<div class="text-xs opacity-60">' + esc(d.hostname || '') + '</div></td>' +
    '<td class="text-xs">' + esc(d.platform || '') + '</td>' +
    '<td class="text-xs">' + esc(ago(d.receivedAt)) + '</td>' +
    '<td class="text-right num">' + esc(fmtTokens(d.periods && d.periods.today && d.periods.today.totalTokens)) + '</td>' +
    '<td>' + (d.stale ? '<span class="badge badge-warning badge-sm">stale</span>' : '<span class="badge badge-success badge-sm">live</span>') + '</td></tr>'
  ).join('') || '<tr><td colspan="5" class="opacity-60">No devices.</td></tr>';

  const provs = (stats.limits && stats.limits.providers) || [];  $('limits').innerHTML = provs.length ? provs.map((pr) =>
    '<div><div class="flex justify-between text-sm mb-1"><span class="font-medium">' + esc(pr.provider) + '</span>' +
    '<span class="opacity-60 text-xs">' + esc(pr.status || '') + (pr.stale ? ' · stale' : '') + '</span></div>' +
    (pr.windows || []).map((w) => {
      const used = Math.round(Math.max(0, Math.min(100, Number(w.usedPercent) || 0)) * 10) / 10;
      const left = Math.round((100 - used) * 10) / 10;
      const resetMs = Date.parse(w.resetsAt || '');
      const reset = Number.isFinite(resetMs) ? ' · resets ' + shortDate(new Date(resetMs)) : '';
      return '<div class="flex items-center gap-2 text-xs"><span class="w-28 opacity-60">' + esc(w.label || w.kind || '') + '</span>' +
      '<progress class="progress progress-accent flex-1" value="' + used + '" max="100"></progress>' +
      '<span class="num whitespace-nowrap">' + used + '% used · ' + left + '% left' + esc(reset) + '</span></div>';
    }).join('') + '</div>'
  ).join('') : '<p class="opacity-60 text-sm">No limits reported.</p>';
  icons();
}

const HEAT_BG = ['', '#0e4429', '#006d32', '#26a641', '#39d353'];

function mondayOf(date) {
  const d = new Date(date);
  const dow = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dow);
  return d;
}
function dayKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function shortDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
const DATE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
  const ms = Date.parse(iso || '');
  if (!Number.isFinite(ms)) return '—';
  const d = new Date(ms);
  return String(d.getDate()).padStart(2, '0') + ' ' + DATE_MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}
function fmtDuration(ms) {
  ms = Number(ms) || 0;
  const m = Math.floor(ms / 60000);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  return h + 'h ' + (m % 60) + 'm';
}

let heatDays = new Map();
function heatTipShow(e) {
  const cell = e.target.closest ? e.target.closest('.hcell') : null;
  const tip = $('heatTip');
  if (!cell || !heatDays.has(cell.dataset.date)) { tip.classList.add('hidden'); return; }
  const d = cell.dataset.date;
  const rec = heatDays.get(d) || {};
  const clients = Object.keys(rec.perClient || {}).slice(0, 3).join(', ');
  tip.innerHTML = '<b>' + esc(d) + '</b><br><span class="num">' + esc(fmtTokens(rec.tokens)) + ' tokens · ' + esc(fmtCost(rec.cost)) + '</span><br>' +
    '<span class="opacity-70">' + esc(fmtDuration(rec.activeTimeMs)) + ' active' +
    (rec.messages ? ' · ' + esc(fmtTokens(rec.messages)) + ' msgs' : '') +
    (clients ? ' · ' + esc(clients) : '') + '</span>';
  tip.classList.remove('hidden');
  const pad = 12;
  tip.style.left = Math.min(window.innerWidth - 190, e.clientX + pad) + 'px';
  tip.style.top = (e.clientY + pad) + 'px';
}
function heatTipHide() { $('heatTip').classList.add('hidden'); }

function sparkHover(e) {
  const tip = $('heatTip');
  if (!sparkDays.length) { tip.classList.add('hidden'); return; }
  const r = $('spark').getBoundingClientRect();
  const i = Math.max(0, Math.min(sparkDays.length - 1, Math.round((e.clientX - r.left) / Math.max(1, r.width) * (sparkDays.length - 1))));
  const d = sparkDays[i] || {};
  tip.innerHTML = '<b>' + esc(String(d.date || '').slice(0, 10)) + '</b><br><span class="num">' +
    esc(fmtTokens(d.tokens)) + ' tokens · ' + esc(fmtCost(d.cost)) + '</span>';
  tip.classList.remove('hidden');
  tip.style.left = Math.min(window.innerWidth - 190, e.clientX + 12) + 'px';
  tip.style.top = (e.clientY + 12) + 'px';
}

function renderHistory(hist) {
  const daily = ((hist && hist.daily) || []).filter((d) => d && d.date);
  if (!daily.length) {
    $('heatmap').innerHTML = '<p class="opacity-60 text-sm">No history yet.</p>';
    $('heatTotal').textContent = '';
    $('weeks').innerHTML = '<p class="opacity-60 text-sm">No history yet.</p>';
    icons();
    return;
  }
  const byDay = new Map(daily.map((d) => [String(d.date).slice(0, 10), d]));
  heatDays = byDay;
  const mon = mondayOf(new Date());
  let wt = 0, wc = 0;
  for (let i = 0; i < 7; i++) {
    const rec = byDay.get(dayKey(new Date(mon.getTime() + i * 86400000)));
    if (rec) { wt += Number(rec.tokens) || 0; wc += Number(rec.cost) || 0; }
  }
  $('wTokens').textContent = fmtTokens(wt);
  $('wCost').textContent = fmtCost(wc);
  const today = new Date();
  const startMon = mondayOf(new Date(today.getTime() - 25 * 7 * 86400000));
  const max = Math.max(1, ...daily.map((d) => Number(d.tokens) || 0));
  const lvl = (t) => (t <= 0 ? 0 : t / max >= 0.75 ? 4 : t / max >= 0.5 ? 3 : t / max >= 0.25 ? 2 : 1);

  let cols = '';
  const weeks = [];
  for (let w = 0; w < 26; w++) {
    const mon = new Date(startMon.getTime() + w * 7 * 86400000);
    if (mon > today) break;
    const wk = { mon, tokens: 0, cost: 0 };
    let cells = '';
    for (let i = 0; i < 7; i++) {
      const dt = new Date(mon.getTime() + i * 86400000);
      if (dt > today) { cells += '<span class="w-3 h-3"></span>'; continue; }
      const rec = byDay.get(dayKey(dt));
      const t = rec ? Number(rec.tokens) || 0 : 0;
      const l = rec && rec.tokenIntensity != null ? Number(rec.tokenIntensity) : lvl(t);
      wk.tokens += t;
      wk.cost += rec ? Number(rec.cost) || 0 : 0;
      cells += '<span class="hcell w-3 h-3 rounded-sm ' + (l === 0 ? 'bg-base-300' : '') + '" ' +
        (l === 0 ? '' : 'style="background:' + HEAT_BG[l] + '" ') +
        'data-date="' + esc(dayKey(dt)) + '" title="' + esc(dayKey(dt)) + ': ' + esc(fmtTokens(t)) + '"></span>';
    }
    weeks.push(wk);
    cols += '<div class="flex flex-col gap-1">' + cells + '</div>';
  }
  $('heatmap').innerHTML = cols;
  const total = daily.reduce((s, d) => s + (Number(d.tokens) || 0), 0);
  $('heatTotal').textContent = fmtTokens(total) + ' tokens in the last ' + daily.length + ' days';

  const last = weeks.slice(-12).reverse();
  const wmax = Math.max(1, ...last.map((w) => w.tokens));
  $('weeks').innerHTML = last.map((w) => {
    const sun = new Date(w.mon.getTime() + 6 * 86400000);
    return '<div><div class="flex justify-between text-sm mb-1"><span class="flex items-center gap-2"><i data-lucide="calendar-days" class="w-4 h-4 opacity-60"></i>' +
      esc(shortDate(w.mon)) + ' – ' + esc(shortDate(sun)) +
      '</span><span class="num">' + esc(fmtTokens(w.tokens)) + ' · ' + esc(fmtCost(w.cost)) +
      '</span></div><progress class="progress progress-secondary w-full" value="' + w.tokens + '" max="' + wmax + '"></progress></div>';
  }).join('');
  icons();
}

async function fetchStats(secret) {
  const headers = secret ? { authorization: 'Bearer ' + secret } : {};
  let r = secret ? await fetch('/api/stats', { headers }) : await fetch('/api/public/stats');
  if (!secret && r.status === 404) throw new Error('Enter the hub secret above (public stats are disabled).');
  if (r.status === 401) throw new Error('Wrong secret.');
  if (r.status === 503) throw new Error('Hub has no secret set — run: wrangler secret put TOKEN_MONITOR_SECRET.');
  if (!r.ok) throw new Error('Hub responded ' + r.status + '.');
  return r.json();
}

function connectStream(secret) {
  if (es) { es.close(); es = null; }
  if (!secret || !window.EventSource) return false;
  try {
    es = new EventSource('/api/stats/stream?secret=' + encodeURIComponent(secret));
    es.addEventListener('stats', (e) => { try { render(JSON.parse(e.data).stats); } catch (_) {} });
    es.onerror = () => { if (es) { es.close(); es = null; } startPoll(secret); };
    return true;
  } catch (_) { return false; }
}
function startPoll(secret) {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try { render(await fetchStats(secret)); } catch (e) { showError(e.message); }
  }, 30000);
}

async function connect() {
  const secret = store.get();
  if (es) { es.close(); es = null; }
  if (pollTimer) clearInterval(pollTimer);
  try {
    render(await fetchStats(secret));
    if (secret) {
      try {
        const r = await fetch('/api/history', { headers: { authorization: 'Bearer ' + secret } });
        if (r.ok) renderHistory(await r.json());
      } catch (_) { renderHistory(null); }
    } else {
      renderHistory(null);
    }
    if (!connectStream(secret)) startPoll(secret);
  } catch (e) { showError(e.message); startPoll(secret); }
}

document.querySelectorAll('#periodSeg button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#periodSeg button').forEach((b) => b.classList.remove('btn-active'));
    btn.classList.add('btn-active');
    period = btn.dataset.p;
    renderPeriodBlocks();
  });
});

$('themeBtn').addEventListener('click', () => {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
});
if (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) document.documentElement.dataset.theme = 'light';
$('heatmap').addEventListener('mousemove', heatTipShow);
$('heatmap').addEventListener('mouseleave', heatTipHide);
$('spark').addEventListener('mousemove', sparkHover);
$('spark').addEventListener('mouseleave', heatTipHide);
setInterval(() => {
  $('syncAge').textContent = lastSyncAt ? 'synced ' + ago(new Date(lastSyncAt).toISOString()) : '—';
}, 5000);
connect();
icons();
</script>
</body>
</html>`;
}
