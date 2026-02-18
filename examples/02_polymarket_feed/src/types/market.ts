export interface Market {
  id: string;
  question: string;
  description: string;
  active: boolean;
  liquidity: number;
  volume24hr: number;
  spread: number;
  bestAsk: number;
  lastTradePrice: number;
  endDate: string;
  priceChange1hr: number | null;
  priceChange24hr: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  aiLabels: string[];
  image: string;
  slug: string;
  outcomes: string[];
  outcomePrices: number[];
  tags: string[];
}

export interface FeatureBet {
  user_pseudonym: string;
  side: string;
  outcome: string;
  usdc: number;
  price?: number;
  timestamp?: string;
}

export interface PipelineResponse {
  markets: Market[];
  bets: Record<string, FeatureBet[]> | null;
  isPersonalized: boolean;
}

export interface Story {
  type: string;
  title: string;
  body: string;
  market_id?: string;
  question?: string;
  image?: string;
  slug?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchParams {
  query?: string;
  topics?: string[];
  sortField?: string;
  sortOrder?: "asc" | "desc";
  minLiquidity?: number;
  size?: number;
  wallet?: string;
}
