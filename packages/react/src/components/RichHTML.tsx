"use client";

import { useMemo } from "react";
import type { ComponentRenderProps } from "../renderer";
import DOMPurify from "isomorphic-dompurify";
import type { RichHTMLProps } from "@json-render/core";

export function RichHTML({ element }: ComponentRenderProps<RichHTMLProps>) {
  const { html, allowedTags, allowedAttributes, fallback } = element.props;

  const sanitizedHtml = useMemo(() => {
    try {
      const config: DOMPurify.Config = {};

      if (allowedTags) {
        config.ALLOWED_TAGS = allowedTags;
      }

      if (allowedAttributes) {
        config.ALLOWED_ATTR = Object.values(allowedAttributes).flat();
      }

      return DOMPurify.sanitize(html, config);
    } catch (error) {
      console.error("HTML sanitization failed:", error);
      return fallback ?? "";
    }
  }, [html, allowedTags, allowedAttributes, fallback]);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
