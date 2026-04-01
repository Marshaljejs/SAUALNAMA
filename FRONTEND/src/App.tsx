import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SurveyProvider } from "@/context/SurveyContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import SurveyList from "./pages/SurveyList";
import TakeSurvey from "./pages/TakeSurvey";
import Results from "./pages/Results";
import AdminPanel from "./pages/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import MySurveys from "./pages/MySurveys";
import NotFound from "./pages/NotFound";
import bgImage from "@/assets/bg.jpg";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SurveyProvider>
          <Toaster />
          <Sonner />
          <div
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
              minHeight: "100vh",
            }}
          >
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/surveys" element={<SurveyList />} />
                <Route path="/survey/:id" element={<TakeSurvey />} />
                <Route path="/results" element={<Results />} />
                <Route path="/my-surveys" element={<MySurveys />} />
                <Route path="/create" element={<AdminPanel />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </SurveyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;