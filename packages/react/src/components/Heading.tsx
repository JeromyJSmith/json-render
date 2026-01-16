"use client";

import type { ComponentRenderProps } from "../renderer";
import type { HeadingProps } from "@json-render/core";

const sizes: Record<string, string> = {
  h1: "2.5rem",
  h2: "2rem",
  h3: "1.5rem",
  h4: "1.25rem",
  h5: "1rem",
  h6: "0.875rem",
};

const weights: Record<string, number> = {
  h1: 700,
  h2: 700,
  h3: 600,
  h4: 600,
  h5: 600,
  h6: 600,
};

export function Heading({ element }: ComponentRenderProps<HeadingProps>) {
  const { text, level, id } = element.props;
  const tag = level || "h2";

  const style = {
    fontSize: sizes[tag],
    fontWeight: weights[tag],
    margin: "1em 0 0.5em",
    lineHeight: 1.3,
  };

  switch (tag) {
    case "h1":
      return (
        <h1 id={id ?? undefined} style={style}>
          {text}
        </h1>
      );
    case "h2":
      return (
        <h2 id={id ?? undefined} style={style}>
          {text}
        </h2>
      );
    case "h3":
      return (
        <h3 id={id ?? undefined} style={style}>
          {text}
        </h3>
      );
    case "h4":
      return (
        <h4 id={id ?? undefined} style={style}>
          {text}
        </h4>
      );
    case "h5":
      return (
        <h5 id={id ?? undefined} style={style}>
          {text}
        </h5>
      );
    case "h6":
      return (
        <h6 id={id ?? undefined} style={style}>
          {text}
        </h6>
      );
    default:
      return (
        <h2 id={id ?? undefined} style={style}>
          {text}
        </h2>
      );
  }
}
