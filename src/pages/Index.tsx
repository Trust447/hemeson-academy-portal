import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ProgramsSection } from "@/components/landing/ProgramsSection";
import { NewsSection } from "@/components/landing/NewsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { Footer } from "@/components/landing/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ProgramsSection />
      <NewsSection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}