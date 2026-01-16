/**
 * Slide Registry System
 *
 * Tracks all slides in the presentation, their render history,
 * and validates data against canonical truth.
 */

import { slides } from "./slides";
import { PRESENTATION_SCRIPT, CHAPTERS } from "./presentation-script";
import { validateText, CANONICAL } from "./canonical";

// Types
export interface RenderEvent {
  timestamp: string;
  duration?: number;
  source: "presenter" | "viewer" | "api" | "unknown";
}

export interface SlideRegistryEntry {
  id: number;
  key: string;
  title: string;
  chapter?: string;
  chapterNumber?: number;
  narration?: string;
  canonicalRefs: string[];
  validationStatus: "valid" | "invalid" | "unchecked";
  validationErrors: string[];
  renderHistory: RenderEvent[];
  renderCount: number;
  lastRendered?: string;
}

export interface SlideRegistry {
  version: string;
  totalSlides: number;
  chapters: typeof CHAPTERS;
  slides: SlideRegistryEntry[];
  lastUpdated: string;
  stats: {
    totalRenders: number;
    mostViewedSlide?: number;
    averageViewTime?: number;
  };
}

// Storage key for persisting render history
const STORAGE_KEY = "marpa-slide-registry";

// Canonical references that might appear in slides
const CANONICAL_PATTERNS: { pattern: RegExp; ref: string }[] = [
  {
    pattern: /\$17M|\$17,000,000|17\s*million/i,
    ref: "valuation.enterpriseValue",
  },
  { pattern: /\$1\.655M|\$1,655,000/i, ref: "financials.ebitda" },
  { pattern: /10\.3x/i, ref: "financials.ebitdaMultiple" },
  { pattern: /\$11\.03M|\$11,030,000/i, ref: "financials.revenue2025" },
  { pattern: /95%\s*(win|close)/i, ref: "performance.winRate" },
  { pattern: /52\/24\/24/i, ref: "ownership.structure" },
  { pattern: /51\/49/i, ref: "soloPath.structure" },
  {
    pattern: /4[- ]year\s*(vesting|transition)/i,
    ref: "transition.periodYears",
  },
  {
    pattern: /6%\s*(annual|per\s*year|vesting)/i,
    ref: "transition.vestingSchedule",
  },
  { pattern: /\$728K|\$728,000/i, ref: "performance.averageProject" },
  {
    pattern: /\$20M\+?.*target|target.*\$20M/i,
    ref: "financials.year11Target",
  },
];

/**
 * Detect canonical references in text
 */
function detectCanonicalRefs(text: string): string[] {
  const refs: string[] = [];
  for (const { pattern, ref } of CANONICAL_PATTERNS) {
    if (pattern.test(text)) {
      refs.push(ref);
    }
  }
  return [...new Set(refs)];
}

/**
 * Find chapter for a slide
 */
function findChapter(slideId: number): { name?: string; number?: number } {
  for (const chapter of CHAPTERS) {
    if (chapter.slides.includes(slideId)) {
      return { name: chapter.name, number: chapter.number };
    }
  }
  return {};
}

/**
 * Build initial registry from slides and scripts
 */
function buildRegistry(): SlideRegistryEntry[] {
  const entries: SlideRegistryEntry[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const script = PRESENTATION_SCRIPT[i];
    const slideId = i + 1;
    const chapter = findChapter(slideId);

    // Get narration text for validation
    const narration = script?.narration || "";

    // Detect canonical references
    const canonicalRefs = detectCanonicalRefs(narration + " " + slide.title);

    // Validate against forbidden patterns
    const validation = validateText(narration);

    entries.push({
      id: slideId,
      key: slide.file,
      title: slide.title,
      chapter: chapter.name,
      chapterNumber: chapter.number,
      narration: narration,
      canonicalRefs,
      validationStatus: validation.valid ? "valid" : "invalid",
      validationErrors: validation.violations,
      renderHistory: [],
      renderCount: 0,
    });
  }

  return entries;
}

/**
 * SlideRegistry class for managing slide tracking
 */
class SlideRegistryManager {
  private registry: SlideRegistry;

  constructor() {
    this.registry = this.loadOrCreate();
  }

  /**
   * Load registry from storage or create new one
   */
  private loadOrCreate(): SlideRegistry {
    // Try to load from localStorage (browser only)
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as SlideRegistry;
          // Merge with current slides (in case slides changed)
          return this.mergeWithCurrent(parsed);
        }
      } catch {
        // Ignore parse errors, create fresh
      }
    }

    return this.createFresh();
  }

  /**
   * Create fresh registry
   */
  private createFresh(): SlideRegistry {
    return {
      version: "1.0.0",
      totalSlides: slides.length,
      chapters: CHAPTERS,
      slides: buildRegistry(),
      lastUpdated: new Date().toISOString(),
      stats: {
        totalRenders: 0,
      },
    };
  }

  /**
   * Merge stored registry with current slide definitions
   */
  private mergeWithCurrent(stored: SlideRegistry): SlideRegistry {
    const fresh = this.createFresh();

    // Preserve render history from stored
    for (const storedSlide of stored.slides) {
      const freshSlide = fresh.slides.find((s) => s.id === storedSlide.id);
      if (freshSlide) {
        freshSlide.renderHistory = storedSlide.renderHistory;
        freshSlide.renderCount = storedSlide.renderCount;
        freshSlide.lastRendered = storedSlide.lastRendered;
      }
    }

    // Preserve stats
    fresh.stats = stored.stats;
    fresh.lastUpdated = new Date().toISOString();

    return fresh;
  }

  /**
   * Save registry to storage
   */
  private save(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.registry));
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Record a slide render event
   */
  recordRender(
    slideId: number,
    source: RenderEvent["source"] = "unknown",
    duration?: number,
  ): void {
    const slide = this.registry.slides.find((s) => s.id === slideId);
    if (!slide) return;

    const event: RenderEvent = {
      timestamp: new Date().toISOString(),
      source,
      duration,
    };

    slide.renderHistory.push(event);
    slide.renderCount++;
    slide.lastRendered = event.timestamp;

    this.registry.stats.totalRenders++;
    this.registry.lastUpdated = event.timestamp;

    // Update most viewed
    const mostViewed = this.registry.slides.reduce((max, s) =>
      s.renderCount > max.renderCount ? s : max,
    );
    this.registry.stats.mostViewedSlide = mostViewed.id;

    this.save();
  }

  /**
   * Get slide by ID
   */
  getSlide(slideId: number): SlideRegistryEntry | undefined {
    return this.registry.slides.find((s) => s.id === slideId);
  }

  /**
   * Get slide by index (0-based)
   */
  getSlideByIndex(index: number): SlideRegistryEntry | undefined {
    return this.registry.slides[index];
  }

  /**
   * Get render history for a slide
   */
  getRenderHistory(slideId: number): RenderEvent[] {
    return this.getSlide(slideId)?.renderHistory || [];
  }

  /**
   * Get all slides with validation errors
   */
  getInvalidSlides(): SlideRegistryEntry[] {
    return this.registry.slides.filter((s) => s.validationStatus === "invalid");
  }

  /**
   * Get slides by chapter
   */
  getSlidesByChapter(chapterNumber: number): SlideRegistryEntry[] {
    return this.registry.slides.filter(
      (s) => s.chapterNumber === chapterNumber,
    );
  }

  /**
   * Get slides referencing a canonical value
   */
  getSlidesByCanonicalRef(ref: string): SlideRegistryEntry[] {
    return this.registry.slides.filter((s) => s.canonicalRefs.includes(ref));
  }

  /**
   * Export full registry
   */
  exportRegistry(): SlideRegistry {
    return { ...this.registry };
  }

  /**
   * Get registry stats
   */
  getStats() {
    return this.registry.stats;
  }

  /**
   * Clear all render history
   */
  clearHistory(): void {
    for (const slide of this.registry.slides) {
      slide.renderHistory = [];
      slide.renderCount = 0;
      slide.lastRendered = undefined;
    }
    this.registry.stats = { totalRenders: 0 };
    this.save();
  }

  /**
   * Re-validate all slides
   */
  revalidate(): { valid: number; invalid: number; errors: string[] } {
    let valid = 0;
    let invalid = 0;
    const errors: string[] = [];

    for (const slide of this.registry.slides) {
      const text = (slide.narration || "") + " " + slide.title;
      const validation = validateText(text);

      slide.validationStatus = validation.valid ? "valid" : "invalid";
      slide.validationErrors = validation.violations;

      if (validation.valid) {
        valid++;
      } else {
        invalid++;
        errors.push(`Slide ${slide.id}: ${validation.violations.join(", ")}`);
      }
    }

    this.save();
    return { valid, invalid, errors };
  }
}

// Singleton instance
let registryInstance: SlideRegistryManager | null = null;

/**
 * Get the slide registry instance
 */
export function getSlideRegistry(): SlideRegistryManager {
  if (!registryInstance) {
    registryInstance = new SlideRegistryManager();
  }
  return registryInstance;
}

/**
 * Hook for React components
 */
export function useSlideRegistry() {
  return getSlideRegistry();
}
