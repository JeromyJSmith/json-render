import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MARPA Presentation",
  description: "MARPA Equity Pathway 2026 - Interactive Presentation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
