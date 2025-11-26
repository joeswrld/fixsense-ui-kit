import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Diagnose from "./pages/Diagnose";
import Properties from "./pages/Properties";
import ApplianceDetail from "./pages/ApplianceDetail";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import ResultDemo from "./pages/ResultDemo";
import Result from "./pages/Result";
import History from "./pages/History";
import VendorCalendar from "./pages/VendorCalendar";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/pricing" element={<Pricing />} />
          
          {/* Onboarding route - only accessible when not completed */}
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Protected routes - require onboarding completion */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/diagnose" element={<ProtectedRoute><Diagnose /></ProtectedRoute>} />
          <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
          <Route path="/appliances/:id" element={<ProtectedRoute><ApplianceDetail /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/result-demo" element={<ProtectedRoute><ResultDemo /></ProtectedRoute>} />
          <Route path="/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/vendor-calendar" element={<ProtectedRoute><VendorCalendar /></ProtectedRoute>} />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;