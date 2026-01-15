// MARPA Knowledge Base - All canonical data for AI agent

export const MARPA_KNOWLEDGE = {
  company: {
    name: "MARPA",
    fullName: "MARPA Landscape Architecture",
    founded: 1974,
    yearsInBusiness: 51,
    industry: "Landscape Architecture & Construction",
    location: "California",
    specialty: "High-end residential landscape design and construction",
  },

  financials: {
    valuation: {
      enterprise: 17_000_000,
      formatted: "$17M",
      method: "EBITDA Multiple",
      multiple: 10.3,
      asOf: "December 2025",
    },
    ebitda: {
      amount: 1_655_000,
      formatted: "$1.655M",
      margin: 16.7,
      industryAverage: "8-12%",
      note: "Premium territory vs. industry average",
    },
    revenue: {
      total2025: 11_030_000,
      formatted: "$11.03M",
      breakdown: {
        construction: { amount: 9_600_000, percentage: 87 },
        design: { amount: 805_000, percentage: 7.3 },
        oversight: { amount: 614_000, percentage: 5.6 },
      },
    },
    metrics: {
      winRate: 95,
      averageProjectSize: 728_000,
      licensedStaff: { count: 5, total: 7, percentage: 71 },
      industryLicensedAverage: 45,
      marketingSpend: 0,
      note: "100% referral-driven, no marketing spend",
    },
  },

  ownership: {
    current: {
      luke: { name: "Luke Sanzone", title: "Principal & Owner", equity: 100 },
    },
    pathA: {
      name: "Solo Principal",
      description: "Bodie as sole successor",
      structure: {
        luke: { equity: 51, role: "Principal & Owner" },
        bodie: { equity: 49, role: "Solo Partner" },
      },
      pros: ["Simpler governance", "Clear succession", "Single relationship"],
      cons: [
        "All risk on Bodie",
        "No construction integration",
        "Limited growth",
      ],
    },
    pathB: {
      name: "Shared Principals",
      description: "Equal partnership structure",
      structure: {
        luke: { equity: 52, role: "Principal & Owner" },
        bodie: { equity: 24, role: "Partner, Succession Lead" },
        pablo: { equity: 24, role: "Partner, Construction Lead" },
      },
      pros: ["Distributed risk", "Multiple skill sets", "Shared capital"],
      cons: ["More complex governance", "Three-way decisions"],
    },
    pathC: {
      name: "Design-Build Partnership",
      description: "Recommended path with construction integration",
      recommended: true,
      structure: {
        luke: { equity: 52, role: "Principal & Owner" },
        bodie: { equity: 24, role: "Partner, Succession Lead" },
        pablo: { equity: 24, role: "Partner, Construction Lead" },
        combinedMinority: 48,
      },
      pros: [
        "Maximum growth potential",
        "Construction integration",
        "Design-Build margins",
        "Distributed risk",
        "Multiple revenue streams",
      ],
      cons: ["Requires coordination", "More complex structure"],
    },
  },

  team: {
    luke: {
      name: "Luke Sanzone",
      title: "Principal & Owner",
      role: "Founder and current owner",
      focus: "Strategic vision and client relationships",
    },
    bodie: {
      name: "Bodie Hultin",
      title: "Partner, Succession Lead",
      role: "Design leadership and client management",
      focus: "Taking over design operations",
    },
    pablo: {
      name: "Pablo Banuelos",
      title: "Partner, Construction Lead",
      role: "Construction operations",
      focus: "In-house construction capability",
      equipmentValue: "4.5% equity equivalent",
    },
  },

  timeline: {
    vesting: {
      duration: 4,
      annualGift: 6,
      totalPerPartner: 24,
      schedule: [
        { year: 1, gift: 6, cumulative: 6, note: "Initial commitment" },
        {
          year: 2,
          gift: 6,
          cumulative: 12,
          note: "+ Pablo equipment conversion",
        },
        { year: 3, gift: 6, cumulative: 18, note: "Purchase period begins" },
        { year: 4, gift: 6, cumulative: 24, note: "Full partnership achieved" },
      ],
    },
    purchase: {
      startYear: 3,
      endYear: 10,
      duration: 8,
      discount: 50,
      priceCap: 10,
      note: "Partners can buy additional shares at 50% discount, max 10% price increase per year",
    },
    valueHorizon: {
      year: 11,
      revenueTarget: 20_000_000,
      valuationTarget: 25_000_000,
    },
  },

  growth: {
    construction: {
      baseline2026: 1_700_000,
      growthRate: 10,
      projections: [
        { year: 2026, amount: 1.7 },
        { year: 2027, amount: 1.87 },
        { year: 2028, amount: 2.06 },
        { year: 2029, amount: 2.26 },
        { year: 2030, amount: 2.49 },
        { year: 2031, amount: 2.74 },
        { year: 2032, amount: 3.01 },
        { year: 2033, amount: 3.31 },
        { year: 2034, amount: 3.64 },
        { year: 2035, amount: 4.01 },
        { year: 2036, amount: 4.41 },
      ],
    },
    maintenance: {
      baseline2026: 800_000,
      growthRate: 20,
      projections: [
        { year: 2026, amount: 0.8 },
        { year: 2027, amount: 0.96 },
        { year: 2028, amount: 1.15 },
        { year: 2029, amount: 1.38 },
        { year: 2030, amount: 1.66 },
        { year: 2031, amount: 1.99 },
        { year: 2032, amount: 2.39 },
        { year: 2033, amount: 2.87 },
        { year: 2034, amount: 3.44 },
        { year: 2035, amount: 4.13 },
        { year: 2036, amount: 4.96 },
      ],
    },
    insight:
      "Maintenance revenue overtakes construction by Year 8, creating diversified income streams",
  },

  designBuild: {
    description: "Integration of design and construction under one company",
    benefits: [
      "Higher margins (35-45% vs 20-25%)",
      "Faster project timelines",
      "Better quality control",
      "Single point of accountability",
      "Competitive advantage",
    ],
    marginComparison: {
      traditional: { design: 25, construction: 20 },
      designBuild: { integrated: 40 },
    },
  },

  governance: {
    thresholds: {
      operating: { minority: 24, required: "Any partner" },
      strategic: { minority: 48, required: "Both minority partners" },
      major: { majority: 52, required: "Luke's approval" },
    },
    rightsUnlock: [
      { equity: 6, rights: "Profit sharing, quarterly reports" },
      { equity: 12, rights: "+ Board observer seat" },
      { equity: 18, rights: "+ Strategic input rights" },
      { equity: 24, rights: "+ Full voting rights on major decisions" },
    ],
  },
};

// Helper function to format currency
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

// Get summary for AI context
export function getKnowledgeSummary(): string {
  const k = MARPA_KNOWLEDGE;
  return `
MARPA Knowledge Base Summary:

COMPANY: ${k.company.name} - ${k.company.specialty}, founded ${k.company.founded} (${k.company.yearsInBusiness} years)

FINANCIALS:
- Valuation: ${k.financials.valuation.formatted} (${k.financials.valuation.multiple}x EBITDA)
- EBITDA: ${k.financials.ebitda.formatted} (${k.financials.ebitda.margin}% margin)
- Revenue: ${k.financials.revenue.formatted}
- Win Rate: ${k.financials.metrics.winRate}%

OWNERSHIP PATHS:
- Path A (Solo): Luke ${k.ownership.pathA.structure.luke.equity}% / Bodie ${k.ownership.pathA.structure.bodie.equity}%
- Path B (Shared): Luke ${k.ownership.pathB.structure.luke.equity}% / Bodie ${k.ownership.pathB.structure.bodie.equity}% / Pablo ${k.ownership.pathB.structure.pablo.equity}%
- Path C (Design-Build): Luke ${k.ownership.pathC.structure.luke.equity}% / Bodie ${k.ownership.pathC.structure.bodie.equity}% / Pablo ${k.ownership.pathC.structure.pablo.equity}% [RECOMMENDED]

VESTING: ${k.timeline.vesting.annualGift}% per year over ${k.timeline.vesting.duration} years (${k.timeline.vesting.totalPerPartner}% total per partner)

GROWTH PROJECTIONS:
- Construction: ${k.growth.construction.growthRate}% YoY
- Maintenance: ${k.growth.maintenance.growthRate}% YoY
- Year 11 Target: $20M+ revenue, $25M valuation
`;
}
