"use client";

import { TitleContent, COLORS } from "@/lib/schema";

interface TitleSlideProps {
  title: string;
  content: TitleContent;
}

export function TitleSlide({ title, content }: TitleSlideProps) {
  return (
    <div
      style={{
        width: 1280,
        height: 720,
        background: COLORS.background,
        display: "flex",
        padding: 60,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(4,76,115,0.3) 1px, transparent 0)",
          backgroundSize: "40px 40px",
          opacity: 0.5,
        }}
      />

      {/* Left Content */}
      <div
        style={{
          width: "60%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          zIndex: 10,
          paddingLeft: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 64,
            height: 64,
            border: `2px solid ${COLORS.navy}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            background: COLORS.background,
          }}
        >
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 36,
              color: COLORS.coral,
              fontWeight: 700,
            }}
          >
            M
          </span>
        </div>

        {/* Tag */}
        {content.tag && (
          <p
            style={{
              color: COLORS.coral,
              fontWeight: 700,
              letterSpacing: "0.2em",
              fontSize: 14,
              textTransform: "uppercase",
              marginBottom: 12,
              borderLeft: `4px solid ${COLORS.coral}`,
              paddingLeft: 20,
            }}
          >
            {content.tag}
          </p>
        )}

        {/* Title */}
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.text,
            lineHeight: 1.1,
            marginBottom: 16,
            paddingLeft: 24,
          }}
        >
          {title.split(" ").slice(0, 2).join(" ")}
          <br />
          {title.split(" ").slice(2).join(" ")}
        </h1>

        {/* Subtitle */}
        {content.subtitle && (
          <p
            style={{
              color: "#8db6b0",
              fontSize: 20,
              fontWeight: 300,
              letterSpacing: "0.05em",
              marginBottom: 32,
              paddingLeft: 24,
            }}
          >
            {content.subtitle}
          </p>
        )}

        {/* Bullets */}
        {content.bullets && (
          <div style={{ paddingLeft: 24 }}>
            {content.bullets.map((bullet, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    background:
                      i === content.bullets!.length - 1
                        ? COLORS.coral
                        : COLORS.navy,
                    transform: "rotate(45deg)",
                    marginRight: 16,
                  }}
                />
                <p
                  style={{
                    color:
                      i === content.bullets!.length - 1
                        ? COLORS.text
                        : COLORS.muted,
                    fontSize: 16,
                    fontWeight: i === content.bullets!.length - 1 ? 500 : 400,
                  }}
                >
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {content.footer && (
          <p
            style={{
              color: "#4e5d6c",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: 40,
              paddingLeft: 24,
            }}
          >
            {content.footer}
          </p>
        )}
      </div>

      {/* Right Visual */}
      <div
        style={{
          width: "40%",
          background: "#0b0f13",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Decorative number */}
        <span
          style={{
            position: "absolute",
            bottom: 48,
            right: 48,
            fontFamily: "Playfair Display, serif",
            fontSize: 128,
            color: COLORS.navy,
            opacity: 0.2,
            fontWeight: 700,
          }}
        >
          26
        </span>
      </div>
    </div>
  );
}
