import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/AuthContext";

import Index from "./pages/Index";
import Festivals from "./pages/Festivals";
import Concerts from "./pages/Concerts";
import SearchResults from "./pages/SearchResults";
import EventPage from "./pages/EventPage";
import Generate from "./pages/Generate";
import MyConcerts from "./pages/MyConcerts";
import ImGoing from "./pages/ImGoing";
import Auth from "./pages/Auth";
import SpotifyCallback from "./pages/SpotifyCallback";
import HellfestPage from './pages/HellfestPage';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* AJOUTEZ AuthProvider ICI, POUR ENGLOBER TOUTES LES ROUTES */}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/festivals" element={<Festivals />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/event/:eventId" element={<EventPage />} />
            <Route path="/concerts" element={<Concerts />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/my-concerts" element={<MyConcerts />} />
            <Route path="/im-going" element={<ImGoing />} />
            <Route path="/spotify-callback" element={<SpotifyCallback />} />
            <Route path="/hellfest-2026" element={<HellfestPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
