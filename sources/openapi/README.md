# OpenAPI Spec Reference

The canonical OpenAPI spec is served live and should always be fetched from:

- **Raw YAML:** https://api.mbd.xyz/v3/studio/frontend/open_api_specs/openapi.yaml
- **Interactive viewer:** https://api.mbd.xyz/v3/studio/frontend/open_api_specs/
- **Base URL:** https://api.mbd.xyz/v3/studio
- **Auth:** Bearer token via `authorization` header

The spec source lives in the `ds_frontend` repo (frontend deployment serves it).
This file is a pointer, not a copy — always fetch the live spec for the latest endpoints.

## Endpoints (as of 2026-03-25)

### Search
- POST /search/filter_and_sort
- POST /search/boost
- POST /search/semantic
- GET  /search/frequent_values/{index}/{field}
- POST /search/es_query
- POST /search/ai_prompt
- GET  /search/document/{index}/{docId}
- POST /search/locations

### Features
- POST /features/v1

### Scoring
- POST /scoring/ranking_model/{model_name}

### Ranking
- POST /ranking/feed

### Stories
- POST /stories/generate

### Algo Builder
- POST /algo/validate
- POST /algo/compose
- POST /algo/help

### Feed Builder
- POST /feed/run

### Deploy
- GET/POST /deploy/algos
- GET/PUT/DELETE /deploy/algos/{id}
- GET/POST /deploy/configs
- GET/PUT/DELETE /deploy/configs/{id}
