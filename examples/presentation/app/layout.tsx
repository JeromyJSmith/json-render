import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MARPA | AI-Powered Presentation System",
  description:
    "MARPA Strategic Ownership Transition - Interactive presentation with ElevenLabs narration and AI-powered Q&A assistant.",
  icons: {
    icon: "/marpa_favicon.ico",
    shortcut: "/marpa_favicon.ico",
    apple: "/marpa_favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/marpa_favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
