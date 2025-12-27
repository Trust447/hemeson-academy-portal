import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FlaskConical, Calculator, Globe, Palette, Dumbbell } from "lucide-react";

const programs = [
  {
    icon: Palette,
    title: "Primary & Early Years",
    levels: "Creche - Basic 5",
    description: "Foundational years focusing on early literacy, cognitive development, and preparation for secondary transition.",
    subjects: ["English", "R.N.V", "Phonics", "Mathematics", "Basic Science", "Cultural & Creative Arts"],
    color: "from-rose-500 to-red-600",
  },
  {
    icon: BookOpen,
    title: "Junior Secondary School",
    levels: "JSS 1 - JSS 3",
    description: "Foundation years focusing on core subjects, critical thinking, and personal development.",
    subjects: ["English", "Mathematics", "Basic Science & Tech.", "Religious & N.Values", "Cultural & Creative Arts",],
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: FlaskConical,
    title: "Senior Secondary - Science",
    levels: "SSS 1 - SSS 3",
    description: "Rigorous science track preparing students for engineering, medicine, and technology careers.",
    subjects: ["Physics", "Chemistry", "Biology", "Further Mathematics"],
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Calculator,
    title: "Senior Secondary - Commercial",
    levels: "SSS 1 - SSS 3",
    description: "Business-focused curriculum for future entrepreneurs and finance professionals.",
    subjects: ["Accounting", "Commerce", "Economics", "Marketing"],
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Globe,
    title: "Senior Secondary - Arts",
    levels: "SSS 1 - SSS 3",
    description: "Humanities track for future lawyers, journalists, and social scientists.",
    subjects: ["Literature", "Government", "History", "CRS"],
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: Dumbbell,
    title: "Sports & Athletics",
    levels: "All Levels",
    description: "Physical education and competitive sports programs building teamwork and discipline.",
    subjects: ["Football", "Games", "Athletics", "Running"],
    color: "from-cyan-500 to-blue-600",
  },
];

export function ProgramsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="programs" className="py-24 lg:py-32 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-medium text-sm tracking-wider uppercase">
            Academic Programs
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight">
            Pathways to Success
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Comprehensive programs designed to nurture diverse talents and prepare students 
            for success in their chosen fields.
          </p>
        </motion.div>

        {/* Programs Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program, index) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group cursor-pointer">
                <CardContent className="p-0">
                  {/* Gradient Header */}
                  <div className={`bg-gradient-to-r ${program.color} p-6 text-white relative overflow-hidden`}>
                    <motion.div
                      animate={{
                        scale: hoveredIndex === index ? 1.1 : 1,
                        rotate: hoveredIndex === index ? 5 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute -right-4 -top-4 opacity-20"
                    >
                      <program.icon className="h-32 w-32" />
                    </motion.div>
                    <div className="relative z-10">
                      <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                        <program.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold font-display">{program.title}</h3>
                      <p className="text-white/80 text-sm mt-1">{program.levels}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {program.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {program.subjects.map((subject) => (
                        <Badge 
                          key={subject} 
                          variant="secondary"
                          className="bg-slate-100 hover:bg-slate-200 transition-colors text-secondary"
                        >
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}