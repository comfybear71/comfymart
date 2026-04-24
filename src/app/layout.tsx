import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://comfymart.xyz"),
  title: "ComfyMart — Marketing on autopilot",
  description:
    "Plug your project in. ComfyMart's AI builds, runs, and optimizes your entire marketing campaign — social, email, content, SEO. Set it and forget it.",
  openGraph: {
    title: "ComfyMart — Marketing on autopilot",
    description:
      "AI-native marketing for every project. Plug in, launch, grow.",
    url: "https://comfymart.xyz",
    siteName: "ComfyMart",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ComfyMart — Marketing on autopilot",
    description:
      "AI-native marketing for every project. Plug in, launch, grow.",
  },
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
