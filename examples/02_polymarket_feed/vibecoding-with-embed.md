---
title: Vibecode a polymarket feed
metadata:
  robots: index
privacy:
  view: public
---

**What you'll build:** A Next.js app that uses the Embed Studio SDK (`mbd-studio-sdk`) to display personalized Polymarket prediction markets with filtering, sorting, and live price charts.

**Stack:** Next.js App Router, TypeScript, Tailwind CSS, TanStack Query, Framer Motion, `mbd-studio-sdk`, `liveline`

**Resources:**
- [Blog post](https://getembed.ai/blog/vibecoding-polymarket-feed) - How the pipeline works and what each prompt does
- [Example repo](https://github.com/ZKAI-Network/mbd_studio_demo/tree/main/examples/02_polymarket_feed) - Full source code for the finished app
- [SDK docs (llms.txt)](https://github.com/ZKAI-Network/mbd_studio_demo/blob/main/llms.txt) - Full `mbd-studio-sdk` API reference — feed this to your LLM
- [Embed Console](https://console.mbd.xyz) - Sign up and grab your API key (starts with `mbd-`)

---

Copy the prompt below into your AI coding assistant along with the [llms.txt](https://github.com/ZKAI-Network/mbd_studio_demo/blob/main/llms.txt). The SDK reference covers all builder methods; this prompt adds the Polymarket-specific context the LLM needs.

````text
Build a personalized Polymarket prediction markets feed as a Next.js 15 App Router app (TypeScript, Tailwind 4, TanStack Query v5, Framer Motion, lucide-react). Use `mbd-studio-sdk` for the recommendation pipeline (see the attached llms.txt for the full SDK API). Use `liveline` for canvas-rendered price sparklines. Store the API key in .env.local as MBD_API_KEY.

**Pipeline logic** — single `/api/pipeline` POST route, all server-side:
- **No wallet:** `filter_and_sort` on `polymarket-items` index, sorted by `volume_24hr` desc. With a search query, use `.text(query)` for semantic search instead (pad queries < 5 chars, e.g. `"AI"` → `"AI markets predictions"`).
- **With wallet:** call `forUser("polymarket-wallets", address)`, then `boost` search (150 items, `.includeVectors(true)`) → `features("v1")` → `scoring` with model `"/scoring/ranking_model/polymarket-rerank-v1"` → `ranking` with `.sortingMethod("mix").mix("topic_score","desc",40).mix("user_affinity_score","desc",40).mix("rerank_polymkt1","desc",20).diversity("semantic").lambda(0.5).horizon(20).limitByField().every(5).limit("cluster_1",2)`. For boost, use `.groupBoost("polymarket-wallets","ai_labels_med",wallet,"label",1,5,5)` and `.groupBoost("polymarket-wallets","tags",wallet,"tag",1,3,5)`. If the user also typed a query, use `.text()` instead of `.boost()` (they're mutually exclusive endpoints). Fall back to search order if features/scoring fails.

**Key gotchas:** `.selectFields()` and `.includeVectors()` are mutually exclusive — use `selectFields` for unpersonalized, `includeVectors(true)` for personalized. Filter fields: use `liquidity_num` (not `liquidity`, which can be null), `ai_labels_med` (not `ai_labels`), `slug` (not `market_slug`). Quality filters: `active=true`, `liquidity_num>5000`, `volume_num>500`, `volume_24hr>100`, `end_date` within ±1 year; exclude `closed`, `archived`, `price_0_or_1`. Topic filtering uses `.terms("tags", [...])` with values like `Sports`, `Crypto`, `Politics`, etc.

**Price charts** — use `liveline` (canvas-rendered React sparkline, `npm i liveline`). Fetch real price history via: (1) resolve slug → CLOB token ID with `GET https://gamma-api.polymarket.com/markets?slug={slug}` (note: `clobTokenIds` is a JSON **string**, must `JSON.parse` it, take `[0]` for YES token), then (2) `GET https://clob.polymarket.com/prices-history?market={tokenId}&interval=1w&fidelity=60` (returns `{ history: [{ t, p }] }`). Fall back to a synthetic sparkline derived from the price change fields when CLOB data is unavailable.

**UI:** dark theme (#06080d bg, #00d4aa yes/teal, #ff4d6a no/red), IBM Plex Sans + Mono. Market cards with YES/NO prices in cents, 1-week sparkline, stats (vol/liq/spread/time remaining), tags, AI labels (strip `mbd2:t_` prefix), deep links to `polymarket.com/event/{slug}`. Responsive grid with client-side infinite scroll (reveal 25 at a time from the full result set). Wallet input with ETH address validation, search bar with topic pill filters and sort dropdown (hidden when personalized or searching).
````
