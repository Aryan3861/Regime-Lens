
export const API_CONFIG = {
  useLiveBackend: true, // Toggle to true when FastAPI server is mounted at baseUrl
  baseUrl: "/api",
  simulatedLatencyMs: 0
};

/**
 * Primary Benchmark & Multi-Asset Intelligence Dataset
 * Mirrors FastAPI endpoints:
 *   GET /api/market?symbol=SPX
 *   GET /api/regime?symbol=SPX
 *   GET /api/why?symbol=SPX
 *   GET /api/what-changed?symbol=SPX
 *   GET /api/risk?symbol=SPX
 *   GET /api/watchlist
 */
export const marketData = {
  symbol: "SPX",
  name: "S&P 500",
  price: 6481.52,
  change: 1.24,
  direction: "up",
  marketStatus: "Market Open",
  lastUpdated: "09:42:18",

  regime: {
    current: "Value-Driven",
    key: "value",
    confidence: 0.91,
    probabilities: {
      value: 0.91,
      hype: 0.06,
      panic: 0.03
    },
    story: {
      headline: "The market is currently Value-Driven.",
      narrative:
        "Momentum remains positive while volatility is relatively controlled. Sentiment has improved over recent sessions, suggesting the current move is supported rather than purely speculative.",
      watch:
        "An increase in volatility combined with deteriorating sentiment could indicate a regime transition."
    },
    flowPillars: [
      { name: "MOMENTUM", state: "HIGH", tone: "value" },
      { name: "SENTIMENT", state: "POSITIVE", tone: "value" },
      { name: "VOLATILITY", state: "LOW", tone: "controlled" }
    ]
  },

  transitionAlert: {
    active: true,
    from: "VALUE-DRIVEN",
    to: "HYPE",
    sectorScope: "Semiconductor & AI Leaders (NVDA, AMD)",
    confidence: 0.84,
    detectedAgo: "12 minutes ago",
    primaryDriver: "Momentum acceleration"
  },

  drivers: [
    {
      name: "Momentum",
      value: 0.88,
      magnitude: "HIGH",
      direction: "positive",
      arrow: "↑",
      interpretation:
        "Strong upward momentum is contributing to the current Value-Driven classification.",
      technical: { zScore: "+1.94σ", weight: "0.28", window: "20D / 60D ROC" }
    },
    {
      name: "20D Return",
      value: 0.78,
      magnitude: "HIGH",
      direction: "positive",
      arrow: "↑",
      interpretation:
        "Sustained 20-day price appreciation confirms broad institutional participation.",
      technical: { zScore: "+1.62σ", weight: "0.22", window: "20D Rolling" }
    },
    {
      name: "Sentiment",
      value: 0.64,
      magnitude: "POSITIVE",
      direction: "positive",
      arrow: "↑",
      interpretation:
        "Sentiment has improved steadily without reaching extreme speculative euphoria.",
      technical: { zScore: "+0.89σ", weight: "0.19", window: "Options Put/Call + Flow" }
    },
    {
      name: "Volatility",
      value: 0.32,
      magnitude: "LOW",
      direction: "controlled",
      arrow: "↓",
      interpretation:
        "Realized and implied volatility remain contained below historical stress thresholds.",
      technical: { zScore: "-0.74σ", weight: "0.17", window: "14D ATR / VIX Term" }
    },
    {
      name: "Price vs MA50",
      value: 0.71,
      magnitude: "ELEVATED",
      direction: "elevated",
      arrow: "↑",
      interpretation:
        "Price trades comfortably above its 50-day moving average with healthy market breadth.",
      technical: { zScore: "+1.38σ", weight: "0.14", window: "50D SMA Spread" }
    }
  ],

  whatChanged: {
    deltas: [
      { name: "Momentum", change: "+14.2%", arrow: "↑", tone: "up", period: "vs 5D avg" },
      { name: "Sentiment", change: "+8.7%", arrow: "↑", tone: "up", period: "vs 5D avg" },
      { name: "Volume", change: "+21.4%", arrow: "↑", tone: "up", period: "vs 20D avg" },
      { name: "Volatility", change: "-6.3%", arrow: "↓", tone: "up", period: "realized 10D" }
    ],
    regimePressure: {
      value: 72,
      hype: 38,
      panic: 14
    },
    summary: "Market conditions remain stable. Momentum is strengthening while volatility continues to compress."
  },

  risk: {
    score: 42,
    max: 100,
    label: "MODERATE-LOW",
    summary: "Systemic drawdown risk remains contained; monitor sentiment expansion in growth leaders.",
    factors: [
      { name: "Volatility", level: "LOW", tone: "value", score: 28 },
      { name: "Drawdown", level: "LOW", tone: "value", score: 22 },
      { name: "Volume", level: "MEDIUM", tone: "warning", score: 54 },
      { name: "Sentiment", level: "HIGH", tone: "hype", score: 71 }
    ]
  },

  modelMetadata: {
    architecture: "Hidden Markov + Gradient Boosted Regime Ensemble (v4.2)",
    lookbackHorizon: "252 Trading Days + Intraday Cross-Asset Flow",
    ensembleAgreement: "94.2% across 12 sub-models",
    transitionEntropy: "0.184 (Low regime ambiguity)",
    recalibrationTimestamp: "2026-09-29 09:30:00 EST"
  }
};

/**
 * Multi-Instrument Registry (Mini Market Cards + Watchlist Instruments)
 * Selecting any instrument updates the entire intelligence dashboard
 */
export const instrumentsCatalog = {
  SPX: {
    symbol: "SPX",
    name: "S&P 500",
    category: "Index",
    price: 6481.52,
    change: 1.24,
    regime: "Value-Driven",
    regimeKey: "value",
    confidence: 0.91,
    probabilities: { value: 0.91, hype: 0.06, panic: 0.03 },
    riskLevel: "LOW",
    riskScore: 42,
    trend: "↑",
    sparkline: [6390, 6405, 6398, 6422, 6435, 6448, 6460, 6481.52],
    story: {
      headline: "The market is currently Value-Driven.",
      narrative:
        "Momentum remains positive while volatility is relatively controlled. Sentiment has improved over recent sessions, suggesting the current move is supported rather than purely speculative.",
      watch:
        "An increase in volatility combined with deteriorating sentiment could indicate a regime transition."
    },
    flowPillars: [
      { name: "MOMENTUM", state: "HIGH", tone: "value" },
      { name: "SENTIMENT", state: "POSITIVE", tone: "value" },
      { name: "VOLATILITY", state: "LOW", tone: "controlled" }
    ],
    drivers: marketData.drivers,
    whatChanged: marketData.whatChanged,
    risk: marketData.risk
  },

  NDX: {
    symbol: "NDX",
    name: "NASDAQ",
    category: "Index",
    price: 21492.80,
    change: 1.68,
    regime: "Hype",
    regimeKey: "hype",
    confidence: 0.84,
    probabilities: { value: 0.14, hype: 0.84, panic: 0.02 },
    riskLevel: "MED",
    riskScore: 58,
    trend: "↑",
    sparkline: [20980, 21040, 21120, 21205, 21290, 21380, 21440, 21492.80],
    story: {
      headline: "NASDAQ is currently in a Hype regime.",
      narrative:
        "Sentiment is becoming unusually optimistic across mega-cap AI and semiconductor components. Price acceleration is outpacing fundamental earnings revisions, driven by aggressive call-option positioning.",
      watch:
        "Watch for exhaustion gaps or a spike in short-dated implied volatility as early signs of momentum mean-reversion."
    },
    flowPillars: [
      { name: "MOMENTUM", state: "EXTREME", tone: "hype" },
      { name: "SENTIMENT", state: "EUPHORIC", tone: "hype" },
      { name: "VOLATILITY", state: "RISING", tone: "warning" }
    ],
    drivers: [
      {
        name: "Momentum",
        value: 0.94,
        magnitude: "HIGH",
        direction: "elevated",
        arrow: "↑",
        interpretation: "Parabolic multi-week acceleration is the primary catalyst for the Hype classification.",
        technical: { zScore: "+2.41σ", weight: "0.30", window: "20D / 60D ROC" }
      },
      {
        name: "20D Return",
        value: 0.86,
        magnitude: "HIGH",
        direction: "elevated",
        arrow: "↑",
        interpretation: "20-day rolling return ranks in the 93rd historical percentile.",
        technical: { zScore: "+2.05σ", weight: "0.23", window: "20D Rolling" }
      },
      {
        name: "Sentiment",
        value: 0.89,
        magnitude: "POSITIVE",
        direction: "elevated",
        arrow: "↑",
        interpretation: "Sentiment is becoming unusually optimistic with heavy retail and institutional call skew.",
        technical: { zScore: "+2.18σ", weight: "0.21", window: "Options Put/Call + Flow" }
      },
      {
        name: "Volatility",
        value: 0.48,
        magnitude: "LOW",
        direction: "controlled",
        arrow: "↑",
        interpretation: "Upside volatility is expanding as traders chase breakout levels.",
        technical: { zScore: "+0.32σ", weight: "0.14", window: "14D ATR / VXND" }
      },
      {
        name: "Price vs MA50",
        value: 0.85,
        magnitude: "ELEVATED",
        direction: "elevated",
        arrow: "↑",
        interpretation: "Index is extended +6.8% above its 50-day moving average.",
        technical: { zScore: "+1.95σ", weight: "0.12", window: "50D SMA Spread" }
      }
    ],
    whatChanged: {
      deltas: [
        { name: "Momentum", change: "+22.8%", arrow: "↑", tone: "up", period: "vs 5D avg" },
        { name: "Sentiment", change: "+16.4%", arrow: "↑", tone: "up", period: "vs 5D avg" },
        { name: "Volume", change: "+31.2%", arrow: "↑", tone: "up", period: "vs 20D avg" },
        { name: "Volatility", change: "+4.1%", arrow: "↑", tone: "warn", period: "realized 10D" }
      ],
      regimePressure: { value: 26, hype: 84, panic: 11 },
      summary: "Sentiment is becoming unusually optimistic. Speculative call volume expanded sharply over the past 3 sessions."
    },
    risk: {
      score: 58,
      max: 100,
      label: "MODERATE-HIGH",
      summary: "Crowded positioning increases vulnerability to sharp short-term pullbacks.",
      factors: [
        { name: "Volatility", level: "MEDIUM", tone: "warning", score: 49 },
        { name: "Drawdown", level: "LOW", tone: "value", score: 24 },
        { name: "Volume", level: "HIGH", tone: "hype", score: 78 },
        { name: "Sentiment", level: "HIGH", tone: "hype", score: 88 }
      ]
    }
  },

  DJI: {
    symbol: "DJI",
    name: "DOW",
    category: "Index",
    price: 45128.40,
    change: 0.74,
    regime: "Value-Driven",
    regimeKey: "value",
    confidence: 0.89,
    probabilities: { value: 0.89, hype: 0.07, panic: 0.04 },
    riskLevel: "LOW",
    riskScore: 34,
    trend: "↑",
    sparkline: [44710, 44790, 44830, 44910, 44980, 45040, 45090, 45128.40],
    story: {
      headline: "Industrial & cyclical leadership remains Value-Driven.",
      narrative:
        "Balanced rotation into industrials, financials, and healthcare supports steady price discovery with muted realized volatility.",
      watch:
        "Credit spread widening or a sharp rise in Treasury yields could slow cyclical accumulation."
    },
    flowPillars: [
      { name: "MOMENTUM", state: "STEADY", tone: "value" },
      { name: "SENTIMENT", state: "BALANCED", tone: "value" },
      { name: "VOLATILITY", state: "LOW", tone: "controlled" }
    ],
    drivers: marketData.drivers,
    whatChanged: {
      deltas: [
        { name: "Momentum", change: "+9.4%", arrow: "↑", tone: "up", period: "vs 5D avg" },
        { name: "Sentiment", change: "+5.1%", arrow: "↑", tone: "up", period: "vs 5D avg" },
        { name: "Volume", change: "+11.8%", arrow: "↑", tone: "up", period: "vs 20D avg" },
        { name: "Volatility", change: "-8.2%", arrow: "↓", tone: "up", period: "realized 10D" }
      ],
      regimePressure: { value: 78, hype: 22, panic: 10 },
      summary: "Market conditions remain stable with disciplined institutional accumulation."
    },
    risk: {
      score: 34,
      max: 100,
      label: "LOW",
      summary: "Low dispersion and healthy cash-flow coverage keep downside tail risk muted.",
      factors: [
        { name: "Volatility", level: "LOW", tone: "value", score: 22 },
        { name: "Drawdown", level: "LOW", tone: "value", score: 18 },
        { name: "Volume", level: "MEDIUM", tone: "warning", score: 46 },
        { name: "Sentiment", level: "MEDIUM", tone: "value", score: 51 }
      ]
    }
  },

  VIX: {
    symbol: "VIX",
    name: "VIX",
    category: "Volatility",
    price: 14.28,
    change: -6.30,
    regime: "Value-Driven",
    regimeKey: "value",
    confidence: 0.88,
    probabilities: { value: 0.88, hype: 0.04, panic: 0.08 },
    riskLevel: "LOW",
    riskScore: 29,
    trend: "↓",
    sparkline: [16.4, 15.9, 15.6, 15.2, 14.9, 14.7, 14.5, 14.28],
    story: {
      headline: "Implied volatility confirms a calm Value-Driven backdrop.",
      narrative:
        "VIX term structure remains in healthy contango at 14.28, signaling absence of near-term institutional hedging stress.",
      watch:
        "A move back above 18.50 accompanied by front-month backwardation would warn of an impending Panic transition."
    },
    flowPillars: [
      { name: "TERM SPREAD", state: "CONTANGO", tone: "value" },
      { name: "PUT SKEW", state: "MODERATE", tone: "value" },
      { name: "VOLATILITY", state: "COMPRESSED", tone: "controlled" }
    ],
    drivers: marketData.drivers,
    whatChanged: marketData.whatChanged,
    risk: marketData.risk
  },

  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "Equities",
    price: 257.43,
    change: 1.82,
    regime: "Value-Driven",
    regimeKey: "value",
    confidence: 0.91,
    probabilities: { value: 0.91, hype: 0.06, panic: 0.03 },
    riskLevel: "LOW",
    riskScore: 36,
    trend: "↑",
    sparkline: [248.2, 249.8, 251.0, 252.4, 253.9, 255.1, 256.2, 257.43],
    story: {
      headline: "AAPL is currently Value-Driven.",
      narrative:
        "Steady institutional accumulation and services margin expansion support an orderly upward trend with low realized volatility.",
      watch:
        "A break below the 20-day moving average on elevated volume would weaken current conviction."
    },
    flowPillars: [
      { name: "MOMENTUM", state: "HIGH", tone: "value" },
      { name: "SENTIMENT", state: "POSITIVE", tone: "value" },
      { name: "VOLATILITY", state: "LOW", tone: "controlled" }
    ],
    drivers: marketData.drivers,
    whatChanged: marketData.whatChanged,
    risk: marketData.risk
  },

  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    category: "Equities",
    price: 184.21,
    change: 2.94,
    regime: "Hype",
    regimeKey: "hype",
    confidence: 0.83,
    probabilities: { value: 0.14, hype: 0.83, panic: 0.03 },
    riskLevel: "MED",
    riskScore: 61,
    trend: "↑",
    sparkline: [171.5, 173.8, 176.2, 175.4, 178.9, 180.6, 182.1, 184.21],
    story: {
      headline: "NVDA is currently in a Hype regime.",
      narrative:
        "Momentum acceleration and aggressive options call skew have pushed price into a high-velocity speculative expansion zone.",
      watch:
        "Conditions are approaching extreme sentiment levels; monitor intraday volume divergence for potential exhaustion."
    },
    flowPillars: [
      { name: "MOMENTUM", state: "ACCELERATING", tone: "hype" },
      { name: "SENTIMENT", state: "EUPHORIC", tone: "hype" },
      { name: "VOLATILITY", state: "MEDIUM", tone: "warning" }
    ],
    drivers: [
      {
        name: "Momentum",
        value: 0.93,
        magnitude: "HIGH",
        direction: "elevated",
        arrow: "↑",
        interpretation: "Strong momentum acceleration is driving the Hype regime classification.",
        technical: { zScore: "+2.36σ", weight: "0.31", window: "20D / 60D ROC" }
      },
      {
        name: "20D Return",
        value: 0.85,
        magnitude: "HIGH",
        direction: "elevated",
        arrow: "↑",
        interpretation: "20-day gain significantly exceeds sector median.",
        technical: { zScore: "+1.98σ", weight: "0.22", window: "20D Rolling" }
      },
      {
        name: "Sentiment",
        value: 0.88,
        magnitude: "POSITIVE",
        direction: "elevated",
        arrow: "↑",
        interpretation: "Sentiment is becoming unusually optimistic across institutional and retail flows.",
        technical: { zScore: "+2.12σ", weight: "0.20", window: "Options Put/Call" }
      },
      {
        name: "Volatility",
        value: 0.52,
        magnitude: "MEDIUM",
        direction: "controlled",
        arrow: "↑",
        interpretation: "Implied volatility is expanding alongside upside price discovery.",
        technical: { zScore: "+0.54σ", weight: "0.15", window: "14D ATR" }
      },
      {
        name: "Price vs MA50",
        value: 0.84,
        magnitude: "ELEVATED",
        direction: "elevated",
        arrow: "↑",
        interpretation: "Trades +9.4% above its 50-day moving average.",
        technical: { zScore: "+1.89σ", weight: "0.12", window: "50D SMA Spread" }
      }
    ],
    whatChanged: {
      deltas: [
        { name: "Momentum", change: "+26.4%", arrow: "↑", tone: "up", period: "vs 5D avg" },
        { name: "Sentiment", change: "+19.2%", arrow: "↑", tone: "up", period: "vs 5D avg" },
        { name: "Volume", change: "+38.5%", arrow: "↑", tone: "up", period: "vs 20D avg" },
        { name: "Volatility", change: "+7.8%", arrow: "↑", tone: "warn", period: "realized 10D" }
      ],
      regimePressure: { value: 24, hype: 83, panic: 12 },
      summary: "Momentum is strengthening rapidly while speculative call activity reached a 30-day high."
    },
    risk: {
      score: 61,
      max: 100,
      label: "MEDIUM",
      summary: "Elevated valuation velocity increases sensitivity to guidance or macro shifts.",
      factors: [
        { name: "Volatility", level: "MEDIUM", tone: "warning", score: 54 },
        { name: "Drawdown", level: "LOW", tone: "value", score: 28 },
        { name: "Volume", level: "HIGH", tone: "hype", score: 82 },
        { name: "Sentiment", level: "HIGH", tone: "hype", score: 89 }
      ]
    }
  },

  TSLA: {
    symbol: "TSLA",
    name: "Tesla Inc.",
    category: "Equities",
    price: 331.52,
    change: -2.31,
    regime: "Panic",
    regimeKey: "panic",
    confidence: 0.79,
    probabilities: { value: 0.08, hype: 0.13, panic: 0.79 },
    riskLevel: "HIGH",
    riskScore: 78,
    trend: "↓",
    sparkline: [354.0, 349.5, 346.2, 344.8, 340.1, 337.6, 334.9, 331.52],
    story: {
      headline: "TSLA is currently in a Panic regime.",
      narrative:
        "Volatility is increasing while downside volume accelerated below short-term support levels. Defensive put-buying dominates options flow.",
      watch:
        "Stabilization in realized volatility and a reclaim of the 20-day moving average are required before regime pressure eases."
    },
    flowPillars: [
      { name: "MOMENTUM", state: "NEGATIVE", tone: "panic" },
      { name: "SENTIMENT", state: "FEARFUL", tone: "panic" },
      { name: "VOLATILITY", state: "HIGH", tone: "panic" }
    ],
    drivers: [
      {
        name: "Volatility",
        value: 0.89,
        magnitude: "HIGH",
        direction: "negative",
        arrow: "↑",
        interpretation: "Sharp expansion in realized and implied volatility is the primary driver of the Panic classification.",
        technical: { zScore: "+2.28σ", weight: "0.32", window: "14D ATR / IV30" }
      },
      {
        name: "Momentum",
        value: 0.81,
        magnitude: "NEGATIVE",
        direction: "negative",
        arrow: "↓",
        interpretation: "Downward price velocity accelerated across multiple intraday sessions.",
        technical: { zScore: "-1.95σ", weight: "0.25", window: "20D ROC" }
      },
      {
        name: "Sentiment",
        value: 0.76,
        magnitude: "NEGATIVE",
        direction: "negative",
        arrow: "↓",
        interpretation: "Heavy institutional put-hedging reflects defensive positioning.",
        technical: { zScore: "-1.72σ", weight: "0.20", window: "Put/Call Skew" }
      },
      {
        name: "20D Return",
        value: 0.68,
        magnitude: "LOW",
        direction: "negative",
        arrow: "↓",
        interpretation: "Rolling 20-day return turned sharply negative following distribution days.",
        technical: { zScore: "-1.48σ", weight: "0.13", window: "20D Rolling" }
      },
      {
        name: "Price vs MA50",
        value: 0.62,
        magnitude: "WEAK",
        direction: "negative",
        arrow: "↓",
        interpretation: "Price broke below its 50-day moving average on above-average volume.",
        technical: { zScore: "-1.31σ", weight: "0.10", window: "50D SMA Spread" }
      }
    ],
    whatChanged: {
      deltas: [
        { name: "Momentum", change: "-18.6%", arrow: "↓", tone: "down", period: "vs 5D avg" },
        { name: "Sentiment", change: "-14.2%", arrow: "↓", tone: "down", period: "vs 5D avg" },
        { name: "Volume", change: "+29.8%", arrow: "↑", tone: "warn", period: "distribution" },
        { name: "Volatility", change: "+24.5%", arrow: "↑", tone: "down", period: "realized 10D" }
      ],
      regimePressure: { value: 12, hype: 19, panic: 79 },
      summary: "Volatility is increasing alongside elevated downside volume."
    },
    risk: {
      score: 78,
      max: 100,
      label: "HIGH",
      summary: "High intraday dispersion and negative momentum warrant elevated risk caution.",
      factors: [
        { name: "Volatility", level: "HIGH", tone: "panic", score: 84 },
        { name: "Drawdown", level: "HIGH", tone: "panic", score: 76 },
        { name: "Volume", level: "HIGH", tone: "warning", score: 74 },
        { name: "Sentiment", level: "LOW", tone: "panic", score: 79 }
      ]
    }
  }
};

/**
 * Watchlist Table Dataset
 * Matches specification: AAPL, NVDA, TSLA + institutional leaders
 */
export const watchlistData = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    price: 257.43,
    change: 1.82,
    regime: "VALUE",
    regimeFull: "Value-Driven",
    regimeKey: "value",
    confidence: 91,
    risk: "LOW",
    riskKey: "value",
    trend: "↑",
    driverSummary: "Steady institutional accumulation & low realized volatility",
    volumeDelta: "+14.2%"
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    sector: "Semiconductors",
    price: 184.21,
    change: 2.94,
    regime: "HYPE",
    regimeFull: "Hype",
    regimeKey: "hype",
    confidence: 83,
    risk: "MED",
    riskKey: "warning",
    trend: "↑",
    driverSummary: "Momentum acceleration & heavy call-option skew",
    volumeDelta: "+38.5%"
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    sector: "Automotive / AI",
    price: 331.52,
    change: -2.31,
    regime: "PANIC",
    regimeFull: "Panic",
    regimeKey: "panic",
    confidence: 79,
    risk: "HIGH",
    riskKey: "panic",
    trend: "↓",
    driverSummary: "Volatility spike & distribution below 50-day average",
    volumeDelta: "+29.8%"
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    sector: "Cloud / AI",
    price: 489.15,
    change: 1.14,
    regime: "VALUE",
    regimeFull: "Value-Driven",
    regimeKey: "value",
    confidence: 89,
    risk: "LOW",
    riskKey: "value",
    trend: "↑",
    driverSummary: "Consistent cash-flow support & compressed drawdown",
    volumeDelta: "+9.1%"
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    sector: "Consumer / Cloud",
    price: 234.68,
    change: 1.56,
    regime: "VALUE",
    regimeFull: "Value-Driven",
    regimeKey: "value",
    confidence: 86,
    risk: "LOW",
    riskKey: "value",
    trend: "↑",
    driverSummary: "Positive 20D return supported by improving breadth",
    volumeDelta: "+12.7%"
  },
  {
    symbol: "META",
    name: "Meta Platforms",
    sector: "Communication",
    price: 642.90,
    change: 2.45,
    regime: "HYPE",
    regimeFull: "Hype",
    regimeKey: "hype",
    confidence: 78,
    risk: "MED",
    riskKey: "warning",
    trend: "↑",
    driverSummary: "Breakout velocity above upper volatility channel",
    volumeDelta: "+24.0%"
  },
  {
    symbol: "AMD",
    name: "Adv. Micro Devices",
    sector: "Semiconductors",
    price: 168.40,
    change: -1.64,
    regime: "PANIC",
    regimeFull: "Panic",
    regimeKey: "panic",
    confidence: 74,
    risk: "HIGH",
    riskKey: "panic",
    trend: "↓",
    driverSummary: "Relative strength rotation out of secondary chip names",
    volumeDelta: "+19.3%"
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Communication",
    price: 211.84,
    change: 0.92,
    regime: "VALUE",
    regimeFull: "Value-Driven",
    regimeKey: "value",
    confidence: 90,
    risk: "LOW",
    riskKey: "value",
    trend: "↑",
    driverSummary: "Valuation discipline with controlled implied volatility",
    volumeDelta: "+8.4%"
  }
];

/**
 * Generates deterministic, realistic Regime Timeline series for any symbol & timeframe
 * Includes exact tooltip reference point (e.g., May 06, 2026 — Price: $621.42 / 6,214.20, Regime: Hype, Confidence: 87%, Main driver: Momentum acceleration)
 */
export function getTimelineSeries(symbol = "SPX", timeframe = "6M") {
  const inst = instrumentsCatalog[symbol] || instrumentsCatalog.SPX;
  const basePrice = inst.price;

  const pointsCountMap = {
    "1D": 48,
    "1W": 42,
    "1M": 45,
    "3M": 60,
    "6M": 72,
    "1Y": 84,
    "5Y": 96
  };
  const count = pointsCountMap[timeframe] || 72;

  // Define realistic regime transition zones along the timeline
  // Format: [startRatio, endRatio, regimeName, regimeKey, driverLabel, baseConf]
  let zones;
  if (inst.regimeKey === "value") {
    zones = [
      { start: 0.0, end: 0.28, regime: "Value-Driven", key: "value", driver: "Institutional accumulation", conf: 88 },
      { start: 0.28, end: 0.54, regime: "Hype", key: "hype", driver: "Momentum acceleration", conf: 87 },
      { start: 0.54, end: 0.68, regime: "Panic", key: "panic", driver: "Volatility expansion", conf: 81 },
      { start: 0.68, end: 1.0, regime: "Value-Driven", key: "value", driver: "Controlled volatility & positive momentum", conf: 91 }
    ];
  } else if (inst.regimeKey === "hype") {
    zones = [
      { start: 0.0, end: 0.24, regime: "Panic", key: "panic", driver: "Rate sensitivity & de-risking", conf: 78 },
      { start: 0.24, end: 0.62, regime: "Value-Driven", key: "value", driver: "Earnings revision breadth", conf: 86 },
      { start: 0.62, end: 1.0, regime: "Hype", key: "hype", driver: "Momentum acceleration", conf: 84 }
    ];
  } else {
    zones = [
      { start: 0.0, end: 0.35, regime: "Value-Driven", key: "value", driver: "Balanced inflows", conf: 84 },
      { start: 0.35, end: 0.66, regime: "Hype", key: "hype", driver: "Speculative call skew", conf: 82 },
      { start: 0.66, end: 1.0, regime: "Panic", key: "panic", driver: "Volatility spike & distribution", conf: 79 }
    ];
  }

  const endDate = new Date("2026-09-29T16:00:00");
  const stepHoursMap = {
    "1D": 0.25,
    "1W": 4,
    "1M": 16,
    "3M": 36,
    "6M": 60,
    "1Y": 108,
    "5Y": 450
  };
  const stepHours = stepHoursMap[timeframe] || 60;

  const series = [];
  let runningPrice = basePrice * 0.88;

  for (let i = 0; i < count; i++) {
    const ratio = i / (count - 1);
    const zone = zones.find((z) => ratio >= z.start && ratio <= z.end) || zones[zones.length - 1];

    // Deterministic wave + trend toward current price
    const wave =
      Math.sin(i * 0.32) * (basePrice * 0.012) +
      Math.cos(i * 0.17) * (basePrice * 0.008);

    let drift = 0;
    if (zone.key === "value") drift = basePrice * 0.0022;
    if (zone.key === "hype") drift = basePrice * 0.0038;
    if (zone.key === "panic") drift = -basePrice * 0.0034;

    runningPrice = runningPrice + drift + wave * 0.18;

    // Smooth convergence on final point to match current instrument quote
    const price =
      i === count - 1
        ? basePrice
        : Number((runningPrice * (1 - ratio * 0.15) + basePrice * (ratio * 0.15)).toFixed(2));

    const ptDate = new Date(endDate.getTime() - (count - 1 - i) * stepHours * 3600 * 1000);
    const formattedDate =
      timeframe === "1D"
        ? ptDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) + " EST"
        : ptDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

    const confVariation = Math.round(Math.sin(i * 0.5) * 3);
    const confidence = i === count - 1 ? Math.round(inst.confidence * 100) : Math.min(98, Math.max(68, zone.conf + confVariation));

    series.push({
      index: i,
      date: formattedDate,
      price,
      regime: zone.regime,
      regimeKey: zone.key,
      confidence,
      driver: zone.driver
    });
  }

  // Inject exact reference point from prompt in 6M view for immediate verification
  if (timeframe === "6M" && series.length > 28) {
    series[28].date = "May 06, 2026";
    series[28].regime = "Hype";
    series[28].regimeKey = "hype";
    series[28].confidence = 87;
    series[28].driver = "Momentum acceleration";
    if (symbol === "SPY") {
      series[28].price = 621.42;
    }
  }

  return {
    symbol: inst.symbol,
    name: inst.name,
    timeframe,
    zones,
    series
  };
}

/**
 * Sector & Cross-Asset Matrix for markets.html and regime.html
 */
export const sectorRegimeMatrix = [
  { sector: "Information Technology", etf: "XLK", price: 248.12, change: 1.84, regime: "Value-Driven", key: "value", confidence: 92, momentum: "+16.4%", volatility: "14.8%", risk: "LOW" },
  { sector: "Semiconductors & AI", etf: "SOXX", price: 269.45, change: 2.76, regime: "Hype", key: "hype", confidence: 86, momentum: "+24.9%", volatility: "22.4%", risk: "MED" },
  { sector: "Financials", etf: "XLF", price: 51.84, change: 0.95, regime: "Value-Driven", key: "value", confidence: 89, momentum: "+11.2%", volatility: "12.1%", risk: "LOW" },
  { sector: "Industrials", etf: "XLI", price: 144.30, change: 0.82, regime: "Value-Driven", key: "value", confidence: 87, momentum: "+9.8%", volatility: "11.6%", risk: "LOW" },
  { sector: "Consumer Discretionary", etf: "XLY", price: 218.60, change: -0.48, regime: "Hype", key: "hype", confidence: 76, momentum: "+8.1%", volatility: "19.2%", risk: "MED" },
  { sector: "Healthcare", etf: "XLV", price: 158.92, change: 0.64, regime: "Value-Driven", key: "value", confidence: 90, momentum: "+7.5%", volatility: "10.4%", risk: "LOW" },
  { sector: "Energy", etf: "XLE", price: 92.15, change: -1.42, regime: "Panic", key: "panic", confidence: 77, momentum: "-11.4%", volatility: "24.6%", risk: "HIGH" },
  { sector: "Utilities", etf: "XLU", price: 81.40, change: 0.38, regime: "Value-Driven", key: "value", confidence: 84, momentum: "+6.2%", volatility: "11.9%", risk: "LOW" }
];

/* ==========================================================================
   FASTAPI-READY ASYNCHRONOUS ABSTRACTION FUNCTIONS
   Replace mock resolution by flipping API_CONFIG.useLiveBackend = true
   ========================================================================== */

async function requestEndpoint(path, fallbackResolver) {
  if (API_CONFIG.useLiveBackend) {
    const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`FastAPI HTTP ${response.status} on ${path}`);
    }
    return response.json();
  }
  if (API_CONFIG.simulatedLatencyMs > 0) {
    await new Promise((r) => setTimeout(r, API_CONFIG.simulatedLatencyMs));
  }
  return fallbackResolver();
}

export async function fetchMarket(symbol = "SPX") {
  return requestEndpoint(`/market?symbol=${encodeURIComponent(symbol)}`, () => {
    const inst = instrumentsCatalog[symbol] || instrumentsCatalog.SPX;
    return {
      symbol: inst.symbol,
      name: inst.name,
      price: inst.price,
      change: inst.change,
      marketStatus: marketData.marketStatus,
      lastUpdated: marketData.lastUpdated,
      miniCards: ["SPX", "NDX", "DJI", "VIX"].map((k) => instrumentsCatalog[k])
    };
  });
}

export async function fetchRegime(symbol = "SPX") {
  return requestEndpoint(`/regime?symbol=${encodeURIComponent(symbol)}`, () => {
    const inst = instrumentsCatalog[symbol] || instrumentsCatalog.SPX;
    return {
      symbol: inst.symbol,
      current: inst.regime,
      key: inst.regimeKey,
      confidence: inst.confidence,
      probabilities: inst.probabilities,
      story: inst.story,
      flowPillars: inst.flowPillars,
      transitionAlert: marketData.transitionAlert,
      modelMetadata: marketData.modelMetadata
    };
  });
}

export async function fetchWhy(symbol = "SPX") {
  return requestEndpoint(`/why?symbol=${encodeURIComponent(symbol)}`, () => {
    const inst = instrumentsCatalog[symbol] || instrumentsCatalog.SPX;
    return {
      symbol: inst.symbol,
      regime: inst.regime,
      drivers: inst.drivers,
      modelMetadata: marketData.modelMetadata
    };
  });
}

export async function fetchWhatChanged(symbol = "SPX") {
  return requestEndpoint(`/what-changed?symbol=${encodeURIComponent(symbol)}`, () => {
    const inst = instrumentsCatalog[symbol] || instrumentsCatalog.SPX;
    return {
      symbol: inst.symbol,
      ...inst.whatChanged,
      risk: inst.risk
    };
  });
}

export async function fetchWatchlist() {
  return requestEndpoint("/watchlist", () => watchlistData);
}
