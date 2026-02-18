// mbd-studio-sdk TypeScript declarations
// Generated from SDK source v1 — drop into the package as dist/index.d.ts

declare module "mbd-studio-sdk" {

  // ─── Configuration ───────────────────────────────────────────────

  export interface StudioConfigOptions {
    apiKey: string;
    commonUrl?: string;
    servicesUrl?: {
      searchService: string;
      storiesService: string;
      featuresService: string;
      scoringService: string;
      rankingService: string;
    };
    log?: (message: string) => void;
    show?: (results: unknown) => void;
  }

  export class StudioConfig {
    apiKey: string;
    searchService: string;
    storiesService: string;
    featuresService: string;
    scoringService: string;
    rankingService: string;
    log: (message: string) => void;
    show: (results: unknown) => void;

    constructor(options: StudioConfigOptions);
  }

  // ─── Search Hit Types ────────────────────────────────────────────

  /** A single document returned by a search query. */
  export interface SearchHit<TSource = Record<string, unknown>> {
    _id: string;
    _index: string;
    _score: number | null;
    _source: TSource;
    _vectors?: number[];
  }

  /** Enriched candidate after features/scoring/ranking have been applied. */
  export interface EnrichedCandidate<TSource = Record<string, unknown>> extends SearchHit<TSource> {
    features?: Record<string, unknown>;
    scores?: Record<string, number>;
    ranking?: { position: number };
  }

  // ─── Features Types ──────────────────────────────────────────────

  export interface FeatureBet {
    user_pseudonym: string;
    side: string;
    outcome: string;
    usdc: number;
    price?: number;
    timestamp?: string;
  }

  export interface FeatureItem {
    id: string;
    index: string;
    features: {
      sem_sim_closest?: number;
      sem_sim_fuzzy?: number;
      usr_primary_labels?: number;
      usr_secondary_labels?: number;
      usr_primary_tags?: number;
      usr_secondary_tags?: number;
      user_affinity_avg?: number;
      user_affinity_usdc?: number;
      user_affinity_count?: number;
      num_bets?: number;
      bets?: FeatureBet[];
      cluster_1?: string;
      cluster_2?: string;
      cluster_3?: string;
      cluster_4?: string;
      cluster_5?: string;
      [key: string]: unknown;
    };
    scores: {
      topic_score?: number;
      user_affinity_score?: number;
      [key: string]: number | undefined;
    };
  }

  export interface FeaturesResult {
    results: FeatureItem[];
    available_features: string[];
    took_backend?: number;
    took_sdk?: number;
  }

  // ─── Scoring Types ───────────────────────────────────────────────

  /** Scoring execute() returns an array of item ID strings, sorted by score. */
  export type ScoringResult = string[];

  // ─── Ranking Types ───────────────────────────────────────────────

  export interface RankingResultItem {
    id: string;
    index: string;
    position: number;
    [key: string]: unknown;
  }

  export interface RankingResult {
    items: RankingResultItem[];
    took_backend?: number;
    took_sdk?: number;
  }

  // ─── Filters ─────────────────────────────────────────────────────

  export class Filter {
    filter: string;
    field: string;
    boost: number | null;
    constructor(filterType: string, field: string, boost?: number | null);
  }

  export class TermFilter extends Filter {
    value: unknown;
    constructor(field: string, value: unknown, boost?: number | null);
  }

  export class TermsFilter extends Filter {
    value: unknown[];
    constructor(field: string, value: unknown[], boost?: number | null);
  }

  export class NumericFilter extends Filter {
    operator: string;
    value: number;
    constructor(field: string, operator: ">" | ">=" | "<" | "<=", value: number, boost?: number | null);
  }

  export class MatchFilter extends Filter {
    value: unknown;
    constructor(field: string, value: unknown, boost?: number | null);
  }

  export class DateFilter extends Filter {
    value: { date_from?: string; date_to?: string };
    constructor(field: string, dateFrom?: string | null, dateTo?: string | null, boost?: number | null);
  }

  export class GeoFilter extends Filter {
    value: unknown;
    constructor(field: string, value: unknown, boost?: number | null);
  }

  export class IsNullFilter extends Filter {
    constructor(field: string, boost?: number | null);
  }

  export class NotNullFilter extends Filter {
    constructor(field: string, boost?: number | null);
  }

  export class CustomFilter extends Filter {
    value: unknown;
    constructor(field: string, value: unknown, boost?: number | null);
  }

  export class GroupBoostFilter extends Filter {
    lookup_index: string;
    group: string;
    min_boost: number | null;
    max_boost: number | null;
    n: number | null;
    constructor(
      lookup_index: string,
      field: string,
      value: unknown,
      group: string,
      min_boost?: number | null,
      max_boost?: number | null,
      n?: number | null,
    );
  }

  export class TermsLookupFilter extends Filter {
    lookup_index: string;
    path: string;
    constructor(
      lookup_index: string,
      field: string,
      value: unknown,
      path: string,
      boost?: number | null,
    );
  }

  export class ConsoleAccountFilter extends Filter {
    path: string;
    constructor(field: string, value: unknown, path: string, boost?: number | null);
  }

  // ─── Search Builder ──────────────────────────────────────────────

  export class Search {
    lastCall: { endpoint: string; payload: unknown } | null;
    lastResult: unknown | null;

    constructor(options: {
      url: string;
      apiKey: string;
      origin?: string;
      log?: (message: string) => void;
      show?: (results: unknown) => void;
    });

    /** Set the index to search. */
    index(selected_index: string): this;

    /** Max results to return (1–1999). Default: 100. */
    size(size: number): this;

    /** Only return document IDs (no _source). Mutually exclusive with selectFields and includeVectors. */
    onlyIds(value?: boolean): this;

    /** Include embedding vectors in results. Mutually exclusive with selectFields and onlyIds. */
    includeVectors(value?: boolean): this;

    /** Only return these fields in _source. Mutually exclusive with includeVectors and onlyIds. */
    selectFields(fields: string[] | null): this;

    /** Set query text for semantic search. Triggers the /search/semantic endpoint. */
    text(text: string): this;

    /** Set query vector for semantic search. Triggers the /search/semantic endpoint. */
    vector(vector: number[]): this;

    /** Pass a raw Elasticsearch query object. Triggers the /search/es_query endpoint. */
    esQuery(rawQuery: Record<string, unknown>): this;

    /** Sort results by field. Only works with filter_and_sort (not boost). */
    sortBy(field: string, direction?: "asc" | "desc"): this;

    /** Activate the include filter chain (AND logic). */
    include(): this;

    /** Activate the exclude filter chain (NOT logic). */
    exclude(): this;

    /** Activate the boost filter chain (SHOULD logic). Triggers the /search/boost endpoint. */
    boost(): this;

    /** Add a custom Filter instance to the active chain. */
    filter(filterInstance: Filter): this;

    /** Exact term match filter. */
    term(field: string, value: unknown, boost?: number | null): this;

    /** Match any value in a list. */
    terms(field: string, values: unknown[], boost?: number | null): this;

    /** Numeric range filter. */
    numeric(field: string, operator: ">" | ">=" | "<" | "<=", value: number, boost?: number | null): this;

    /**
     * Date range filter. At least one of dateFrom or dateTo is required.
     * Uses positional arguments — NOT an object.
     *
     * @example .date("end_date", "2025-01-01T00:00:00Z", "2027-01-01T00:00:00Z")
     */
    date(field: string, dateFrom?: string | null, dateTo?: string | null, boost?: number | null): this;

    /** Geo filter. */
    geo(field: string, value: unknown, boost?: number | null): this;

    /** Full-text match filter. */
    match(field: string, value: unknown, boost?: number | null): this;

    /** Filter for fields that are null. */
    isNull(field: string, boost?: number | null): this;

    /** Filter for fields that are not null. */
    notNull(field: string, boost?: number | null): this;

    /** Custom filter with arbitrary value. */
    custom(field: string, value: unknown, boost?: number | null): this;

    /**
     * Dynamic personalization boost. Reads {group}_01..{group}_N from a
     * lookup document and applies linearly decreasing boost values.
     */
    groupBoost(
      lookup_index: string,
      field: string,
      value: unknown,
      group: string,
      min_boost?: number | null,
      max_boost?: number | null,
      n?: number | null,
    ): this;

    /** Terms lookup filter — matches against values from another index document. */
    termsLookup(
      lookup_index: string,
      field: string,
      value: unknown,
      path: string,
      boost?: number | null,
    ): this;

    /** Console account filter. */
    consoleAccount(field: string, value: unknown, path: string, boost?: number | null): this;

    /** Get the computed API endpoint based on current builder state. */
    getEndpoint(): string;

    /** Get the payload that will be sent to the API. */
    getPayload(): Record<string, unknown>;

    /** Execute the search and return hits. */
    execute(): Promise<SearchHit[]>;

    /** Get the most frequent values for a field in the index. */
    frequentValues(field: string, size?: number): Promise<unknown>;

    /** Look up a single document by ID. */
    lookup(docId: string): Promise<unknown>;
  }

  // ─── Features Builder ────────────────────────────────────────────

  export class Features {
    lastCall: { endpoint: string; payload: unknown } | null;
    lastResult: unknown | null;

    constructor(options: {
      url: string;
      apiKey: string;
      version?: string;
      items?: Array<{ index: string; id: string }>;
      userIndex?: string;
      userId?: string;
      origin?: string;
      log?: (message: string) => void;
      show?: (results: unknown) => void;
    });

    /** Set the features version (default: "v1"). */
    version(v: string): this;

    /** Set the items to compute features for. */
    items(items: Array<{ index: string; id: string }>): this;

    /** Set the user context for personalized features. */
    user(index: string, userId: string): this;

    /** Get the computed API endpoint. */
    getEndpoint(): string;

    /** Get the payload that will be sent to the API. */
    getPayload(): Record<string, unknown>;

    /** Execute and return features for all candidates. */
    execute(): Promise<FeaturesResult>;
  }

  // ─── Scoring Builder ─────────────────────────────────────────────

  export class Scoring {
    lastCall: { endpoint: string; payload: unknown } | null;
    lastResult: unknown | null;

    constructor(options: {
      url: string;
      apiKey: string;
      userId?: string | null;
      itemIds?: string[];
      origin?: string;
      log?: (message: string) => void;
      show?: (results: unknown) => void;
    });

    /** Set the scoring model endpoint (e.g. "/scoring/ranking_model/polymarket-rerank-v1"). */
    model(endpoint: string): this;

    /** Set the user ID for scoring. */
    userId(userId: string): this;

    /** Set the item IDs to score. */
    itemIds(itemIds: string[]): this;

    /** Get the computed API endpoint. */
    getEndpoint(): string;

    /** Get the payload that will be sent to the API. */
    getPayload(): Record<string, unknown>;

    /** Execute scoring and return item IDs sorted by score. */
    execute(): Promise<ScoringResult>;
  }

  // ─── Ranking Builder ─────────────────────────────────────────────

  export class Ranking {
    lastCall: { endpoint: string; payload: unknown } | null;
    lastResult: unknown | null;

    constructor(options: {
      url: string;
      apiKey: string;
      candidates?: unknown[];
      origin?: string;
      log?: (message: string) => void;
      show?: (results: unknown) => void;
    });

    /**
     * Set the sorting method.
     * - "sort": multi-field sort (use .sortBy())
     * - "linear": weighted sum (use .weight()) — WARNING: does not normalize
     * - "mix": interleave by percentage (use .mix())
     */
    sortingMethod(method: "sort" | "linear" | "mix"): this;

    /**
     * Sort by one or two fields. Only valid with sortingMethod("sort").
     * Supports an optional second sort field.
     */
    sortBy(
      field: string,
      direction?: "asc" | "desc",
      field2?: string,
      direction2?: "asc" | "desc",
    ): this;

    /** Add a weighted field. Only valid with sortingMethod("linear"). */
    weight(field: string, w: number): this;

    /** Interleave results by field percentage. Only valid with sortingMethod("mix"). */
    mix(field: string, direction: "asc" | "desc", percentage: number): this;

    /**
     * Set the diversity method.
     * - "fields": round-robin over groups (use .fields())
     * - "semantic": MMR-style using embeddings (use .lambda() and .horizon())
     */
    diversity(method: "fields" | "semantic"): this;

    /** Set diversity fields for round-robin. Only valid with diversity("fields"). */
    fields(arrayOrItem: string | string[]): this;

    /** Set the MMR horizon. Only valid with diversity("semantic"). Default: 20. */
    horizon(n: number): this;

    /** Set the MMR lambda (0–1). Only valid with diversity("semantic"). Default: 0.5. */
    lambda(value: number): this;

    /** Enable field-based limit constraints. */
    limitByField(): this;

    /** Set the window size for limit constraints. Must be >= 2. Default: 10. */
    every(n: number): this;

    /** Limit a field to at most `max` items per window. */
    limit(field: string, max: number): this;

    /** Set the candidates to rank. */
    candidates(candidates: unknown[]): this;

    /** Get the computed API endpoint. */
    getEndpoint(): string;

    /** Get the payload that will be sent to the API. */
    getPayload(): Record<string, unknown>;

    /** Execute ranking and return ordered results. */
    execute(): Promise<RankingResult>;
  }

  // ─── Main Studio Class ───────────────────────────────────────────

  export class StudioV1 {
    constructor(options: {
      config?: StudioConfig;
      apiKey?: string;
      commonUrl?: string;
      servicesUrl?: {
        searchService: string;
        storiesService: string;
        featuresService: string;
        scoringService: string;
        rankingService: string;
      };
      log?: (message: string) => void;
      show?: (results: unknown) => void;
      origin?: string;
    });

    /** Returns the SDK version string ("V1"). */
    version(): string;

    /** Set user context for personalized features, scoring, and boost search. */
    forUser(index: string, userId: string): void;

    /** Create a new Search builder. */
    search(): Search;

    /** Shortcut to get frequent values for a field in an index. */
    frequentValues(index: string, field: string, size?: number): Promise<unknown>;

    /** Store search results as candidates for the pipeline. */
    addCandidates(hits: SearchHit[]): void;

    /**
     * Create a new Features builder.
     * Automatically uses the user and candidates from previous steps.
     */
    features(version?: string): Features;

    /** Merge feature data into stored candidates. */
    addFeatures(featuresResult: FeaturesResult): void;

    /** Create a new Scoring builder. Automatically uses user and candidate IDs. */
    scoring(): Scoring;

    /** Apply scoring results to stored candidates. */
    addScores(scoringResult: ScoringResult, scoringKey: string): void;

    /** Create a new Ranking builder. Automatically uses stored candidates. */
    ranking(): Ranking;

    /** Apply ranking results to stored candidates (reorders them). */
    addRanking(rankingResult: RankingResult): void;

    /** Get the final feed — the stored candidates array in their current order. */
    getFeed(): EnrichedCandidate[];

    /** Log a message using the configured logger. */
    log(message: string): void;

    /** Display results using the configured show function. */
    show(results?: unknown): void;
  }
}
