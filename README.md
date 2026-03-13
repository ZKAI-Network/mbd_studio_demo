# Embed

**[Embed](https://getembed.ai/)** makes your wallet, agent, or social app feel more personal with AI-powered recommendations. Deliver real-time, personalized feeds for content, swaps, and bets — directly inside your app, via one simple API. Built for low spam, high signal.

---

## For AI Agents

Install the Embed skill to give your AI agent access to on-chain intelligence:

```
/plugin install embed-ai
```

Or point any LLM at our machine-readable reference:

```
curl https://getembed.ai/llms.txt
```

---

## Links

| Resource | URL |
|----------|-----|
| **Embed website** | [getembed.ai](https://getembed.ai/) |
| **Documentation** | [docs.getembed.ai](https://docs.getembed.ai) |
| **Console** | [console.getembed.ai](https://console.getembed.ai) |
| **SDK (npm)** | [@embed-ai/sdk](https://www.npmjs.com/package/@embed-ai/sdk) |
| **Pipeline SDK (npm)** | [mbd-studio-sdk](https://www.npmjs.com/package/mbd-studio-sdk) |

---

## Packages

### @embed-ai/sdk — Production
Serve deployed feeds, manage configs, ingest data. Single endpoint: `POST /v3/for-you`.

```bash
npm install @embed-ai/sdk
```

### mbd-studio-sdk — Experimentation
Build recommendation pipelines: Search → Features → Scoring → Ranking.

```bash
npm install mbd-studio-sdk
```

---

## Examples

- **[01 — Getting Started](examples/01_getting_started/)** — Polymarket recommendations demo: search → features → scoring → ranking pipeline
- **[02 — Polymarket Feed](examples/02_polymarket_feed/)** — Full-stack Next.js app with personalized Polymarket prediction market feed, real-time charts, and wallet-based recommendations

---

## Plugin Structure

This repo is also an installable Claude Code plugin:

```
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── skills/
│   └── embed-ai/
│       ├── SKILL.md             # What the AI agent learns
│       └── references/          # API docs, examples
├── llms.txt                     # Machine-readable reference for any LLM
└── examples/                    # Working demos
```

---

## License

MIT
