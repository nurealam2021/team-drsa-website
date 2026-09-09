import type { Metadata, Viewport } from "next";
import "./globals.css";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Team DRSA | Cybersecurity, Infrastructure & Software",
    template: "%s | Team DRSA",
  },
  description:
    "Team DRSA provides cybersecurity, cloud, network and IT infrastructure services, technology consultancy, and custom software engineering.",
  applicationName: "Team DRSA",
  keywords: [
    "Team DRSA",
    "cybersecurity",
    "cloud security",
    "network security",
    "IT infrastructure",
    "software development",
    "IT consultancy",
  ],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Team DRSA",
    title: "Team DRSA",
    description: "Security-first technology, infrastructure, and custom software delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Team DRSA",
    description: "Security-first technology, infrastructure, and custom software delivery.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Team DRSA",
    url: siteUrl,
    logo: new URL("/logo/logo.png", siteUrl).toString(),
    description: "Cybersecurity, infrastructure, consultancy, and custom software engineering.",
  };

  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
        <AnalyticsBeacon />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
