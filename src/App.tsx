import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Festivals from "./pages/Festivals";
import Concerts from "./pages/Concerts";
import FestivalConcerts from "./pages/FestivalConcerts";
import Generate from "./pages/Generate";
import MyConcerts from "./pages/MyConcerts";
import Auth from "./pages/Auth";
import SpotifyCallback from "./pages/SpotifyCallback";
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
          <Route path="/festivals" element={<Festivals />} />
          <Route path="/festivals/:festivalId" element={<FestivalConcerts />} />
          <Route path="/concerts" element={<Concerts />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/my-concerts" element={<MyConcerts />} />
          <Route path="/spotify-callback" element={<SpotifyCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
