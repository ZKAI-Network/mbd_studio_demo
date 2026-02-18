import { NextRequest, NextResponse } from "next/server";
import { createStudio } from "@/lib/studio";
import { transformHit } from "@/lib/mappers";
import { FeatureBet } from "@/types/market";

const SELECT_FIELDS = [
  "question", "description", "active", "liquidity", "liquidity_num",
  "volume_24hr", "spread", "best_ask", "last_trade_price", "end_date",
  "one_hour_price_change", "one_day_price_change", "one_week_price_change",
  "one_month_price_change", "ai_labels_med", "image", "slug", "outcomes",
  "outcome_prices", "tags",
];

function getDateRange(): [string, string] {
  const now = new Date();
  const from = new Date(now);
  from.setFullYear(from.getFullYear() - 1);
  const to = new Date(now);
  to.setFullYear(to.getFullYear() + 1);
  return [from.toISOString(), to.toISOString()];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      wallet,
      query,
      topics,
      sortField = "volume_24hr",
      sortOrder = "desc",
      size = 25,
    } = body;

    const mbd = createStudio(wallet);
    const [dateFrom, dateTo] = getDateRange();

    let bets: Record<string, FeatureBet[]> | null = null;
    let isPersonalized = false;

    if (wallet) {
      // --- Personalized pipeline: boost → features → scoring → ranking ---
      // includeVectors and selectFields are mutually exclusive — vectors needed for semantic diversity
      const search = mbd.search()
        .index("polymarket-items")
        .size(150)
        .includeVectors(true)
        .include()
          .term("active", true)
          .numeric("liquidity_num", ">", 5000)
          .numeric("volume_num", ">", 500)
          .numeric("volume_24hr", ">", 100)
          .date("end_date", dateFrom, dateTo)
        .exclude()
          .term("closed", true)
          .term("archived", true)
          .term("price_0_or_1", true)
        .boost()
          .groupBoost("polymarket-wallets", "ai_labels_med", wallet, "label", 1, 5, 5)
          .groupBoost("polymarket-wallets", "tags", wallet, "tag", 1, 3, 5);

      if (query) search.include().match("question", query);
      if (topics?.length) search.include().terms("ai_labels_med", topics);

      const candidates = await search.execute();
      mbd.addCandidates(candidates);

      try {
        // Features
        const features = await mbd.features("v1").execute();
        mbd.addFeatures(features);

        // Extract bets from features
        bets = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const featuresData = (features as any)?.data?.results ?? (features as any)?.results ?? [];
        for (const item of featuresData) {
          if (item.bets?.length) {
            bets[item.id ?? item._id] = item.bets;
          }
        }

        // Scoring
        const scores = await mbd.scoring()
          .model("/scoring/ranking_model/polymarket-rerank-v1")
          .execute();
        mbd.addScores(scores, "ranking_model_polymarket_rerank_v1");

        // Ranking
        const ranking = await mbd.ranking()
          .sortingMethod("mix")
          .mix("topic_score", "desc", 40)
          .mix("user_affinity_score", "desc", 40)
          .mix("rerank_polymkt1", "desc", 20)
          .diversity("semantic")
          .lambda(0.5)
          .horizon(20)
          .limitByField()
          .every(5)
          .limit("cluster_1", 2)
          .execute();
        mbd.addRanking(ranking);

        isPersonalized = true;
      } catch (e) {
        console.warn("Personalization fallback (features/scoring/ranking failed):", e);
        // Fall back to boost order
      }
    } else {
      // --- Unpersonalized pipeline: filter + sort ---
      const search = mbd.search()
        .index("polymarket-items")
        .size(size)
        .sortBy(sortField, sortOrder)
        .selectFields(SELECT_FIELDS)
        .include()
          .term("active", true)
          .numeric("liquidity_num", ">", 5000)
          .numeric("volume_num", ">", 500)
          .numeric("volume_24hr", ">", 100)
          .date("end_date", dateFrom, dateTo)
        .exclude()
          .term("closed", true)
          .term("archived", true)
          .term("price_0_or_1", true);

      if (query) search.include().match("question", query);
      if (topics?.length) search.include().terms("ai_labels_med", topics);

      const candidates = await search.execute();
      mbd.addCandidates(candidates);
    }

    const feed = mbd.getFeed();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hits = (feed as any)?.data?.hits ?? (feed as any)?.hits ?? (feed as any) ?? [];
    const markets = (Array.isArray(hits) ? hits : []).map(transformHit);

    return NextResponse.json({ markets, bets, isPersonalized });
  } catch (error) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      { error: "Pipeline failed", detail: String(error) },
      { status: 500 }
    );
  }
}
