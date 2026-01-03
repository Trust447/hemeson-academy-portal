import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const news = [
  {
    id: 1,
    image: "/news/news1.webp",
    category: "Academics",
    date: "March 12, 2025",
    title: "Pupils Show Strong Progress in Continuous Assessment",
    excerpt:
      "Our pupils demonstrated excellent improvement in literacy, numeracy, and critical thinking during the recent continuous assessment period.",
  },
  {
    id: 2,
    image: "/news/news2.webp",
    category: "Admissions",
    date: "January 10, 2026",
    title: "Admissions Now Open",
    excerpt: "We are now accepting applications for the new academic session. Limited spaces available.",
  },
  {
    id: 3,
    image: "/news/news3.webp",
    category: "Events",
    date: "March 5, 2025",
    title: "Cultural Day Celebration",
    excerpt:
      "Pupils celebrated Nigeria’s rich cultural heritage by dressing in traditional attire, performing cultural dances, and learning about different ethnic groups.",
  },
  {
    id: 4,
    image: "/news/news4.webp",
    category: "Events",
    date: "February 18, 2025",
    title: "Colour Day Activities",
    excerpt:
      "The school hosted Colour Day to help pupils learn colours through fun activities, creative artwork, and interactive classroom exercises.",
  },
  {
    id: 5,
    image: "/news/news5.webp",
    category: "Community",
    date: "November 22, 2025",
    title: "Parents–Teachers Forum Holds Successfully",
    excerpt:
      "The school hosted a productive parents–teachers meeting focused on student welfare, discipline, and academic growth.",
  },
];

export function NewsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setVisibleCards(1);
      else if (window.innerWidth < 1024) setVisibleCards(2);
      else setVisibleCards(3);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = news.length - visibleCards;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Achievements":
        return "bg-emerald-100 text-emerald-700";
      case "Events":
        return "bg-blue-100 text-blue-700";
      case "Admissions":
        return "bg-purple-100 text-purple-700";
      case "Community":
        return "bg-amber-100 text-amber-700";
      case "Facilities":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <section id="news" className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
        >
          <div>
            <span className="text-primary font-medium text-sm tracking-wider uppercase">
              News & Events
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight">
              Latest Updates
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full h-12 w-12" onClick={prevSlide}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-12 w-12" onClick={nextSlide}>
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </motion.div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <motion.div
            animate={{ x: `-${currentIndex * (100 / visibleCards)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 30 }}
            className="flex"
          >
            {news.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0"
                style={{ width: `${100 / visibleCards}%` }}
              >
                <Card className="mx-2 h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer bg-white">
                  <CardContent className="p-0">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={`${getCategoryColor(item.category)} border-0`}>
                          {item.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {item.date}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold font-display group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {item.excerpt}
                      </p>
                      <Link to={`/news/${item.id}`}>
                        <Button variant="ghost" size="sm" className="mt-4 -ml-3 text-primary">
                          Read More <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${index === currentIndex ? "w-8 bg-primary" : "w-2.5 bg-slate-200"
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
