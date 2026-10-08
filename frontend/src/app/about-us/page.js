import {
  Leaf,
  Target,
  Eye,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Hero from "../components/aboutus/hero";
import AboutUsSection from "../components/aboutus/aboutus";
import MissionVision from "../components/aboutus/mission-vision";
import FAQAbout from "../components/aboutus/faq";
export default function AboutUs() {



  return (
    <main className="w-full overflow-hidden bg-[#f4fff4]">

      <Hero />
      <AboutUsSection />
      <MissionVision />
      <FAQAbout />
      
    </main>
  );
}