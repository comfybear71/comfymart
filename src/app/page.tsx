import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "ComfyMart",
      url: "https://comfymart.xyz",
      description:
        "AI-native marketing platform. Plug your project in; ComfyMart runs the campaign.",
      parentOrganization: {
        "@type": "Organization",
        name: "Comfybear",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "ComfyMart",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://comfymart.xyz",
      description:
        "Plug your project in. ComfyMart's AI builds, runs, and optimizes your entire marketing campaign — social, email, content, SEO.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Private beta waitlist — founder pricing at launch",
      },
    },
  ],
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <SocialProof />
      <FAQ />
      <Waitlist />
      <Footer />
    </main>
  );
}
