import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SessionsPage from "./pages/admin/SessionsPage";
import StudentsPage from "./pages/admin/StudentsPage";
import TokensPage from "./pages/admin/TokensPage";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Teacher Pages
import TeacherTokenEntry from "./pages/teacher/TokenEntry";
import ScoreEntry from "./pages/teacher/ScoreEntry";
import SubmissionSuccess from "./pages/teacher/SubmissionSuccess";

// Results Portal
import ResultsPortal from "./pages/results/ResultsPortal";

// Public Forms
import AdmissionPage from "./pages/forms/Admission";
import ContactPage from "./pages/forms/Contact";

// --- NEW IMPORT HERE ---
import NewsDetail from "./pages/news/NewsDetail";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* --- NEW NEWS ROUTE HERE --- */}
            <Route path="/news/:id" element={<NewsDetail />} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherTokenEntry />} />
            <Route path="/teacher/scores" element={<ScoreEntry />} />
            <Route path="/teacher/success" element={<SubmissionSuccess />} />
            
            {/* Results Portal */}
            <Route path="/results" element={<ResultsPortal />} />

            {/* Public Forms */}
            <Route path="/admissions" element={<AdmissionPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            {/* Admin Routes - Protected */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="sessions" element={<SessionsPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="tokens" element={<TokensPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;