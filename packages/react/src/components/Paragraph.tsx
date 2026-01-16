"use client";

import type { ComponentRenderProps } from "../renderer";
import type { ParagraphProps } from "@json-render/core";

export function Paragraph({ element }: ComponentRenderProps<ParagraphProps>) {
  const { text, align } = element.props;

  return (
    <p
      style={{
        textAlign: align ?? "left",
        margin: "1em 0",
        lineHeight: 1.7,
      }}
    >
      {text}
    </p>
  );
}
