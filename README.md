# Token Monitor Hub

Cloudflare Worker hub for **Token Monitor** usage sync — currently tracking
**opencode** + **antigravity** — with a live DaisyUI/Lucide dashboard on the
homepage.

Live: `https://token-monitor-hub.noobworker.workers.dev`

Stripped from the upstream desktop project to worker + agent-sync only.
Upstream: [Javis603/token-monitor](https://github.com/Javis603/token-monitor).

## Layout

| Path | What |
|---|---|
| `worker/` | The Cloudflare Worker hub (`src/index.js`, homepage `src/homepage.js`, vendored `src/shared/`, `wrangler.toml`) |
| `src/agent/` + `src/shared/` | Headless collector (source of truth for the worker's vendored copies) |
| `scripts/tm-sync.sh` | One-shot collect+post (cron, every 5 min) |
| `scripts/tm-agent-start.sh` | Persistent agent with restart loop (desktop autostart) |
| `scripts/sync-worker-shared.js` | Vendors `src/shared/` → `worker/src/shared/` — edit `src/shared/`, never the copies |
| `tests/worker/` | Worker protocol tests |
| `.env` | Local-only config (git-ignored): hub URL, secret, client/limits filters |

## Deploy the worker

```bash
cd worker
npm install
npx wrangler login          # one-time browser auth
npx wrangler secret put TOKEN_MONITOR_SECRET
npx wrangler deploy
```

Flow: `npm run sync:worker` (root) → `node --test "tests/worker/*.test.js"` →
`wrangler deploy` (from `worker/`).

Secrets on the worker:

| Secret | Required | Purpose |
|---|---|---|
| `TOKEN_MONITOR_SECRET` | yes | Shared password for `/api/stats`, `/api/ingest`, … (else `503`) |
| `PUBLIC_STATS_ENABLED` | no | Set to `1` for unauthenticated `/api/public/stats` (scrubbed) |

## Homepage dashboard

`GET /` (no auth needed to view; data loads with the built-in secret):

- Today / This week / Month / All-time cards + `synced Xs ago` ticker + stale-device banner
- By-tool + Models (Today/Week/Month/All-time switcher), token-mix bar, activity streaks
- GitHub-style contribution heatmap (hover any cell for tokens/cost/active time) + week-wise bars
- Devices table, limits meters, subscriptions, SSE live updates

## Sync (opencode + antigravity)

`.env` pins it so Kiro and every other provider can never be probed:

```env
TOKEN_MONITOR_HUB_URL=https://token-monitor-hub.noobworker.workers.dev
TOKEN_MONITOR_SECRET=<secret>
TOKEN_MONITOR_CLIENTS=opencode,antigravity
TOKEN_MONITOR_LIMIT_PROVIDERS=opencode,antigravity
```

- Manual top-up: `scripts/tm-sync.sh` (also cron `*/5 * * * *`)
- Always-on: `scripts/tm-agent-start.sh` (also `~/.config/autostart/token-monitor-agent.desktop`)
- Logs: `/tmp/tm-sync.log`, `/tmp/tm-agent.log`

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | none | Dashboard homepage |
| GET | `/api/health` | none | Liveness + device count + hub build |
| GET | `/api/public/stats` | none | Scrubbed aggregate (only if enabled) |
| GET | `/api/stats` | secret | Aggregated today/month/allTime + devices + limits |
| GET | `/api/stats/stream` | secret | SSE push on every ingest |
| GET | `/api/devices`, `/api/history` | secret | Raw records / full history |
| POST | `/api/ingest` | secret | Upsert a device record |
| GET/PUT | `/api/subscriptions` | secret | Shared manual subscription doc (optimistic concurrency) |
| DELETE | `/api/devices/{id}` | secret | Remove a device |

Secret via `Authorization: Bearer`, `x-token-monitor-secret`, or `?secret=`.
