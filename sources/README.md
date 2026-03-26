# Sources of Truth

This directory consolidates references and prompts for all Embed developer-facing content.
It is the canonical hub that DevEx automation agents read from.

## Directory Structure

```
sources/
├── README.md                              ← this file
├── openapi/
│   └── README.md                          ← pointer to live OpenAPI spec + endpoint inventory
└── llms-prompts/
    ├── app-llms-prompt.txt                ← prompt for generating the app llms.txt (from ds_frontend)
    └── app-llms-generated.txt             ← last generated app llms.txt output (from ds_frontend)
```

## What lives where

| Source | Canonical location | How agents access it |
|--------|-------------------|---------------------|
| OpenAPI spec | Served live at api.mbd.xyz | Fetch YAML from URL |
| SDK llms.txt | `embed-developer/llms.txt` (this repo, root) | Read directly |
| App llms.txt | `ds_frontend/app/llms.txt` (copy here at `llms-prompts/app-llms-generated.txt`) | Read from this repo |
| llms.txt generation prompt | `ds_frontend/app/llms.prompt.txt` (copy here at `llms-prompts/app-llms-prompt.txt`) | Read from this repo |
| SDK source | `ds_frontend/packages/mbd-studio-sdk` | Fetch from npm or GitHub |
| Examples | `embed-developer/examples/` (this repo) | Read directly |
| Claude skill | `embed-developer/skills/embed-ai/` (this repo) | Read directly |
| MCP server | `embed-developer/mcp/` (this repo) | Read directly |

## Originals are NOT deleted

Files copied here from ds_frontend are copies — the originals remain in ds_frontend.
If the original changes, re-copy it here (or let the devex-examples-agent handle it).
