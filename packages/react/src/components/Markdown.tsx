"use client";

import { useMemo } from "react";
import type { ComponentRenderProps } from "../renderer";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import type { MarkdownProps } from "@json-render/core";

export function Markdown({ element }: ComponentRenderProps<MarkdownProps>) {
  const { content, allowedTags, className } = element.props;

  const sanitizedHtml = useMemo(() => {
    // Parse markdown to HTML
    const rawHtml = marked.parse(content, { async: false }) as string;

    // Sanitize with DOMPurify
    const purifyConfig = allowedTags
      ? { ALLOWED_TAGS: allowedTags }
      : undefined;

    return DOMPurify.sanitize(rawHtml, purifyConfig);
  }, [content, allowedTags]);

  return (
    <div
      className={className ?? undefined}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      style={{ lineHeight: 1.7 }}
    />
  );
}
