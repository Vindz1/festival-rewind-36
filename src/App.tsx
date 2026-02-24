import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Success from './pages/Success';
import Share from '@/pages/Share';
import { ShareFloatingButton } from '@/components/ShareFloatingButton';
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
import Legal from './pages/Legal';
import Profile from './pages/Profile';
import Search from './pages/Search';
import History from './pages/History';
import NotFound from "./pages/NotFound";
import FestivalsPage from '@/pages/FestivalsPage';
import FestivalDetailPage from '@/pages/FestivalDetailPage';
import DownloadPage from '@/pages/DownloadPage';
import WackenPage from '@/pages/WackenPage';
import MotocultorPage from '@/pages/MotocultorPage';
import RockAmRingPage from '@/pages/RockAmRingPage';
import LollapaloozaChilePage from '@/pages/LollapaloozaChilePage';
import GraspopPage from './pages/Graspop';
import AlcatrazPage from './pages/Alcatraz';

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
            <Route path="/success" element={<Success />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/history" element={<History />} />
            <Route path="/partage" element={<Share />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/festivals" element={<FestivalsPage />} />
            <Route path="/festivals/:festivalId" element={<FestivalDetailPage />} />
            <Route path="/download-uk-2026" element={<DownloadPage />} />
            <Route path="/wacken-2026" element={<WackenPage />} />
            <Route path="/motocultor-2026" element={<MotocultorPage />} />
            <Route path="/rock-am-ring-2026" element={<RockAmRingPage />} />
            <Route path="/lollapalooza-chile-2026" element={<LollapaloozaChilePage />} />
            <Route path="/graspop-2026" element={<GraspopPage />} />
            <Route path="/alcatraz-2026" element={<AlcatrazPage />} />
          </Routes>
          
          {/* Bouton flottant sur toutes les pages */}
          <ShareFloatingButton />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
