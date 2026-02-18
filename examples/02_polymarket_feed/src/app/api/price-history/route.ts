import { NextRequest, NextResponse } from "next/server";

const GAMMA_API = "https://gamma-api.polymarket.com/markets";
const CLOB_API = "https://clob.polymarket.com/prices-history";

// In-memory caches (persist across requests in the dev server process)
const tokenCache = new Map<string, string>();
const historyCache = new Map<string, { data: { time: number; value: number }[]; ts: number }>();
const HISTORY_TTL = 5 * 60 * 1000; // 5 min

async function resolveTokenId(slug: string): Promise<string | null> {
  const cached = tokenCache.get(slug);
  if (cached) return cached;

  try {
    const res = await fetch(`${GAMMA_API}?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      let ids = item?.clobTokenIds ?? item?.clob_token_ids;
      // Gamma sometimes returns clobTokenIds as a JSON string
      if (typeof ids === "string") {
        try { ids = JSON.parse(ids); } catch { ids = null; }
      }
      if (Array.isArray(ids) && ids[0]) {
        tokenCache.set(slug, ids[0]);
        return ids[0];
      }
      // Check nested markets (events endpoint)
      if (item?.markets) {
        for (const m of item.markets) {
          let mids = m?.clobTokenIds ?? m?.clob_token_ids;
          if (typeof mids === "string") {
            try { mids = JSON.parse(mids); } catch { mids = null; }
          }
          if (Array.isArray(mids) && mids[0]) {
            tokenCache.set(slug, mids[0]);
            return mids[0];
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  // Check history cache (skip empty results)
  const cached = historyCache.get(slug);
  if (cached && cached.data.length > 0 && Date.now() - cached.ts < HISTORY_TTL) {
    return NextResponse.json({ history: cached.data });
  }

  try {
    const tokenId = await resolveTokenId(slug);
    if (!tokenId) {
      return NextResponse.json({ history: [] });
    }

    const clobRes = await fetch(
      `${CLOB_API}?market=${tokenId}&interval=1w&fidelity=60`,
      { cache: "no-store" }
    );

    if (!clobRes.ok) {
      return NextResponse.json({ history: [] });
    }

    const data = await clobRes.json();
    const history: { time: number; value: number }[] = (data.history ?? []).map(
      (p: { t: number; p: number }) => ({ time: p.t, value: p.p })
    );

    historyCache.set(slug, { data: history, ts: Date.now() });

    return NextResponse.json(
      { history },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Price history error:", error);
    return NextResponse.json({ history: [] });
  }
}
