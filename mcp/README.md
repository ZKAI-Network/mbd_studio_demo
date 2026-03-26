# Embed MCP Server

MCP server that exposes Embed's recommendation APIs as tools for AI agents.

## Tools

| Tool | Description |
|------|-------------|
| `get_personalized_feed` | Get a personalized feed for a user by wallet or Farcaster ID |
| `search_items` | Search indices with structured filters (term, numeric, date, etc.) |
| `semantic_search` | Natural language search across Embed's indices |

## Setup

```bash
npm install
```

Set your API key:

```bash
export EMBED_API_KEY=your-api-key
```

Get a key at [console.getembed.ai](https://console.getembed.ai).

## Usage with Claude Code

Add to your Claude Code MCP config (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "embed-ai": {
      "command": "node",
      "args": ["/path/to/embed-developer/mcp/index.js"],
      "env": {
        "EMBED_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage with Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "embed-ai": {
      "command": "node",
      "args": ["./mcp/index.js"],
      "env": {
        "EMBED_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Indices

| Index | Content |
|-------|---------|
| `polymarket-items` | Prediction markets |
| `polymarket-wallets` | Trader profiles |
| `farcaster-items` | Social posts |
| `zora-coins` | NFT coins/tokens |

## Available Feed IDs

| Feed ID | Content |
|---------|---------|
| `feed_390` | For You (general) |
| `feed_624` | Zora |
| `feed_625` | Short Form Video |
| `feed_626` | Miniapps |
| `feed_627` | New York |
| `feed_628` | Coinbase Wallet Creators |
| `feed_629` | Warpcast Creators |
