---
title: Vibecode a polymarket feed
metadata:
  robots: index
privacy:
  view: public
---
Build a full prediction markets app by copy-pasting these 5 prompts into your AI assistant. Each prompt includes the complete API context needed — no external docs required.

**What you'll build:** A Next.js app that uses the Embed Studio SDK (`mbd-studio-sdk`) to display personalized Polymarket prediction markets with filtering, sorting, and live price charts.

**Stack:** Next.js App Router, TypeScript, Tailwind CSS, TanStack Query, Framer Motion, `mbd-studio-sdk`, `liveline`

---

## How to Use This Guide

1. Copy a prompt (the text inside the fenced block)
2. Paste it into your AI coding assistant
3. Review and apply the generated code
4. Run the checkpoint to verify it works
5. Move to the next prompt

Each prompt has:
- **Context** — API reference data embedded so the AI has everything it needs
- **Prompt** — The instruction to copy-paste
- **Checkpoint** — What to verify before continuing

---

## Prompt 1: Project + Types + SDK

Sets up the Next.js project, TypeScript types, and Studio SDK initialization in one shot.

> **CRITICAL: Field name accuracy.** The field names below reflect actual API responses. Pay close attention — many differ from what you might guess.

````text
Create a new Next.js project for a prediction markets app using the Embed Studio SDK. Set up the project scaffold, TypeScript types, and SDK initialization.

## Requirements
- Next.js 15 App Router with TypeScript (strict mode)
- Tailwind CSS 4 with PostCSS
- TanStack Query v5 for data fetching
- Framer Motion for animations
- lucide-react for icons
- **mbd-studio-sdk** — Embed Studio SDK for search, features, scoring, ranking
- **liveline** — Canvas-rendered 60fps line charts
- dotenv — for environment variables

## Theme (dark mode only)
Set these CSS variables in globals.css:
- --background: #06080d (deep space)
- --card: #0c1017
- --foreground: #f0f4f8
- --muted-foreground: #6b7a8f
- --border: #1e2a3a
- --yes-color: #00d4aa (teal green)
- --no-color: #ff4d6a (red/pink)
- --ring: #00d4aa

Font: IBM Plex Sans for body, IBM Plex Mono for numbers/stats. Import from Google Fonts via next/font.

## Environment
Create `.env.local` with your API key from the [Embed Console](https://console.mbd.xyz) (starts with `mbd-`):
```
MBD_API_KEY=your_console_api_key_here
```

## Base styles in globals.css
- Dark background with subtle noise texture overlay (opacity 1.5%)
- Custom scrollbar styling (thin, border-colored)
- Smooth scrolling
- Fade-up animation keyframe for card entrance
- Shimmer animation for skeleton loading states

## SDK Reference

The `mbd-studio-sdk` package provides a fluent API for the Embed Studio pipeline. All calls go through `https://api.mbd.xyz/v3/studio` with Bearer token auth.

### SDK initialization

```javascript
import { StudioConfig, StudioV1 } from "mbd-studio-sdk";

const config = new StudioConfig({ apiKey: process.env.MBD_API_KEY! });
const mbd = new StudioV1({ config });

// Set user context for personalization (optional)
mbd.forUser("polymarket-wallets", "0xWalletAddress");
```

### SDK methods

| Method | Purpose |
|--------|---------|
| `mbd.search()` | Build a search query (filter_and_sort, boost, or semantic) |
| `mbd.addCandidates(result)` | Store search results in SDK state |
| `mbd.features("v1")` | Enrich candidates with ML features |
| `mbd.addFeatures(result)` | Attach features to candidates |
| `mbd.scoring()` | Rerank with ML model |
| `mbd.addScores(result, name)` | Attach model scores to candidates |
| `mbd.ranking()` | Apply sort + diversity + limits |
| `mbd.addRanking(result)` | Apply final ordering |
| `mbd.getFeed()` | Get the final ranked feed |

### Search builder methods
- `.index(name)` — which index to search
- `.includeVectors(bool)` — include embedding vectors (needed for semantic diversity)
- `.text(query)` — **semantic search** by text similarity. Use this for user search queries — it finds markets by meaning, not just keyword matching. Requires minimum 5 characters. When `.text()` is set, the SDK uses the `/search/semantic` endpoint. Supports `.include()` and `.exclude()` filters, but NOT `.sortBy()` or `.boost()` (results are ordered by semantic relevance).
- `.include()` — start include filter chain (AND logic)
  - `.numeric(field, operator, value)` — range filter (operators: ">", ">=", "<", "<=")
  - `.term(field, value)` — exact match
  - `.terms(field, [values])` — match any in list
  - `.match(field, text)` — keyword search (NOTE: this is broad/fuzzy and may return unexpected results — prefer `.text()` for user-facing search)
  - `.date(field, dateFrom?, dateTo?)` — date range with positional ISO 8601 strings (e.g. `.date("end_date", "2025-01-01T00:00:00Z", "2027-01-01T00:00:00Z")`)
  - `.notNull(field)` — field exists
- `.exclude()` — start exclude filter chain (NOT logic, same methods as include)
- `.boost()` — start boost chain (SHOULD logic, for personalization)
  - `.groupBoost(lookupIndex, field, walletId, group, minBoost, maxBoost, n)` — dynamic wallet personalization. Reads `{group}_01..{group}_N` from wallet doc, applies decreasing boost.
- `.sortBy(field, order)` — sort results (only for filter_and_sort, NOT boost or semantic)
- `.size(n)` — max results (default 100)
- `.selectFields([...])` — only return these fields
- `.execute()` — run the search

**Search endpoints:** The SDK automatically picks the endpoint based on what you've configured:
- `.text()` set → `/search/semantic` (semantic search — supports include/exclude, NOT sortBy/boost)
- `.boost()` set → `/search/boost` (personalized — supports include/exclude, NOT sortBy)
- Otherwise → `/search/filter_and_sort` (supports include/exclude/sortBy, NOT boost)

**Important:** `.selectFields()` and `.includeVectors()` are mutually exclusive — the API will reject requests that use both. Use `.selectFields()` for unpersonalized searches (no vectors needed) and `.includeVectors(true)` for personalized searches (vectors needed for semantic diversity ranking).

**Important: Filter chain context.** Calling `.include()`, `.exclude()`, or `.boost()` switches the active filter context. All subsequent filter methods (`.term()`, `.numeric()`, `.terms()`, etc.) append to the **last context that was opened**. If you need to add filters conditionally, do it before switching to the next context:
```javascript
// CORRECT — conditional filters added within the include context
const search = mbd.search()
  .index("polymarket-items")
  .include()
    .term("active", true)
    .numeric("liquidity_num", ">", 5000);
if (topics?.length) search.terms("tags", topics);  // still appends to include
search.exclude()
    .term("closed", true);

// WRONG — .terms() here appends to exclude, not include
const search = mbd.search()
  .include().term("active", true)
  .exclude().term("closed", true);
if (topics?.length) search.terms("tags", topics);  // goes to exclude!
```

### Ranking builder

**Sort methods:**
- `sort` — multi-field sort: `.sortingMethod("sort").sortBy(field, direction)`
- `linear` — weighted sum: `.sortingMethod("linear").weight(field, weight)`. **WARNING: does NOT normalize. Mixing different scales (volume in millions vs score 0-1) means the large-scale field dominates.**
- `mix` — interleave by percentage: `.sortingMethod("mix").mix(field, direction, percentage)`

**Diversity methods:**
- `fields` — round-robin: `.diversity("fields").fields([field])`
- `semantic` — MMR-style: `.diversity("semantic").lambda(0-1).horizon(>=5)`. Items need embedding vectors.

**Limits:**
- `.limitByField().every(n).limit(field, max)` — at most `max` items with same field value per window of `n`

### Searchable indices

| Index | Content |
|-------|---------|
| `polymarket-items` | Prediction markets |
| `polymarket-wallets` | Trader profiles |
| `farcaster-items` | Social posts (Farcaster) |
| `zora-coins` | NFT coins/tokens (Zora) |

### Polymarket-items: Key Document Fields

Items returned by search have an `_source` object. Only fetch the fields you need using `.selectFields()`.

| Field | Type | Notes |
|-------|------|-------|
| `question` | string | The prediction question |
| `description` | string | Market description |
| `active` | boolean | Whether market is active |
| `closed` | boolean | Whether market is closed |
| `archived` | boolean | Whether market is archived |
| `price_0_or_1` | boolean | True if price is 0 or 1 (effectively resolved) |
| `liquidity` | number or null | Can be null — use `liquidity_num` instead |
| `liquidity_num` | number | Always populated, use this for filtering |
| `volume_24hr` | number | 24h trading volume |
| `volume_num` | number | Total volume |
| `best_ask` | number | YES price (0–1) |
| `last_trade_price` | number | Last trade price |
| `spread` | number | Bid-ask spread |
| `one_hour_price_change` | number or null | 1h price change |
| `one_day_price_change` | number or null | 24h price change |
| `one_week_price_change` | number or null | 7d price change |
| `one_month_price_change` | number or null | 30d price change |
| `end_date` | string | ISO date, market resolution date |
| `created_at` | string | ISO date |
| `ai_labels_med` | string[] | AI topic labels (NOTE: NOT `ai_labels` — that field doesn't exist) |
| `ai_labels_high` | string[] | High-confidence AI labels |
| `ai_labels_low` | string[] | Low-confidence AI labels |
| `image` | string | Market image URL |
| `slug` | string | URL slug (NOTE: NOT `market_slug` — that field doesn't exist) |
| `outcomes` | string[] | e.g. ["Yes", "No"] |
| `outcome_prices` | number[] | e.g. [0.65, 0.35] |
| `tags` | string[] | Polymarket tags e.g. ["Crypto", "Bitcoin", "Politics"] |
| `featured` | boolean | Whether market is featured |

### Polymarket-wallets: Key Document Fields

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | string | Wallet address |
| `volume` | number | Total trading volume |
| `pnl` | number | Profit and loss |
| `primary_labels` | string[] | User's primary AI labels |
| `primary_tags` | string[] | User's primary Polymarket tags |
| `label_01` through `label_10` | string or null | Individual labels ranked by importance |
| `tag_01` through `tag_10` | string or null | Individual tags ranked by importance |
| `pseudonym` | string | User pseudonym |

## Directory structure
```
src/
├── app/
│   ├── api/          # API route handlers
│   ├── layout.tsx    # Root layout with QueryProvider + fonts
│   ├── page.tsx      # Main page
│   └── globals.css   # Theme variables + base styles
├── lib/
│   ├── studio.ts     # Studio SDK initialization
│   ├── mappers.ts    # SDK hit → frontend type mapping
│   ├── format.ts     # Currency/date formatters
│   └── sparkline.ts  # Synthetic price chart fallback
├── components/       # UI components
├── types/            # TypeScript types
├── hooks/            # Custom React hooks
└── providers/
    └── QueryProvider.tsx  # TanStack Query setup (30s staleTime)
```

## What to create

1. **Project scaffold** — Next.js project with all deps, theme, directory structure

2. `src/lib/studio.ts` — Server-only module that exports a `createStudio()` helper:
   ```typescript
   import { StudioConfig, StudioV1 } from "mbd-studio-sdk";

   export function createStudio(wallet?: string) {
     const config = new StudioConfig({ apiKey: process.env.MBD_API_KEY! });
     const mbd = new StudioV1({ config });
     if (wallet) mbd.forUser("polymarket-wallets", wallet);
     return mbd;
   }
   ```

3. `src/types/market.ts` — Frontend Market type with: id, question, description, active, liquidity, volume24hr, spread, bestAsk, lastTradePrice, endDate, priceChange1hr/24hr/7d/30d, aiLabels (from ai_labels_med), image, slug (NOT marketSlug), outcomes, outcomePrices, tags

4. `src/lib/mappers.ts` — `transformHit(hit)` function that maps SDK hit `_source` to frontend Market type:
   - `id` ← `_id`
   - `liquidity` ← `_source.liquidity ?? _source.liquidity_num ?? 0` (fallback since liquidity can be null)
   - `aiLabels` ← `_source.ai_labels_med` (NOT `ai_labels`)
   - `slug` ← `_source.slug` (NOT `market_slug`)

5. `src/lib/format.ts` — Utility formatters:
   - `formatCurrency(n)` — "$1.5M", "$234K", "$1.2K"
   - `formatCents(n)` — "62¢" (multiply by 100)
   - `formatPercent(n)` — "+5.2%" or "-3.1%"
   - `formatTimeRemaining(date)` — "5h", "3d", "2w"
   - `formatLabel(label)` — strip "mbd2:t_" prefix, title-case

6. `src/providers/QueryProvider.tsx` — TanStack Query client wrapper with 30s staleTime

All API routes should validate inputs, handle errors, and never expose the API key to the client.
````

**Checkpoint:** `npm run dev` starts without errors. `npx tsc --noEmit` passes. The page loads with a dark background.

---

## Prompt 2: Search & Personalization Pipeline

The core of the app — a single `/api/pipeline` route that handles both unpersonalized and personalized feeds. This prompt covers search, boost, features, scoring, and ranking.

````text
Create the full search and personalization pipeline for the prediction markets app using the Embed Studio SDK.

## Pipeline Overview

**Without wallet + no query:** `filter_and_sort` → display (sorted by volume)
**Without wallet + query:** `semantic search` → display (sorted by relevance)
**With wallet:** `boost search (150 items)` → `features` → `scoring` → `ranking (diversity)` → display
**With wallet + query:** `semantic search (150 items)` → `features` → `scoring` → `ranking` → display

Everything runs server-side in a single POST route at `/api/pipeline`.

## Part 1: Unpersonalized Search (no wallet)

Quality filters applied to every search:

**Include (AND logic):**
- `.term("active", true)` — only active markets
- `.numeric("liquidity_num", ">", 5000)` — minimum liquidity (use `liquidity_num` NOT `liquidity` — the latter can be null)
- `.numeric("volume_num", ">", 500)` — minimum total volume
- `.numeric("volume_24hr", ">", 100)` — minimum 24h volume
- `.date("end_date", "<1 year ago ISO>", "<1 year from now ISO>")` — reasonable date range

**Exclude (NOT logic):**
- `.term("closed", true)` — no closed markets
- `.term("archived", true)` — no archived markets
- `.term("price_0_or_1", true)` — no resolved markets

**Fields to select** (reduces payload — documents have 50+ fields):
```
["question", "description", "active", "liquidity", "liquidity_num", "volume_24hr", "spread", "best_ask", "last_trade_price", "end_date", "one_hour_price_change", "one_day_price_change", "one_week_price_change", "one_month_price_change", "ai_labels_med", "image", "slug", "outcomes", "outcome_prices", "tags"]
```

```javascript
const mbd = createStudio(); // no wallet = unpersonalized

const search = mbd.search()
  .index("polymarket-items")
  .size(100)
  .selectFields(SELECT_FIELDS);

// Use semantic search for text queries, filter_and_sort for browsing
if (query) {
  // .text() triggers semantic search — results ordered by relevance, not sortBy
  // Minimum 5 chars required — pad short queries (e.g. "iran" → "iran markets predictions")
  search.text(query.length >= 5 ? query : `${query} markets predictions`);
} else {
  search.sortBy("volume_24hr", "desc");
}

search.include()
    .term("active", true)
    .numeric("liquidity_num", ">", 5000)
    .numeric("volume_num", ">", 500)
    .numeric("volume_24hr", ">", 100)
    .date("end_date", dateFrom, dateTo);

// Add optional topic filter BEFORE switching to exclude context
if (topics?.length) search.terms("tags", topics);

search.exclude()
    .term("closed", true)
    .term("archived", true)
    .term("price_0_or_1", true);

const candidates = await search.execute();
mbd.addCandidates(candidates);
const feed = mbd.getFeed();
```

**Text search:** Use `.text(query)` for user search queries — it uses semantic (vector) search to find markets by meaning, not just keywords. For example, searching "iran" finds "US strikes Iran", "Iranian rials", "Iranian regime" even though the query is short. The `.match()` filter is broad/fuzzy and should NOT be used for user-facing search.

**Topic tags for filtering** (use with `tags` field, `.terms()` filter):
`Sports`, `Crypto`, `Politics`, `Games`, `Esports`, `Finance`, `Weather`, `Culture`

> **NOTE:** Use the `tags` field (Polymarket's own tags) for topic filtering in the UI — these are human-readable and reliable. The `ai_labels_med` field contains AI-generated labels that are useful for personalization (via `groupBoost`) but less intuitive for user-facing filters.

## Part 2: Personalized Pipeline (with wallet)

When a wallet is connected, run the full 4-stage pipeline.

### Stage 1: Boost Search with groupBoost

Use `.boost()` instead of `.sortBy()`. The `groupBoost` method dynamically reads the wallet's preferences from polymarket-wallets and boosts matching markets.

**How groupBoost works:**
- Reads fields `{group}_01`, `{group}_02`, ..., `{group}_N` from the wallet document
- Applies linearly decreasing boost: first match gets `maxBoost`, last gets `minBoost`
- For a wallet with `label_01: "mbd2:t_science_technology"`, markets matching that label get the highest boost

```javascript
const mbd = createStudio(walletAddress);

// NOTE: includeVectors and selectFields are mutually exclusive — do NOT use both.
// Vectors are needed here for semantic diversity in the ranking step.
const search = mbd.search()
  .index("polymarket-items")
  .size(150)  // large pool — gives ranking more variety to work with
  .includeVectors(true);

// If user typed a search query, use semantic search (no boost — they're mutually exclusive)
if (query) {
  search.text(query.length >= 5 ? query : `${query} markets predictions`);
}

search.include()
    .term("active", true)
    .numeric("liquidity_num", ">", 5000)
    .numeric("volume_num", ">", 500)
    .numeric("volume_24hr", ">", 100)
    .date("end_date", dateFrom, dateTo);

if (topics?.length) search.terms("tags", topics);

search.exclude()
    .term("closed", true)
    .term("archived", true)
    .term("price_0_or_1", true);

// Only add boost when not using text search (.text() and .boost() use different endpoints)
if (!query) {
  search.boost()
    .groupBoost("polymarket-wallets", "ai_labels_med", walletAddress, "label", 1, 5, 5)
    .groupBoost("polymarket-wallets", "tags", walletAddress, "tag", 1, 3, 5);
}

const candidates = await search.execute();
mbd.addCandidates(candidates);
```

**Important:** Fetch 150 items (not 25) so the ranking stage has enough variety. With a small pool, heavy boosts can make all results the same topic. A larger pool lets ranking diversify across subtopics.

**Important:** `.text()` (semantic search) and `.boost()` use different API endpoints and cannot be combined in a single request. When the user types a search query, use `.text()` for relevance; when browsing without a query, use `.boost()` for personalization.

### Stage 2: Features

Enrich candidates with ML-computed personalization signals:

```javascript
const features = await mbd.features("v1").execute();
mbd.addFeatures(features);
```

The SDK automatically passes the user (set via `forUser()`) and candidate IDs (from `addCandidates()`).

**Key features attached to each item:**
- `sem_sim_closest` (0–1) — cosine similarity to user embeddings
- `usr_primary_labels` (0–1) — fraction of user's labels matching
- `num_bets` (0 or 1) — whether user bet on similar items
- `bets[]` — recent trader activity: `{ user_pseudonym, side, outcome, usdc }`
- `topic_score` (0–1) — composite relevance score (in scores section)

Extract bets from the features result to pass to the frontend for display.

### Stage 3: Scoring

Rerank candidates using a trained ML model:

```javascript
const scores = await mbd.scoring()
  .model("/scoring/ranking_model/polymarket-rerank-v1")
  .execute();
mbd.addScores(scores, "ranking_model_polymarket_rerank_v1");
```

### Stage 4: Ranking (Diversity + Limits)

**The problem:** Boost search + scoring can produce feeds dominated by one topic. A crypto trader might see 15 Bitcoin price markets in a row.

**The fix:** Ranking applies semantic diversity and cluster limits.

```javascript
const ranking = await mbd.ranking()
  .sortingMethod("mix")
  .mix("topic_score", "desc", 40)
  .mix("user_affinity_score", "desc", 40)
  .mix("rerank_polymkt1", "desc", 20)
  .diversity("semantic")
  .lambda(0.5)
  .horizon(20)
  .limitByField()
  .every(5)
  .limit("cluster_1", 2)
  .execute();

mbd.addRanking(ranking);
const feed = mbd.getFeed();
```

**`mix`** interleaves results by percentage — 40% topic relevance, 40% user affinity, 20% reranking model.

**`semantic` diversity** uses MMR (Maximal Marginal Relevance) to balance relevance vs. similarity to already-selected items. `lambda` controls the trade-off: 0.0 = pure diversity, 1.0 = pure relevance, 0.5 = good default.

**`limitByField`** adds hard constraints: at most 2 items from the same cluster in any window of 5.

Error handling: if features/scoring fails (user not found), fall back to boost search order.

## What to create

1. `src/app/api/pipeline/route.ts` — POST route:
   - Accept `{ wallet?, query?, topics?, sortField?, sortOrder?, size? }`
   - **No wallet, no query:** filter_and_sort search → return 100 results sorted by volume (client reveals 25 at a time via infinite scroll)
   - **No wallet, with query:** semantic search via `.text()` → return 100 results sorted by relevance (client reveals 25 at a time)
   - **With wallet, no query:** boost search (150 items) → features → scoring → ranking → personalized feed
   - **With wallet, with query:** semantic search (150 items) → features → scoring → ranking → personalized + relevant feed
   - For text queries, pad short strings (< 5 chars) to meet the `.text()` minimum: `"iran"` → `"iran markets predictions"`
   - Topic filtering uses `.terms("tags", topics)` with Polymarket tag values (e.g. "Sports", "Crypto", "Politics")
   - Extract bets from features result
   - Fall back to boost/search order if features/scoring fails
   - Return: `{ markets, bets, isPersonalized, totalHits }` — the full result set; the client handles progressive reveal

2. `src/hooks/useFullPipeline.ts` — TanStack Query hook:
   - Calls `/api/pipeline` with all params
   - 30s stale time
   - Returns: `{ data: { markets, bets, isPersonalized }, isLoading, error }`

3. `src/hooks/useWallet.ts` — Simple wallet state hook:
   - Store wallet address in React state + localStorage
   - Validate format: must match `/^0x[a-fA-F0-9]{40}$/`
   - Return: `{ wallet, setWallet, isValid, clearWallet }`
````

**Checkpoint:** With no wallet, 25 markets appear initially (scroll to load more, up to ~100). Enter wallet `0xea80ca47759ef8af31229b360848c62d98ae35fb` — results reorder with crypto/tech prominently. Topics are interleaved (not all Bitcoin in a row).

---

## Prompt 3: UI Components + Polish

Builds all visual components and wires them together with production-quality UX.

````text
Create the UI components for the prediction markets app, fully wired and polished.

## Design Context

**Color palette (from CSS variables):**
- Background: #06080d, Card: #0c1017
- Text: #f0f4f8, Muted: #6b7a8f
- Border: #1e2a3a
- YES color: #00d4aa (teal), NO color: #ff4d6a (red/pink)
- Ring/accent: #00d4aa

**Typography:** IBM Plex Sans (body), IBM Plex Mono (numbers, stats, prices)

## Components to create

### 1. MarketCard (`src/components/MarketCard.tsx`)
- Props: `{ market: Market, bets: FeatureBet[] | null, index: number }`
- Card with dark background, subtle border, rounded-xl
- **Top section:** Question text (line-clamp-2), market image thumbnail if available
- **Price section:** YES price badge (teal), NO price badge (red). Calculate NO = `1 - bestAsk`. Show as cents: "62¢"
- **Price change:** Show priceChange24hr as "+5.2%" (green) or "-3.1%" (red) with arrow icon
- **Stats row:** Vol, Liq, Spread %, time remaining (calculated from endDate). Use formatCurrency, formatTimeRemaining.
- **Tags + Labels:** Show first 3 Polymarket tags as teal-tinted pills, then first 2 AI topic labels (strip "mbd2:t_" prefix, format nicely)
- **Top trader bet:** If bets prop has entries, show the most recent: "{user_pseudonym} {side} {outcome} for ${usdc}"
- **Deep link:** Clickable → `https://polymarket.com/event/{slug}` (only if slug exists) with external link icon
- Framer Motion staggered fade-up animation (delay by index * 0.04)

### 2. MarketGrid (`src/components/MarketGrid.tsx`)
- Props: `{ markets, bets, isLoading, onLoadMore?, hasMore? }`
- `bets: Record<string, FeatureBet[]> | null`
- Responsive grid: 1 col mobile, 2 cols md, 3 cols lg
- **Infinite scroll:** Intersection Observer on a sentinel div at the bottom. When `hasMore` is true and the sentinel enters the viewport (with 200px rootMargin), call `onLoadMore`. When `hasMore` is false, hide the sentinel.
- Show a small loading spinner at the bottom when `hasMore` is true
- Skeleton placeholders while loading initial data

### 3. SearchBar (`src/components/SearchBar.tsx`)
- Text input, topic pills (toggleable), sort dropdown
- Topic pills use Polymarket `tags` values: Sports, Crypto, Politics, Games, Esports, Finance, Weather, Culture
- Sort options: 24h Volume, Liquidity, Price Change, Newest, Ending Soon
- Sort dropdown is hidden when a text query is active (semantic search orders by relevance)

### 4. WalletInput (`src/components/WalletInput.tsx`)
- Ethereum address input with validation (0x + 40 hex chars)
- Green checkmark / red X indicator
- Clear button

### 5. Header (`src/components/Header.tsx`)
- Market count, personalization badge when wallet active

### 6. SkeletonCard (`src/components/SkeletonCard.tsx`)
- Shimmer loading skeleton matching card layout

## UX Polish
- Loading: skeleton cards while fetching
- Errors: styled error banner with retry guidance
- Keyboard: `/` focus search, `Escape` blur, `w` focus wallet
- Mobile: stacked layout, responsive grid
- Currency formatting: "$1.5M", "$234K", "62¢"

## Wire in page.tsx
- Use `useWallet` and `useFullPipeline` hooks
- Render Header, WalletInput, SearchBar, MarketGrid
- Pass search params (query, topics, sortField, wallet) to the pipeline hook
- **Infinite scroll (client-side progressive reveal):**
  - Add `visibleCount` state starting at 25
  - Slice `allMarkets` to `visibleCount` before passing to MarketGrid
  - Pass `onLoadMore` callback that increments `visibleCount` by 25
  - Pass `hasMore = visibleCount < allMarkets.length` to MarketGrid
  - Reset `visibleCount` to 25 when `searchParams` change (useEffect)
````

**Checkpoint:** Cards show YES/NO prices, tags, AI labels, stats, deep links. Keyboard shortcuts work. Mobile layout stacks properly. Scrolling to the bottom reveals the next 25 markets instantly (no loading delay) until all ~100 are visible. Changing search query or filters resets to 25 visible.

---

## Prompt 4: Price Charts

Adds real price history sparklines to each market card using the `liveline` charting library and Polymarket's public CLOB API.

````text
Add real-time price charts to each market card using the `liveline` charting library.

## Install

```bash
npm i liveline
```

`liveline` is a canvas-rendered, 60fps React line chart. Zero CSS imports.

## Liveline API

```tsx
import { Liveline } from "liveline";

<Liveline
  data={points}         // { time: number, value: number }[] — historical data
  value={currentPrice}  // number — latest value (smoothly interpolated)
  color="#00d4aa"        // accent color — derive from chart data trend
  theme="dark"
  grid={false}           // hide y-axis grid (card is small)
  badge={true}           // show value pill at chart tip
  badgeVariant="minimal" // white text, subtle style
  badgeTail={false}      // no pointed tail (cleaner at small size)
  pulse={false}          // no pulsing dot
  fill={true}            // gradient under curve
  scrub={true}           // crosshair on hover
  momentum={false}       // no glow arrows
  window={604800}        // visible window in seconds (1 week = 7 * 86400)
  formatValue={(v) => `${(v * 100).toFixed(1)}¢`}
  padding={{ top: 4, right: 50, bottom: 4, left: 4 }}
/>
```

The component fills its parent container — set a height on the parent div (e.g. `h-16`).

**Chart color:** Derive from the actual chart data trend (compare first point to last point), NOT from `priceChange24hr`. The chart shows 1 week of data, and the 24hr change can contradict the visible trend:
```typescript
const chartTrendUp = chartData[chartData.length - 1].value >= chartData[0].value;
const chartColor = chartTrendUp ? "#00d4aa" : "#ff4d6a";
```

## Polymarket CLOB Price History API (public, no auth)

Real price data comes from Polymarket's public CLOB API. Two steps:

### Step 1: Resolve slug → CLOB token ID via Gamma API

```
GET https://gamma-api.polymarket.com/markets?slug={slug}
```

Response is a JSON array. Each market has a `clobTokenIds` field.

**IMPORTANT:** `clobTokenIds` is returned as a JSON **string**, not an array. You must `JSON.parse()` it:

```typescript
let ids = market.clobTokenIds;
if (typeof ids === "string") {
  ids = JSON.parse(ids);
}
const yesTokenId = ids[0]; // first token = YES outcome
```

### Step 2: Fetch price history from CLOB

```
GET https://clob.polymarket.com/prices-history?market={tokenId}&interval=1w&fidelity=60
```

Response:
```json
{
  "history": [
    { "t": 1697875200, "p": 0.65 },
    { "t": 1697878800, "p": 0.67 }
  ]
}
```

- `t` = unix timestamp, `p` = price (0–1)
- `interval`: `1h`, `6h`, `1d`, `1w`, `max`
- `fidelity`: data resolution in minutes (60 = hourly points)

## Synthetic Sparkline Fallback

Some markets may not have CLOB data (new markets, delisted, or slug mismatch). Generate a synthetic sparkline from the price change fields as fallback:

```typescript
// Use priceChange30d, priceChange7d, priceChange24hr, priceChange1hr
// to create anchor points, then interpolate between them with light jitter.
// Each anchor: { secsAgo: number, price: currentPrice - priceChange }
```

Use deterministic jitter (seeded by market ID) so the sparkline is stable across re-renders.

## What to create

1. `src/app/api/price-history/route.ts` — GET route:
   - Accept `?slug=market-slug` query param
   - Resolve slug → CLOB token ID via Gamma API (cache the mapping in-memory)
   - Fetch price history from CLOB (1 week, hourly fidelity)
   - Cache results in-memory for 5 minutes (skip caching empty results)
   - Return `{ history: [{ time, value }] }` — return empty array on error (graceful fallback)
   - **Critical:** `clobTokenIds` from Gamma is a JSON string, not an array — `JSON.parse()` it

2. `src/lib/sparkline.ts` — `generateSparkline(market)` function:
   - Builds synthetic price history from price change anchors (30d → 7d → 24h → 1h → now)
   - Interpolates between anchors with deterministic jitter
   - Returns `{ time: number, value: number }[]`
   - Used as fallback when CLOB data unavailable

3. `src/hooks/usePriceHistory.ts` — React Query hook:
   - `usePriceHistory(slug)` — fetches `/api/price-history?slug=...`
   - 5 min stale time, only enabled when slug is truthy
   - Returns `{ data: PricePoint[] }`

4. Update `src/components/MarketCard.tsx`:
   - Import `Liveline` from `liveline` and `usePriceHistory` hook
   - Call `usePriceHistory(market.slug)` for real data
   - Generate synthetic sparkline with `useMemo` as fallback
   - Use `chartData = priceHistory?.length ? priceHistory : sparkline`
   - **Color from chart trend** — compare first and last data point, NOT priceChange24hr
   - Place chart between the prices section and stats row
   - Container: `<div className="h-16 mb-3 -mx-1">`
````

**Checkpoint:** Market cards show price charts with a value badge at the tip. Green charts trend up, red charts trend down. Hover to scrub through price history.

---

## Prompt 5: Advanced Features (Optional)

````text
Add advanced features to the prediction markets app using the Embed Studio SDK.

### 1. Semantic Search Enhancements
- Semantic search is already built into the pipeline (`.text()` is used automatically when a query is typed)
- Add a visual indicator when semantic search is active (teal glow on search bar)
- Show a "Powered by semantic search" badge when results are relevance-ordered
- Consider adding a query suggestions dropdown using frequent values from the `tags` field

### 2. Custom Ranking Controls
- Expandable panel with diversity and limits sliders
- Diversity: toggle between "fields" and "semantic"
- Limits: adjust every_n (2-10) and limit per tag (1-5)
- Changes re-run ranking only (SDK makes this easy — just call `mbd.ranking()` again)

### 3. Frequent Values Explorer
- "Discover" button → modal showing top values for `ai_labels_med` or `tags`
- Uses `GET https://api.mbd.xyz/v3/studio/search/frequent_values/polymarket-items/{field}?size=50`
- Click a value to add it as a filter
````

**Checkpoint:** Semantic search finds markets by meaning. Ranking controls visibly affect feed diversity.
