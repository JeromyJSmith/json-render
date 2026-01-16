"use client";

export { Chart } from "./Chart";
export { Markdown } from "./Markdown";
export { RichHTML } from "./RichHTML";
export { Heading } from "./Heading";
export { Paragraph } from "./Paragraph";
export { Callout } from "./Callout";
export { Quote } from "./Quote";
export { CodeBlock } from "./CodeBlock";

import { Chart } from "./Chart";
import { Markdown } from "./Markdown";
import { RichHTML } from "./RichHTML";
import { Heading } from "./Heading";
import { Paragraph } from "./Paragraph";
import { Callout } from "./Callout";
import { Quote } from "./Quote";
import { CodeBlock } from "./CodeBlock";

/**
 * Pre-built registry for content components.
 * Spread this into your component registry to include all content components.
 *
 * @example
 * ```tsx
 * import { contentComponentRegistry } from "@json-render/react";
 *
 * const registry = {
 *   ...contentComponentRegistry,
 *   ...myCustomComponents,
 * };
 *
 * <Renderer tree={tree} registry={registry} />
 * ```
 */
export const contentComponentRegistry = {
  Chart,
  Markdown,
  RichHTML,
  Heading,
  Paragraph,
  Callout,
  Quote,
  CodeBlock,
};
