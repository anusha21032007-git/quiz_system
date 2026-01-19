import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { QuizProvider } from "@/context/QuizContext";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import QuizPage from "./pages/QuizPage";
import Leaderboard from "./pages/Leaderboard";
import QuizPreviewPage from "./pages/QuizPreviewPage"; // New page import
import CoursesPage from "./pages/CoursesPage"; // Dedicated Courses page
import HistoryPage from "./pages/HistoryPage"; // Dedicated History page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <QuizProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/courses" element={<CoursesPage />} />
            <Route path="/teacher/history" element={<HistoryPage />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/quiz/:quizId" element={<QuizPage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/quiz-preview/:quizId" element={<QuizPreviewPage />} /> {/* New route for quiz preview */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </QuizProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;