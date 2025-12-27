import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Award, BookOpen, Users, Heart } from "lucide-react";

const values = [
  {
    icon: Award,
    title: "Academic Excellence",
    description: "Rigorous curriculum designed to challenge and inspire students to reach their full potential.",
  },
  {
    icon: BookOpen,
    title: "Holistic Education",
    description: "Balanced approach combining academics, arts, sports, and character development.",
  },
  {
    icon: Users,
    title: "Inclusive Community",
    description: "A welcoming environment where every student is valued and supported.",
  },
  {
    icon: Heart,
    title: "Values & Character",
    description: "Building integrity, respect, and leadership qualities in every student.",
  },
];

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-medium text-sm tracking-wider uppercase">
              About Us
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight">
              Shaping Futures
              <br />
              <span className="text-muted-foreground">Since 2016</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Hemeson Academy has been at the forefront of educational excellence for over 9 years. Our commitment to nurturing young minds goes beyond academics—we 
              develop well-rounded individuals prepared to make meaningful contributions to society.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              With state-of-the-art facilities, experienced educators, and a curriculum 
              that balances Nigerian and international standards, we provide an environment 
              where students thrive academically, socially, and emotionally.
            </p>
          </motion.div>

          {/* Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/about/about1.webp"
                    alt="Students in classroom"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                  <img 
                    src="/about/about2.webp"
                    alt="School library"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                  <img 
                    src="/about/about3.webp"
                    alt="School activities"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/about/about4.webp"
                    alt="Graduation"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            
            {/* Floating Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.5, type: "spring" }}
              className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-2xl shadow-xl"
            >
              <p className="text-3xl font-bold font-display">9+</p>
              <p className="text-sm opacity-90">Years of Excellence</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Values */}
        <div className="mt-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="group"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <value.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-semibold font-display mb-2">{value.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}