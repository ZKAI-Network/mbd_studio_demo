# Embed Pipeline API Reference

Base URL: `https://api.getembed.ai/v3/studio`
Auth: `Authorization: Bearer {key}`

Four composable stages. Each can be used independently or chained.

---

## Stage 1: Search (Candidate Generation)

### POST /search/filter_and_sort
Structured queries with hard filters and field-based sorting.

```json
{
  "index": "polymarket-items",
  "size": 20,
  "sort_by": { "field": "volume_24hr", "order": "desc" },
  "include_vectors": false,
  "include": [
    { "filter": "term", "field": "active", "value": true },
    { "filter": "numeric", "field": "liquidity_num", "operator": ">", "value": 10000 }
  ],
  "exclude": [
    { "filter": "term", "field": "closed", "value": true }
  ],
  "select_fields": ["question", "liquidity_num", "volume_24hr"]
}
```

### POST /search/boost
Soft relevance tuning. Same filter interface but matching items get score multipliers instead of hard filtering. Supports `group_boost` for wallet-based personalization.

### POST /search/semantic
Text or vector similarity search. Accepts natural language query (min 5 chars) or 768-dim embedding vector. Cannot combine with include/exclude filters.

### GET /search/frequent_values
Discover available field values before building filters. Returns value IDs with counts.

### Available Indices

| Index | Content |
|-------|---------|
| polymarket-items | Prediction markets |
| polymarket-wallets | Trader profiles |
| farcaster-items | Social posts |
| zora-coins | NFT coins/tokens |

### Filter Types (12)

| Filter | Purpose | Example |
|--------|---------|---------|
| term | Exact match | `{ "filter": "term", "field": "active", "value": true }` |
| terms | OR match | `{ "filter": "terms", "field": "category", "value": ["sports", "politics"] }` |
| match | Full-text search | `{ "filter": "match", "field": "question", "value": "election" }` |
| numeric | Range comparison | `{ "filter": "numeric", "field": "volume", "operator": ">=", "value": 1000 }` |
| date | Date range | `{ "filter": "date", "field": "created", "date_from": "2024-01-01" }` |
| is_null | Field is null | `{ "filter": "is_null", "field": "resolved_at" }` |
| not_null | Field exists | `{ "filter": "not_null", "field": "ai_labels_med" }` |
| geo | Distance filter | Lat/lon + distance |
| custom | Raw ES query | Escape hatch for advanced queries |
| group_boost | Wallet personalization | Boost by wallet's interaction history |
| terms_lookup | Cross-doc matching | Join across indices |
| console_account | Account data match | Match against console account data |

**Filter logic:** (all include) AND NOT (any exclude). Boost uses SHOULD logic.

### Polymarket Field Gotchas
- Use `liquidity_num` not `liquidity`
- Use `ai_labels_med` not `ai_labels`
- Use `slug` not `market_slug`
- Exclude `closed`, `archived`, and `price_0_or_1` markets

---

## Stage 2: Features (Enrichment)

### POST /features/v1
Enrich candidates with user-item pair features.

```json
{
  "user": { "index": "polymarket-wallets", "id": "0xf68a..." },
  "items": [
    { "index": "polymarket-items", "id": "1289113" }
  ]
}
```

**Returns per item:**

| Feature | Description |
|---------|-------------|
| found | Item exists in index (0/1) |
| original_rank | Position from search (0-1) |
| sem_sim_closest | Best embedding similarity (0-1) |
| sem_sim_fuzzy | Loose semantic match (0-1) |
| sem_sim_1..5 | Individual embedding scores |
| usr_primary_labels | User label match fraction (0-1) |
| num_bets | Trading activity indicator (0/1) |
| bets | Array of recent trades (pseudonym, side, outcome, USDC, timestamp) |
| AI:{label} | Per-item AI label match |
| TAG:{tag} | Per-item tag match |
| topic_score | Pre-computed composite relevance (0-1) |

---

## Stage 3: Scoring (ML Reranking)

### POST /scoring/ranking_model/{model_name}

Available model: `polymarket-rerank-v1`

```json
{
  "user_id": "0xf68a...",
  "item_ids": ["1289113", "1288428", "1287500"]
}
```

Returns same item IDs reordered by the ML model's personalized ranking.

---

## Stage 4: Ranking (Final Ordering)

### POST /ranking/feed

Three-stage pipeline: sorting -> diversity -> field limits.

```json
{
  "items": [
    { "item_id": "1289113", "topic_score": 0.8, "affinity_score": 0.6, "rerank_score": 0.9 }
  ],
  "sort": {
    "method": "mix",
    "fields": [
      { "field": "topic_score", "percentage": 0.4 },
      { "field": "affinity_score", "percentage": 0.4 },
      { "field": "rerank_score", "percentage": 0.2 }
    ]
  },
  "diversity": {
    "method": "semantic",
    "lambda": 0.5
  },
  "limits_by_field": {
    "field": "cluster_id",
    "max": 1,
    "window": 10
  }
}
```

### Sort Methods

| Method | Purpose |
|--------|---------|
| sort | Multi-field ordering: `{ fields: [...], direction: [...] }` |
| linear | Weighted sum: `[{ field, weight }]` — WARNING: no normalization, large fields dominate |
| mix | Percentage interleaving: `[{ field, percentage, direction? }]` — recommended |

### Diversity Methods

| Method | Purpose |
|--------|---------|
| fields | Round-robin across categories |
| semantic | MMR-style. Requires embeddings. `lambda`: 0 = max diversity, 1 = max relevance |

### Limits by Field
Enforce caps within sliding windows. E.g., max 3 items with same category per 5-item window.

**Response:** Items in final order. Each gets a position score [0, 1] (first = 1.0, last = 0.0).

---

## Stories (Content Generation)

### POST /stories/generate
Generate narrative content from feed items. Details in docs.
