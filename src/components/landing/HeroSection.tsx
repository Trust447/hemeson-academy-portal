import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"

        />
        <img
          src="/hemeson-hero-image.webp"
          alt="Students learning at Hemeson Academy"
          className="w-full h-full object-cover"
        />
       <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />

      </div>

      {/* Content */}
      <div className="relative container z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
        <div className="max-w-3xl">
          {/* Badge */}
          

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-display tracking-tight leading-[1.1] text-primary-foreground"
          >
            Where{" "}
            <span className="text-secondary">Excellence</span>
            <br />
            Meets Education
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-primary-foreground/80 max-w-xl leading-relaxed"
          >
             At Hemeson Academy, we combine academic excellence with moral values 
            to nurture well-rounded individuals ready to excel in a global world. 
            Join Aba's premier secondary school.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-4"
          >
           <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-lg bg-secondary hover:bg-sky-dark text-secondary-foreground transition-all" asChild>
              <Link to="/admissions">
                Enroll Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
           <Button 
              size="lg" 
              variant="outline" 
              className="rounded-full px-8 h-14 text-base border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/results">
                Check Results
              </Link>
            </Button>
          </motion.div>

        </div>


      </div>

      <div>
        
      </div>

    </section>
  );
}