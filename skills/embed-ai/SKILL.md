---
name: embed-ai
description: >
  Integrate Embed's ML-powered recommendation and personalization APIs into crypto applications
  (wallets, trading platforms, prediction market apps, social apps). Use when building personalized
  feeds, trader leaderboards, follow recommendations, smart notifications, or AI agent context
  using Embed's APIs. Covers two packages: @embed-ai/sdk (production feed serving, feed management,
  data ingestion) and mbd-studio-sdk (experimentation pipeline — search, features, scoring,
  ranking). Also covers direct REST API usage. Trigger when: code imports `@embed-ai/sdk`,
  `mbd-studio-sdk`, or user asks about Embed, onchain recommendations, personalized crypto feeds,
  or wallet-based recommendations.
---

# Embed Integration Skill

## What Embed Does

Embed provides ML-powered recommendation APIs for crypto apps. The core model (HRNN trained on 130M+ onchain interactions) ranks content per-user at 250ms inference. Cold start from 2 interactions.

Target user: a developer at a crypto app company (wallet, trading platform, prediction market app) integrating Embed's APIs.

## Two Packages, Two Purposes

### @embed-ai/sdk
**Production package.** Backend TypeScript API client for serving deployed feeds + managing feed configs + data ingestion. This is NOT a React/UI library — it's a server-side client. Frontend rendering requires your own components.
- Single endpoint: `POST /v3/for-you` with `feed_id` + user identifier
- Feed management CRUD (create, retrieve, delete configs, moderation/banning)
- Data ingestion (enterprise: create datasources, ingest items/users, track interactions)
- Install: `npm install @embed-ai/sdk`

### mbd-studio-sdk
**Experimentation package.** Build and iterate on recommendation pipelines.
- Four composable stages: Search -> Features -> Scoring -> Ranking
- Full control over filters, scoring models, diversity, deduplication
- Access to Elasticsearch indices: `polymarket-items`, `polymarket-wallets`, `farcaster-items`, `zora-coins`
- Install: `npm install mbd-studio-sdk`

### When to Use Which

| Goal | Package |
|------|---------|
| Ship a feed in production with minimal code | @embed-ai/sdk |
| Experiment with filters, scoring, ranking logic | mbd-studio-sdk |
| Manage feed configs programmatically | @embed-ai/sdk |
| Build a custom pipeline (search + enrich + score + rank) | mbd-studio-sdk |
| Ingest custom data (enterprise) | @embed-ai/sdk |

**Typical workflow:**
1. Describe the feed you want in natural language (in the Console's AI feed builder, or locally using the Embed skill)
2. AI generates pipeline code using mbd-studio-sdk (search filters, scoring, ranking)
3. Preview, iterate, deploy → get a `feed_id`
4. Serve in production with @embed-ai/sdk using that `feed_id`

## Authentication

Get your API key at https://console.getembed.ai

| API Surface | Base URL | Auth Header |
|-------------|----------|-------------|
| Studio (pipeline) | `https://api.getembed.ai/v3/studio` | `Authorization: Bearer {key}` |
| Feed Deployment | `https://api.getembed.ai/v3` | `Authorization: Bearer {key}` |
| Feed Management | `https://console.getembed.ai/api` | `Authorization: Basic {key}` |

## Quick Start: Serve a Feed (Production)

```typescript
import { getClient } from "@embed-ai/sdk";

const client = getClient(process.env.EMBED_API_KEY!);

// Serve a personalized feed by wallet address
const feed = await client.feed.byWalletAddress(
  "0xab2...e44",
  "your_feed_id",
  { top_k: 25, return_metadata: true }
);

feed.forEach((item) => {
  console.log(`${item.metadata?.question}: score ${item.score}`);
});
```

**Pagination:** Use `impression_count` param to mark N top items as seen. Must be < `top_k`.

## Quick Start: Build a Pipeline (Experimentation)

```javascript
import { StudioConfig, StudioV1 } from "mbd-studio-sdk";

const mbd = new StudioV1({ config: new StudioConfig({ apiKey: process.env.EMBED_API_KEY }) });

// Stage 1: Search — get candidates
const candidates = await mbd.search()
  .index("polymarket-items")
  .size(50)
  .include([
    { filter: "term", field: "active", value: true },
    { filter: "numeric", field: "volume_1wk", operator: ">=", value: 10000 }
  ])
  .exclude([{ filter: "term", field: "closed", value: true }])
  .execute();

// Stage 2: Features — enrich with signals
const features = await mbd.features()
  .user({ index: "polymarket-wallets", id: "0xf68a..." })
  .items(candidates.map(c => ({ index: "polymarket-items", id: c._id })))
  .execute();

// Stage 3: Scoring — apply ML reranking model
const scored = await mbd.scoring()
  .model("polymarket-rerank-v1")
  .userId("0xf68a...")
  .itemIds(candidates.map(c => c._id))
  .execute();

// Stage 4: Ranking — final ordering with diversity
const ranked = await mbd.ranking()
  .items(scored)
  .sort({ method: "mix", fields: [
    { field: "topic_score", percentage: 0.4 },
    { field: "affinity_score", percentage: 0.4 },
    { field: "rerank_score", percentage: 0.2 }
  ]})
  .diversity({ method: "semantic", lambda: 0.5 })
  .limitsByField({ field: "cluster_id", max: 1, window: 10 })
  .execute();
```

## API Reference

For detailed endpoint docs, parameters, and response schemas:

- **Feed serving & management endpoints:** See [references/feeds-api.md](references/feeds-api.md)
- **Pipeline endpoints (search, features, scoring, ranking):** See [references/algo-builder-api.md](references/algo-builder-api.md)
- **Working integration examples (Next.js, Python, cURL):** See [references/examples.md](references/examples.md)

## Common Patterns

### Next.js API Route for Feed Serving
Wrap @embed-ai/sdk in a server-side route. Keep API key server-side only (no client-side auth exists yet). See references/examples.md for full Next.js example.

### Polymarket Recommendation Feed
Use mbd-studio-sdk to search `polymarket-items`, enrich with features, score with `polymarket-rerank-v1`, rank with diversity. See references/examples.md.

### Prediction Market Discovery Feed
Use mbd-studio-sdk to search `polymarket-items` for active markets, score with `polymarket-rerank-v1` for personalization, and rank with diversity constraints. See references/examples.md.

## Important Constraints

- **No client-side auth yet.** All API keys are backend-only. Never expose keys in client code. Use server-side API routes.
- **Feed IDs are required** for @embed-ai/sdk. Get them from the Console or Feed Management API.
- **impression_count must be < top_k** or the API returns 422.
- **Polymarket field names:** Use `liquidity_num` (not `liquidity`), `ai_labels_med` (not `ai_labels`), `slug` (not `market_slug`).

## Resources

- Docs: https://docs.getembed.ai
- API Reference: https://docs.getembed.ai/reference
- Console: https://console.getembed.ai
- GitHub: https://github.com/ZKAI-Network/embed-developer
