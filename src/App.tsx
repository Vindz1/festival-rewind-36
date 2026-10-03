// src/App.tsx — routes simplifiées
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

import Index from './pages/Index';
import FestivalsPage from './pages/FestivalsPage';
import FestivalDynamicPage from './pages/FestivalDynamicPage';
import History from './pages/History';
import Collection from './pages/Collection';
import AdminFestivals from './pages/AdminFestivals';

// Pages conservées telles quelles pour l'instant (lot 2 : passage au thème Vinyl)
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Success from './pages/Success';
import Legal from './pages/Legal';
import Share from './pages/Share';

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
            <Route path="/festivals" element={<FestivalsPage />} />
            <Route path="/festivals/:slug" element={<FestivalDynamicPage />} />
            <Route path="/festival/:slug" element={<FestivalDynamicPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/collection" element={<Collection />} />

            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/success" element={<Success />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/partage" element={<Share />} />
            <Route path="/admin/festivals" element={<AdminFestivals />} />

            {/* Anciennes adresses : on redirige pour ne casser ni favoris ni référencement */}
            <Route path="/generate" element={<Navigate to="/" replace />} />
            <Route path="/search" element={<Navigate to="/" replace />} />
            <Route path="/search-results" element={<Navigate to="/" replace />} />
            <Route path="/my-concerts" element={<Navigate to="/" replace />} />
            <Route path="/im-going" element={<Navigate to="/?tab=future" replace />} />
            <Route path="/concerts" element={<Navigate to="/festivals" replace />} />
            <Route path="/event/:eventId" element={<Navigate to="/" replace />} />
            <Route path="/spotify-callback" element={<Navigate to="/" replace />} />
            <Route path="/shop" element={<Navigate to="/" replace />} />
            <Route path="/tickets" element={<Navigate to="/" replace />} />
            <Route path="/merch" element={<Navigate to="/" replace />} />

            {/* /hellfest-2026, /wacken-2026… : n'importe quel slug de festival en base (ou retour à la liste) */}
            <Route path="/:slug" element={<FestivalDynamicPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
