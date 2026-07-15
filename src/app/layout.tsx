import type { Metadata } from "next";
import "./globals.css";
import AppToaster from "@/components/AppToaster";

export const metadata: Metadata = {
  metadataBase: new URL("https://comfymart.xyz"),
  title: {
    default: "ComfyMart — Marketing on autopilot",
    template: "%s · ComfyMart",
  },
  description:
    "Plug your project in. ComfyMart's AI builds, runs, and optimizes your entire marketing campaign — social, email, content, SEO. Set it and forget it.",
  keywords: [
    "AI marketing",
    "marketing automation",
    "social media scheduler",
    "email campaigns",
    "SEO content",
    "white-label marketing",
    "ComfyMart",
  ],
  authors: [{ name: "Comfybear" }],
  creator: "Comfybear",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "ComfyMart — Marketing on autopilot",
    description:
      "AI-native marketing for every project. Plug in, launch, grow. Resell under your brand.",
    url: "https://comfymart.xyz",
    siteName: "ComfyMart",
    type: "website",
    locale: "en_US",
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
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
