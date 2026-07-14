import { TopNav } from "@/shared/components/layout/top-nav";
import { Footer } from "@/shared/components/layout/footer";
import { HeroBand } from "./hero-band";
import { FeatureGrid } from "./feature-grid";
import { CtaBand } from "./cta-band";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopNav />
      <main className="flex-1 flex flex-col">
        <HeroBand />
        <FeatureGrid />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
