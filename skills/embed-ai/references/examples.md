# Embed Integration Examples

## Next.js App with Personalized Feed

### Server-side API Route

```typescript
// app/api/feed/route.ts
import { getClient } from "@embed-ai/sdk";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");
  const feedId = searchParams.get("feedId") || "feed_390";

  if (!fid) {
    return NextResponse.json({ error: "fid is required" }, { status: 400 });
  }

  const client = getClient(process.env.EMBED_API_KEY!);
  const feed = await client.feed.byUserId(fid, feedId, {
    top_k: 25,
    return_metadata: true,
  });

  return NextResponse.json({ feed });
}
```

### Client Component

```typescript
"use client";
import { useEffect, useState } from "react";

interface FeedItem {
  item_id: string;
  score: number;
  metadata?: {
    text: string;
    author: { display_name: string; fid: string };
  };
}

export function Feed({ fid }: { fid: string }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/feed?fid=${fid}`)
      .then((res) => res.json())
      .then((data) => setFeed(data.feed))
      .finally(() => setLoading(false));
  }, [fid]);

  if (loading) return <div>Loading feed...</div>;

  return (
    <div>
      {feed.map((item) => (
        <div key={item.item_id}>
          <strong>{item.metadata?.author.display_name}</strong>
          <p>{item.metadata?.text}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Python: Fetch Personalized Feed

```python
import os
import requests

response = requests.post(
    "https://api.getembed.ai/v3/for-you",
    headers={
        "Authorization": f"Bearer {os.environ['EMBED_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "feed_id": "feed_390",
        "user_id": "16085",
        "top_k": 25,
        "return_metadata": True,
    },
)

for item in response.json():
    author = item.get("metadata", {}).get("author", {}).get("display_name", "Unknown")
    text = item.get("metadata", {}).get("text", "")[:100]
    print(f"{author}: {text}")
```

---

## Python: Feed by Wallet Address

```python
response = requests.post(
    "https://api.getembed.ai/v3/for-you",
    headers={
        "Authorization": f"Bearer {os.environ['EMBED_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "feed_id": "feed_390",
        "wallet_address": "0xf68a281980f8c13828e84e147e3822381d6e5b1b",
        "top_k": 25,
    },
)
```

---

## cURL: Quick Test

```bash
curl -X POST https://api.getembed.ai/v3/for-you \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "feed_id": "feed_390",
    "user_id": "16085",
    "top_k": 10,
    "return_metadata": true
  }'
```

---

## Polymarket Recommendation Pipeline

Full pipeline: search trending markets -> enrich with user features -> ML rerank -> diversified output.

```javascript
import { StudioConfig, StudioV1 } from "mbd-studio-sdk";

const apiKey = process.env.EMBED_API_KEY;
const wallet = process.env.POLYMARKET_WALLET;
const mbd = new StudioV1({ config: new StudioConfig({ apiKey }) });

// 1. Search: Active markets with volume
const candidates = await mbd.search()
  .index("polymarket-items")
  .size(50)
  .includeVectors(true)
  .include([
    { filter: "term", field: "active", value: true },
    { filter: "numeric", field: "volume_1wk", operator: ">=", value: 10000 },
  ])
  .exclude([
    { filter: "term", field: "closed", value: true },
    { filter: "term", field: "archived", value: true },
    { filter: "numeric", field: "best_bid", operator: ">=", value: 0.95 },
  ])
  .execute();

// 2. Features: Enrich with user-item signals
const enriched = await mbd.features()
  .user({ index: "polymarket-wallets", id: wallet })
  .items(candidates.map(c => ({ index: "polymarket-items", id: c._id })))
  .execute();

// 3. Scoring: ML reranking model
const scored = await mbd.scoring()
  .model("polymarket-rerank-v1")
  .userId(wallet)
  .itemIds(candidates.map(c => c._id))
  .execute();

// 4. Ranking: Weighted mix + semantic diversity
const feed = await mbd.ranking()
  .items(scored)
  .sort({
    method: "mix",
    fields: [
      { field: "topic_score", percentage: 0.4 },
      { field: "user_affinity_score", percentage: 0.4 },
      { field: "rerank_score", percentage: 0.2 },
    ],
  })
  .diversity({ method: "semantic", lambda: 0.5 })
  .limitsByField({ field: "cluster_id", max: 1, window: 10 })
  .execute();

console.log(`Top ${feed.length} personalized markets:`);
feed.forEach((item, i) => {
  console.log(`${i + 1}. ${item._source.question} (score: ${item.score})`);
});
```

---

## cURL: Studio Search API (No SDK)

```bash
curl -X POST https://api.getembed.ai/v3/studio/search/filter_and_sort \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "index": "polymarket-items",
    "size": 10,
    "sort_by": { "field": "volume_24hr", "order": "desc" },
    "include": [
      { "filter": "term", "field": "active", "value": true }
    ],
    "select_fields": ["question", "volume_24hr", "liquidity_num"]
  }'
```

---

## Pagination with Impression Tracking

```typescript
import { getClient } from "@embed-ai/sdk";

const client = getClient(process.env.EMBED_API_KEY!);

// First page
const page1 = await client.feed.byUserId("16085", "feed_390", {
  top_k: 25,
  impression_count: 0,
});

// Second page — mark first 25 as seen
const page2 = await client.feed.byUserId("16085", "feed_390", {
  top_k: 25,
  impression_count: 25,
});
```

Note: `impression_count` must be strictly less than `top_k` or the API returns 422.
