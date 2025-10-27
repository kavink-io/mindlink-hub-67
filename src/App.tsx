// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AskQuestion from "./pages/AskQuestion";
import QuestionDetail from "./pages/QuestionDetail";
import AddAnswer from "./pages/AddAnswer"; // <-- Import the new component
import UploadNote from "./pages/UploadNote";
import FocusTimer from "./pages/FocusTimer";
import RelaxRoom from "./pages/RelaxRoom";
import CreateQuiz from "./pages/CreateQuiz";
import QuizList from "./pages/QuizList";
import TakeQuiz from "./pages/TakeQuiz";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/ask" element={<AskQuestion />} />
          <Route path="/questions/:id" element={<QuestionDetail />} />
          <Route path="/questions/:id/answer" element={<AddAnswer />} /> {/* <-- Add this route */}
          <Route path="/notes/upload" element={<UploadNote />} />
          <Route path="/timer" element={<FocusTimer />} />
          <Route path="/relax" element={<RelaxRoom />} />
          <Route path="/quiz/create" element={<CreateQuiz />} />
          <Route path="/quizzes" element={<QuizList />} />{/* <-- Add route */}
          <Route path="/quizzes/:id/take" element={<TakeQuiz />} />
          {/* <Route path="/quizzes/:id/take" element={<TakeQuiz />} /> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;