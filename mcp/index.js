#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.EMBED_API_KEY;
const STUDIO_BASE = process.env.EMBED_STUDIO_URL || "https://api.mbd.xyz/v3/studio";
const FEED_BASE = process.env.EMBED_FEED_URL || "https://api.mbd.xyz/v3";

if (!API_KEY) {
  console.error("EMBED_API_KEY environment variable is required");
  process.exit(1);
}

// --- HTTP helpers ---

async function studioPost(endpoint, body) {
  const url = `${STUDIO_BASE}${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

async function feedPost(endpoint, body) {
  const url = `${FEED_BASE}${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

// --- MCP Server ---

const server = new McpServer({
  name: "embed-ai",
  version: "0.1.0",
});

// Tool 1: get_personalized_feed
server.tool(
  "get_personalized_feed",
  "Get a personalized recommendation feed for a user. Returns ranked items with scores. Use feed_id to select the feed type (e.g. feed_390 for general, feed_624 for Zora, feed_625 for short video). Identify the user by wallet_address OR user_id (Farcaster ID).",
  {
    feed_id: z.string().describe("Feed config ID (e.g. 'feed_390'). Get available feeds from list_feed_configs."),
    wallet_address: z.string().optional().describe("User's wallet address for personalization. Use this OR user_id."),
    user_id: z.string().optional().describe("Farcaster user ID. Use this OR wallet_address."),
    top_k: z.number().int().min(1).max(500).default(25).describe("Number of items to return (1-500, default 25)"),
    return_metadata: z.boolean().default(true).describe("Include item text, author info, labels (default true)"),
    impression_count: z.number().int().min(0).default(0).describe("Mark N top items as seen for pagination. Must be < top_k."),
  },
  async ({ feed_id, wallet_address, user_id, top_k, return_metadata, impression_count }) => {
    if (!wallet_address && !user_id) {
      return { content: [{ type: "text", text: "Error: provide either wallet_address or user_id" }] };
    }
    if (impression_count >= top_k) {
      return { content: [{ type: "text", text: "Error: impression_count must be less than top_k" }] };
    }
    try {
      const body = { feed_id, top_k, return_metadata, impression_count };
      if (wallet_address) body.wallet_address = wallet_address;
      if (user_id) body.user_id = user_id;
      const result = await feedPost("/for-you", body);
      const items = result.body || result.result || result;
      const summary = Array.isArray(items)
        ? `${items.length} items returned`
        : "Feed response received";
      return {
        content: [{ type: "text", text: `${summary}\n\n${JSON.stringify(items, null, 2)}` }],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// Tool 2: search_items
server.tool(
  "search_items",
  "Search Embed's indices with structured filters. Use for finding items by field values (e.g. active markets with high volume). Supports include/exclude filters and field-based sorting. Available indices: polymarket-items, polymarket-wallets, farcaster-items, zora-coins.",
  {
    index: z.string().describe("Index to search (e.g. 'polymarket-items', 'farcaster-items', 'zora-coins')"),
    size: z.number().int().min(1).max(500).default(20).describe("Number of results (1-500, default 20)"),
    include: z
      .array(
        z.object({
          filter: z.string().describe("Filter type: term, terms, numeric, match, date, is_null, not_null, geo, custom"),
          field: z.string().describe("Field name to filter on"),
          value: z.any().optional().describe("Filter value (type depends on filter)"),
          operator: z.string().optional().describe("For numeric filters: >=, <=, >, <, ="),
        })
      )
      .default([])
      .describe("Include filters — items must match ALL"),
    exclude: z
      .array(
        z.object({
          filter: z.string().describe("Filter type"),
          field: z.string().describe("Field name"),
          value: z.any().optional().describe("Filter value"),
          operator: z.string().optional().describe("For numeric filters"),
        })
      )
      .default([])
      .describe("Exclude filters — items matching ANY are removed"),
    sort_by: z
      .object({
        field: z.string(),
        order: z.enum(["asc", "desc"]).default("desc"),
      })
      .optional()
      .describe("Sort results by a field"),
    select_fields: z
      .array(z.string())
      .optional()
      .describe("Only return these fields (reduces response size)"),
    include_vectors: z.boolean().default(false).describe("Include embedding vectors in response"),
  },
  async ({ index, size, include, exclude, sort_by, select_fields, include_vectors }) => {
    try {
      const body = {
        index,
        size,
        include_vector: include_vectors,
        include,
        exclude,
        feed_type: "filter_and_sort",
        origin: "mcp",
      };
      if (sort_by) body.sort_by = sort_by;
      if (select_fields) body.select_fields = select_fields;
      const result = await studioPost("/search/filter_and_sort", body);
      const hits = result.result?.hits || [];
      return {
        content: [
          {
            type: "text",
            text: `${hits.length} results from ${index} (total: ${result.result?.total_hits || "?"})\n\n${JSON.stringify(hits, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// Tool 3: semantic_search
server.tool(
  "semantic_search",
  "Search Embed's indices using natural language or embedding vectors. Returns items ranked by semantic similarity. Great for finding items related to a topic or concept. Available indices: polymarket-items, farcaster-items, zora-coins.",
  {
    index: z.string().describe("Index to search (e.g. 'polymarket-items', 'farcaster-items')"),
    text: z.string().optional().describe("Natural language query (min 5 chars). Use this OR vector."),
    vector: z.array(z.number()).optional().describe("768-dim embedding vector. Use this OR text."),
    size: z.number().int().min(1).max(500).default(20).describe("Number of results (1-500, default 20)"),
    select_fields: z.array(z.string()).optional().describe("Only return these fields"),
    include_vectors: z.boolean().default(false).describe("Include embedding vectors in response"),
  },
  async ({ index, text, vector, size, select_fields, include_vectors }) => {
    if (!text && !vector) {
      return { content: [{ type: "text", text: "Error: provide either text or vector" }] };
    }
    try {
      const body = {
        index,
        size,
        include_vector: include_vectors,
        feed_type: "semantic",
        origin: "mcp",
      };
      if (text) body.text = text;
      if (vector) body.vector = vector;
      if (select_fields) body.select_fields = select_fields;
      const result = await studioPost("/search/semantic", body);
      const hits = result.result?.hits || [];
      return {
        content: [
          {
            type: "text",
            text: `${hits.length} semantic results from ${index}\n\n${JSON.stringify(hits, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
