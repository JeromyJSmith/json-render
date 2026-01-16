/**
 * MARPA Canonical Truth
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH for all MARPA business data.
 * All slides and components MUST import values from here.
 * DO NOT hardcode business values elsewhere.
 *
 * Source: .claude/plans/CANONICAL_TRUTH.json
 */

export const CANONICAL = {
  // Ownership Structure
  ownership: {
    structure: "52/24/24",
    description: "Three-way ownership split",
    partners: {
      luke_sanzone: {
        percentage: 52,
        title: "Principal & Owner",
        forbiddenTitles: ["CEO", "Founder", "Chairman", "President"],
      },
      bodie_hultin: {
        percentage: 24,
        title: "Partner",
        role: "Operations",
      },
      pablo_banuelos: {
        percentage: 24,
        title: "Partner",
        role: "Construction",
      },
    },
    forbiddenSplits: ["33/33/33", "30/35/35", "40/30/30", "50/50"],
  },

  // Solo Path (Alternative)
  soloPath: {
    structure: "51/49",
    description: "Two-way ownership (Bodie solo successor)",
    lukePercentage: 51,
    bodiePercentage: 49,
    forbiddenSplits: ["50/50", "48/52"],
  },

  // Valuation
  valuation: {
    enterpriseValue: 17000000,
    enterpriseValueDisplay: "$17M",
    forbiddenValues: [
      "$15M",
      "$16M",
      "$15 million",
      "$16 million",
      "15M",
      "16M",
    ],
    valuationRange: {
      low: 16200000,
      high: 18000000,
    },
  },

  // Financials
  financials: {
    revenue2025: {
      total: 11030000,
      display: "$11.03M",
      breakdown: {
        construction: { amount: 9600000, percentage: 87 },
        design: { amount: 805000, percentage: 7.3 },
        oversight: { amount: 614000, percentage: 5.6 },
      },
    },
    ebitda: {
      amount: 1655000,
      display: "$1.655M",
      marginPercentage: 15,
    },
    ebitdaMultiple: {
      value: 10.3,
      display: "10.3x",
      forbiddenValues: ["8x", "10.2x", "12x", "4-6x"],
    },
    year11Target: {
      revenue: 20000000,
      display: "$20M+",
      forbiddenValues: ["$15M", "$18M"],
    },
  },

  // Performance Metrics
  performance: {
    winRate: {
      value: 95,
      display: "95%",
      forbiddenValues: ["90%", "92%", "90-95%"],
    },
    averageProject: {
      value: 728000,
      display: "$728K",
    },
    licensedPercentage: 71,
  },

  // Transition Timeline
  transition: {
    periodYears: 4,
    display: "4 years",
    forbiddenValues: ["3 years", "5 years", "3-year", "5-year"],
    vestingSchedule: {
      annualPercentage: 6,
      year1: 6,
      year2: 12,
      year3: 18,
      year4: 24,
    },
  },

  // Growth Rates
  growthRates: {
    construction: {
      annualPercentage: 10,
      display: "10% YoY",
    },
    maintenance: {
      annualPercentage: 20,
      display: "20% YoY",
    },
    pabloEquipmentConversion: {
      percentage: 4.5,
      display: "4.5%",
    },
  },

  // Presentation Meta
  presentation: {
    totalSlides: 78,
    chapters: 8,
  },
} as const;

/**
 * Forbidden value patterns for validation
 */
export const FORBIDDEN_PATTERNS = [
  // Wrong valuation
  /\$15M|\$16M|\$15\s*million|\$16\s*million/i,
  // Wrong multiple
  /\b8x\b|\b12x\b|10\.2x/,
  // Wrong ownership split
  /33\/33\/33|30\/35\/35|40\/30\/30/,
  // Wrong win rate
  /\b90%\b|\b92%\b/,
  // Wrong timeline
  /5[- ]year\s*(vesting|transition)/i,
  // Wrong EBITDA
  /\$1\.5M|\$2M\s*EBITDA/i,
  // Wrong titles for Luke
  /Luke.*CEO|Luke.*Founder|Luke.*Chairman/i,
];

/**
 * Format helpers
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

export function formatMultiple(value: number): string {
  return `${value}x`;
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

/**
 * Validate text against forbidden patterns
 */
export function validateText(text: string): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  for (const pattern of FORBIDDEN_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push(`Found forbidden value: "${match[0]}"`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Pre-formatted display values for convenience
 */
export const DISPLAY = {
  enterpriseValue: CANONICAL.valuation.enterpriseValueDisplay,
  ebitda: CANONICAL.financials.ebitda.display,
  ebitdaMultiple: CANONICAL.financials.ebitdaMultiple.display,
  revenue: CANONICAL.financials.revenue2025.display,
  winRate: CANONICAL.performance.winRate.display,
  ownershipSplit: CANONICAL.ownership.structure,
  vestingPeriod: CANONICAL.transition.display,
  year11Target: CANONICAL.financials.year11Target.display,
} as const;
