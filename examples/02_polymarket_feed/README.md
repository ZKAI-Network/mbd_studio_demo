# Polymarket Feed — Personalized Prediction Markets App

A full-stack Next.js app that builds a personalized Polymarket prediction market feed using the [Embed Studio SDK](https://www.npmjs.com/package/mbd-studio-sdk). Enter a wallet address and the feed reorders based on that wallet's trading history — a crypto trader sees crypto markets first, but with sports, politics, and science mixed in for diversity.

**Stack:** Next.js App Router, TypeScript, Tailwind CSS 4, TanStack Query, Framer Motion, `mbd-studio-sdk`, `liveline`

---

## What it does

Market cards show YES/NO prices, real price charts with crosshair scrubbing, 24h volume, liquidity, spreads, AI-generated topic labels, and recent trader activity. The main grid is a responsive layout (1–3 columns) with search, topic filtering, and sort controls.

When a wallet is connected, the feed becomes personalized through a 4-stage pipeline:

1. **Search** — Filter active markets by liquidity, volume, and date range. Boost results by the wallet's preferred topics and tags using `groupBoost`.
2. **Features** — Compute ML signals: semantic similarity to user interests, label matching, recent trader bets.
3. **Scoring** — Rerank candidates with a trained model that considers the full user profile and item features.
4. **Ranking** — Apply semantic diversity (MMR) so the feed isn't dominated by one topic. Cluster limits prevent runs of identical subtopics.

---

## Install

```bash
npm install
```

---

## Configure

Create a `.env.local` file in this directory:

```env
MBD_API_KEY=your-mbd-api-key
```

| Variable | Description |
|----------|-------------|
| `MBD_API_KEY` | Your Embed Studio API key ([get one here](https://console.mbd.xyz)) |

---

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter a Polymarket wallet address to activate personalization.

---

## Pipeline overview

```
Wallet address (optional)
        ↓
   [Search] → 150 candidates (filtered + boosted by wallet interests)
        ↓
  [Features] → topic_score, user_affinity_score, trader bets
        ↓
  [Scoring] → rerank model (polymarket-rerank-v1)
        ↓
  [Ranking] → mix (40% topic + 40% affinity + 20% rerank)
              + semantic diversity (λ=0.5)
              + cluster limits (max 2 per cluster in every 5 results)
        ↓
   Personalized feed
```

The core pipeline code lives in [`src/app/api/pipeline/route.ts`](src/app/api/pipeline/route.ts). The SDK helper is in [`src/lib/studio.ts`](src/lib/studio.ts).

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # Main page — orchestrates wallet, search, and grid
│   ├── layout.tsx               # Root layout with fonts and providers
│   └── api/
│       ├── pipeline/route.ts    # Search → features → scoring → ranking pipeline
│       ├── price-history/route.ts  # Polymarket CLOB price history
│       └── stories/route.ts     # Story generation endpoint
├── components/
│   ├── MarketCard.tsx           # Market card with prices, chart, stats, trader bets
│   ├── MarketGrid.tsx           # Responsive grid layout
│   ├── SearchBar.tsx            # Search + topic filters + sort controls
│   ├── WalletInput.tsx          # Wallet address input with validation
│   └── ...
├── hooks/                       # React Query hooks for pipeline, prices, wallet
├── lib/
│   ├── studio.ts                # SDK initialization + user context
│   ├── mappers.ts               # Transform Elasticsearch hits → typed Market objects
│   ├── sparkline.ts             # Synthetic sparkline fallback
│   └── format.ts                # Display formatting (currency, time, etc.)
└── types/                       # TypeScript interfaces
```

---

## Key concepts

- **Boost search vs. filter/sort** — Without a wallet, markets are filtered and sorted by volume. With a wallet, `groupBoost` reads the wallet's top labels/tags and applies relevance-based ordering instead.
- **Pool size** — 150 candidates are fetched (not 25) to give ranking enough variety to diversify across subtopics while keeping relevance high.
- **Semantic diversity** — MMR balances relevance against similarity to already-selected items. `lambda=0.5` is a good default.
- **Price charts** — Real sparklines from Polymarket's CLOB API via `liveline`, with synthetic fallback for markets without data.

---

## Links

- [Embed Console](https://console.mbd.xyz) — Sign up and get your API key
- [Embed Studio SDK on npm](https://www.npmjs.com/package/mbd-studio-sdk)
- [Embed website](https://getembed.ai/)
- [Example 01 — Getting Started](../01_getting_started/) — Minimal script version of the pipeline
