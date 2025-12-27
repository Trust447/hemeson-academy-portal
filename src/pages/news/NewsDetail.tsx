import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, ArrowRight } from "lucide-react";
import { news } from "@/lib/newsdata";

export default function NewsDetail() {
  const { id } = useParams();

  // 1. Find the specific article based on the URL ID
  const article = news.find((item) => item.id === id);

  // 2. Get the "More News" (any news that isn't the current one)
  const relatedNews = news
    .filter((item) => item.id !== id)
    .slice(0, 3);

  if (!article) {
    return (
      <div className="py-32 text-center">
        <h2 className="text-2xl font-bold">Article not found</h2>
        <Link to="/">
          <Button variant="link">Return to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="pt-32 pb-16 max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/">
            <Button variant="ghost" className="mb-8 group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
              Back to Home
            </Button>
          </Link>
        </motion.div>

        <img 
          src={article.image} 
          alt={article.title} 
          className="w-full h-[300px] md:h-[450px] object-cover rounded-3xl mb-10 shadow-xl" 
        />

        <div className="flex items-center gap-4 mb-6">
          <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">
            {article.category}
          </span>
          <div className="flex items-center text-slate-500 text-sm font-medium">
            <Calendar className="mr-2 h-4 w-4" />
            {article.date}
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold font-display mb-8 leading-tight">
          {article.title}
        </h1>
        
        <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed space-y-6">
          {/* We use the excerpt as a bold intro */}
          <p className="text-xl font-medium text-slate-900 border-l-4 border-primary pl-6 py-2">
            {article.excerpt}
          </p>
          
          {/* We use the content field for the full body */}
          <p className="whitespace-pre-line">
            {article.content}
          </p>
        </div>
      </div>

      {/* --- MORE NEWS SECTION --- */}
      <div className="bg-slate-50 py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display mb-10">More School News</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedNews.map((item) => (
              <motion.div key={item.id} whileHover={{ y: -5 }}>
                <Card className="h-full border-0 shadow-md overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <img src={item.image} className="w-full aspect-video object-cover" alt={item.title} />
                    <div className="p-6">
                      <h4 className="font-bold text-lg mb-3 line-clamp-2">{item.title}</h4>
                      {/* Using the item.id here ensures the link works when clicked */}
                      <Link to={`/news/${item.id}`}>
                        <Button variant="link" className="p-0 h-auto text-primary font-bold group">
                          Read Story 
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}