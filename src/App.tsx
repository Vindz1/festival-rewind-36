// src/App.tsx — routes simplifiées (sans festivals)
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

import Index from './pages/Index';
import History from './pages/History';
import Collection from './pages/Collection';
import Auth from './pages/Auth';

// Pages conservées telles quelles pour l'instant (lot 2 : passage au thème Vinyl)
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
            <Route path="/history" element={<History />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/success" element={<Success />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/partage" element={<Share />} />

            {/* Anciennes adresses : on redirige pour ne casser ni favoris ni référencement */}
            <Route path="/im-going" element={<Navigate to="/?tab=future" replace />} />
            <Route path="/festivals/*" element={<Navigate to="/?tab=future" replace />} />
            <Route path="/festival/*" element={<Navigate to="/?tab=future" replace />} />
            <Route path="/admin/*" element={<Navigate to="/" replace />} />

            {/* Tout le reste (/generate, /my-concerts, /shop, /hellfest-2026…) → accueil */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
