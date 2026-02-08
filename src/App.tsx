import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Success from './pages/Success';

// IMPORT CRITIQUE : Utilise le chemin relatif direct
import { AuthProvider } from "./AuthContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Concerts from "./pages/Concerts";
import SearchResults from "./pages/SearchResults";
import EventPage from "./pages/EventPage";
import Generate from "./pages/Generate";
import MyConcerts from "./pages/MyConcerts";
import ImGoing from "./pages/ImGoing";
import SpotifyCallback from "./pages/SpotifyCallback";
import HellfestPage from './pages/HellfestPage';
import Shop from './pages/Shop';
import Subscription from './pages/Subscription';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/event/:eventId" element={<EventPage />} />
            <Route path="/concerts" element={<Concerts />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/my-concerts" element={<MyConcerts />} />
            <Route path="/im-going" element={<ImGoing />} />
            <Route path="/spotify-callback" element={<SpotifyCallback />} />
            <Route path="/hellfest-2026" element={<HellfestPage />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/tickets" element={<Shop />} />
            <Route path="/merch" element={<Shop />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/success" element={<Success />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
