# Embed Feeds API Reference

## Feed Deployment

### POST /v3/for-you
Base URL: `https://api.getembed.ai/v3`
Auth: `Authorization: Bearer {key}`

**Request:**
```json
{
  "feed_id": "feed_390",
  "user_id": "16085",
  "top_k": 25,
  "return_metadata": true,
  "impression_count": 0
}
```

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| feed_id | string | Yes | Feed config ID from Console |
| user_id | string | Conditional | Farcaster ID. Use this OR wallet_address |
| wallet_address | string | Conditional | Verified wallet. Use this OR user_id |
| top_k | integer | No | 1-500, default 25 |
| return_metadata | boolean | No | Include post text, author, labels. Default false |
| impression_count | integer | No | Mark N items as seen for pagination. Must be < top_k |

**Response item fields:**
- `item_id` — unique post/item identifier
- `score` — final ranking score
- `popular_score`, `trending_score`, `affinity_score`, `interest_score` — component scores
- `source_feed` — feed config that produced this result
- `social_proof` — network interaction data
- When `return_metadata: true`: `metadata.text`, `metadata.author.display_name`, `metadata.author.fid`, engagement counts, `metadata.ai_labels`

**Feed templates:**

| Feed ID | Content |
|---------|---------|
| feed_390 | For You (general) |
| feed_624 | Zora |
| feed_625 | Short Form Video |
| feed_626 | Miniapps |
| feed_627 | New York |
| feed_628 | Coinbase Wallet Creators |
| feed_629 | Warpcast Creators |

---

## Feed Management

Base URL: `https://console.getembed.ai/api`
Auth: `Authorization: Basic {key}`

### POST /feed-config — Create feed config
### GET /feed-config/{feed_id} — Get feed config
### DELETE /feed-config/{feed_id} — Delete feed config
### POST /feed-configs/list — List feed configs
### GET /feed-configs/public — List public feed configs

### Moderation

#### POST /feed-config/{feed_id}/ban-items — Ban items from feed
#### DELETE /feed-config/{feed_id}/ban-items — Unban items
#### GET /feed-config/{feed_id}/ban-items — List banned items
#### POST /feed-config/{feed_id}/ban-users — Ban users from feed
#### DELETE /feed-config/{feed_id}/ban-users — Unban users
#### GET /feed-config/{feed_id}/ban-users — List banned users

---

## Data Ingestion (Enterprise)

Base URL: `https://api.getembed.ai/v3`
Auth: `Authorization: Bearer {key}`

Requires enterprise data source ID. Contact hello@getembed.ai for access.

### POST /datasource — Create a new datasource
### POST /datasource/{id}/items — Ingest item data
### POST /datasource/{id}/users — Ingest user data
### POST /datasource/{id}/item-interactions — Track item interactions
### POST /datasource/{id}/user-interactions — Track user interactions
