# Getting Started — Polymarket Recommendations Demo

This example shows how to use the MBD Studio SDK to build a personalized Polymarket prediction market feed. It demonstrates the full pipeline: search → features → scoring → ranking.

---

## Install

```bash
npm install
```

This installs:

- **mbd-studio-sdk** — MBD Studio backend client for search, features, scoring, and ranking
- **dotenv** — Loads environment variables from `.env`

---

## Configure

Create a `.env` file in this directory with your credentials:

```env
API_KEY=your-mbd-api-key
POLYMARKET_WALLET=0xYourPolymarketWalletAddress
```

| Variable | Description |
|----------|-------------|
| `API_KEY` | Your MBD Studio API key |
| `POLYMARKET_WALLET` | Polymarket wallet address used for personalization |

Both are required. The script will throw an error if either is missing.

---

## Run

```bash
npm start
```

Or directly:

```bash
node polymarket.js
```

The script prints the top 10 recommended Polymarket items with their question text and ranking score.

---

## Algorithm Step by Step

The demo runs a 5-stage pipeline to produce a personalized, diversified feed of Polymarket markets.

### 1. Initialize SDK and set user context

```javascript
const config = new StudioConfig({ apiKey: apiKey });
const mbd = new StudioV1({ config });
mbd.forUser("polymarket-wallets", polymarketWallet);
```

- Create `StudioConfig` with your API key.
- Create `StudioV1` instance.
- Call `mbd.forUser("polymarket-wallets", polymarketWallet)` to set the target user for personalization. This drives user-specific boosts and affinity scores later.

### 2. Search (candidate retrieval)

```javascript
const candidates = await mbd.search()
  .index("polymarket-items")
  .includeVectors(true)
  .include()
  .numeric("volume_1wk", ">=", 10000)
  .exclude()
  .term("closed", true)
  .term("price_under05_or_over95", true)
  .boost()
  .groupBoost("polymarket-wallets", "ai_labels_med", polymarketWallet, "label", 1, 5, 10)
  .groupBoost("polymarket-wallets", "tags", polymarketWallet, "tag", 1, 5, 10)
  .execute()
mbd.addCandidates(candidates);
```

- **Index:** `polymarket-items`
- **Include vectors:** Yes (for semantic search and diversity).
- **Include filter:** `volume_1wk >= 10000` — only markets with at least $10k weekly volume.
- **Exclude filters:**
  - `closed = true` — skip closed markets
  - `price_under05_or_over95 = true` — skip markets with extreme prices (too settled)
- **Boosts (personalization):**
  - `groupBoost` on `ai_labels_med` — boost items whose AI labels match the user’s labels (weights 1, 5, 10).
  - `groupBoost` on `tags` — boost items whose tags match the user’s tags (weights 1, 5, 10).

Result: a candidate set of Polymarket items that pass filters and are boosted by user affinity.

### 3. Features (enrichment)

```javascript
const features = await mbd.features("v1")
  .execute()
mbd.addFeatures(features);
```

- Call `mbd.features("v1").execute()` to fetch signals and metadata for each candidate.
- `mbd.addFeatures(features)` attaches these to the candidates (e.g. `topic_score`, `user_affinity_score`).

These features are used in the ranking stage.

### 4. Scoring (reranking model)

```javascript
const scores = await mbd.scoring()
  .model("/scoring/ranking_model/polymarket-rerank-v1")
  .execute()
mbd.addScores(scores, "ranking_model_polymarket_rerank_v1");
```

- Run the Polymarket rerank model: `/scoring/ranking_model/polymarket-rerank-v1`.
- `mbd.addScores(scores, "ranking_model_polymarket_rerank_v1")` attaches the model scores to each candidate.

### 5. Ranking (final ordering)

```javascript
const ranking = await mbd.ranking()
  .sortingMethod('mix')
  .mix("topic_score", 'desc', 40)
  .mix("user_affinity_score", 'desc', 40)
  .mix("rerank_polymkt1", 'desc', 20)
  .diversity('semantic')
  .lambda(0.5)
  .horizon(20)
  .limitByField()
  .every(10)
  .limit("cluster_1", 1)
  .execute()
mbd.addRanking(ranking);
```

- **Sorting:** `mix` — combine multiple signals with weights.
- **Mix weights:**
  - `topic_score` (desc) — 40%
  - `user_affinity_score` (desc) — 40%
  - `rerank_polymkt1` (desc) — 20%
- **Diversity:** `semantic` with `lambda = 0.5` — balance relevance and diversity.
- **Horizon:** 20 — consider top 20 items for diversity.
- **Limits:**
  - `limitByField().every(10).limit("cluster_1", 1)` — at most 1 item per cluster in every 10 results.

Result: a final ranked feed stored in the SDK context.

### 6. Output

```javascript
const feed = mbd.getFeed();
for (const item of feed.slice(0, 10)) {
  console.log(item._id, item._source.question, item._ranking_score);
}
```

- `mbd.getFeed()` returns the ranked candidates.
- The script prints the top 10: `_id`, `question`, and `_ranking_score`.

---

## Pipeline Overview

```
User context (wallet)
        ↓
   [Search] → candidates (filtered + boosted)
        ↓
  [Features] → topic_score, user_affinity_score, etc.
        ↓
  [Scoring] → rerank model scores
        ↓
  [Ranking] → mix + diversity + limits
        ↓
   Final feed (top 10 printed)
```
