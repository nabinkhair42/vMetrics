import { Hero } from "@/components/landing/Hero";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { Footer } from "@/components/landing/Footer";
import { pageSEO, getFAQStructuredData } from "@/config/seo-config";
import type { Metadata } from "next";

export const metadata: Metadata = pageSEO.home;

export default function LandingPage() {
  const faqStructuredData = getFAQStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
      <main className="min-h-screen bg-background">
        <Hero />
        <FeatureShowcase />
        <Footer />
      </main>
    </>
  );
}
