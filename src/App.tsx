"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFound from "./pages/NotFound";
import { QuizProvider } from "@/context/QuizContext";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import QuizPage from "./pages/QuizPage";
import Leaderboard from "./pages/Leaderboard";
import QuizPreviewPage from "./pages/QuizPreviewPage";
import CoursesPage from "./pages/CoursesPage";
import HistoryPage from "./pages/HistoryPage";
import TeacherSignup from "./pages/teacher/Signup";
import GenerateQuizLanding from "./components/teacher/GenerateQuizLanding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <QuizProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<Navigate to="/login" replace />} />
              <Route path="/teacher/signup" element={<Navigate to="/login" replace />} />
              <Route path="/teacher/login" element={<Navigate to="/login" replace />} />
              <Route path="/student/login" element={<Navigate to="/login" replace />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Auth Routes */}


              {/* Teacher Protected Routes */}
              <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="/teacher/dashboard" element={<AuthGuard allowedRole="teacher"><TeacherDashboard /></AuthGuard>} />
              <Route path="/teacher/courses" element={<AuthGuard allowedRole="teacher"><CoursesPage /></AuthGuard>} />
              <Route path="/teacher/create-quiz" element={<AuthGuard allowedRole="teacher"><GenerateQuizLanding /></AuthGuard>} />
              <Route path="/teacher/history" element={<AuthGuard allowedRole="teacher"><HistoryPage /></AuthGuard>} />

              {/* Student Protected Routes */}
              <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
              <Route path="/student/dashboard" element={<AuthGuard allowedRole="student"><StudentDashboard /></AuthGuard>} />
              <Route path="/quiz/:quizId" element={<AuthGuard allowedRole="student"><QuizPage /></AuthGuard>} />

              {/* Shared Protected Routes */}
              <Route path="/leaderboard" element={<AuthGuard><Leaderboard /></AuthGuard>} />
              <Route path="/quiz-preview/:quizId" element={<AuthGuard allowedRole="teacher"><QuizPreviewPage /></AuthGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </QuizProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;