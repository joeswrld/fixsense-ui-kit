import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Diagnose from "./pages/Diagnose";
import Properties from "./pages/Properties";
import ApplianceDetail from "./pages/ApplianceDetail";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import ResultDemo from "./pages/ResultDemo";
import Result from "./pages/Result";
import History from "./pages/History";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/diagnose" element={<Diagnose />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/appliances/:id" element={<ApplianceDetail />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<Settings />} />
        <Route path="/result-demo" element={<ResultDemo />} />
        <Route path="/result/:id" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="/calendar" element={<Calendar />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
