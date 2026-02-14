import 'dotenv/config';
import { StudioConfig, StudioV1 } from 'mbd-studio-sdk';

const apiKey = process.env.API_KEY;
const polymarketWallet = process.env.POLYMARKET_WALLET?.toLowerCase().trim();
if (!apiKey || !polymarketWallet) {
  throw new Error('API_KEY and POLYMARKET_WALLET must be set in .env file');
}

const config = new StudioConfig({ apiKey: apiKey });
const mbd = new StudioV1({ config });

const version = mbd.version();
mbd.log('Using mbd SDK version '+version);
mbd.forUser("polymarket-wallets", polymarketWallet);

const candidates = await mbd.search()
  .index("polymarket-items")
  .includeVectors(true)
  .include()
  .numeric("volume_1wk", ">=", 10000)
  .exclude()
  .term("closed", true)
  .term("price_under05_or_over95", true)
  .boost()
  .groupBoost("polymarket-wallets", "ai_labels_med", polymarketWallet, "label", 1, 5, 10)
  .groupBoost("polymarket-wallets", "tags", polymarketWallet, "tag", 1, 5, 10)
  .execute()
mbd.addCandidates(candidates);

const features = await mbd.features("v1")
  .execute()
mbd.addFeatures(features);

const scores = await mbd.scoring()
  .model("/scoring/ranking_model/polymarket-rerank-v1")
  .execute()
mbd.addScores(scores, "ranking_model_polymarket_rerank_v1");

const ranking = await mbd.ranking()
  .sortingMethod('mix')
  .mix("topic_score", 'desc', 40)
  .mix("user_affinity_score", 'desc', 40)
  .mix("rerank_polymkt1", 'desc', 20)
  .diversity('semantic')
  .lambda(0.5)
  .horizon(20)
  .limitByField()
  .every(10)
  .limit("cluster_1", 1)
  .execute()
mbd.addRanking(ranking);

const feed = mbd.getFeed();
for (const item of feed.slice(0, 10)) {
  console.log(item._id, item._source.question, item._ranking_score);
}
