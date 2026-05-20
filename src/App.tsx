// src/App.tsx - VERSION SIMPLIFIÉE AVEC ROUTING DYNAMIQUE
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
import Shop from './pages/Shop';
import Subscription from './pages/Subscription';
import Legal from './pages/Legal';
import Profile from './pages/Profile';
import Search from './pages/Search';
import History from './pages/History';
import NotFound from "./pages/NotFound";
import FestivalsPage from '@/pages/FestivalsPage';
import FestivalDetailPage from '@/pages/FestivalDetailPage';

// ✨ NOUVELLE PAGE DYNAMIQUE QUI REMPLACE TOUTES LES PAGES STATIQUES
import FestivalDynamicPage from '@/pages/FestivalDynamicPage';

// ✨ NOUVELLE PAGE ADMIN
import AdminFestivals from '@/pages/AdminFestivals';

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
            
            {/* ✨ PAGE ADMIN - Accessible uniquement aux utilisateurs authentifiés */}
            <Route path="/admin/festivals" element={<AdminFestivals />} />
            
            {/* Pages festivals */}
            <Route path="/festivals" element={<FestivalsPage />} />
            <Route path="/festivals/:festivalId" element={<FestivalDetailPage />} />
            
            {/* ✨ ROUTING DYNAMIQUE - UNE SEULE ROUTE POUR TOUS LES FESTIVALS ! */}
            {/* Plus besoin d'ajouter manuellement chaque festival ici */}
            <Route path="/festival/:slug" element={<FestivalDynamicPage />} />
            
            {/* ✨ REDIRECTIONS POUR COMPATIBILITÉ AVEC LES ANCIENNES URLs */}
            {/* Ces routes redirigent les anciennes URLs vers le nouveau format */}
            <Route path="/hellfest-2026" element={<FestivalDynamicPage />} />
            <Route path="/wacken-2026" element={<FestivalDynamicPage />} />
            <Route path="/motocultor-2026" element={<FestivalDynamicPage />} />
            <Route path="/rock-am-ring-2026" element={<FestivalDynamicPage />} />
            <Route path="/lollapalooza-chile-2026" element={<FestivalDynamicPage />} />
            <Route path="/graspop-2026" element={<FestivalDynamicPage />} />
            <Route path="/alcatraz-2026" element={<FestivalDynamicPage />} />
            <Route path="/heavy-weekend-2026" element={<FestivalDynamicPage />} />
            <Route path="/rock-en-seine-2026" element={<FestivalDynamicPage />} />
            <Route path="/sylak-open-air-2026" element={<FestivalDynamicPage />} />
            <Route path="/planer-fest-2026" element={<FestivalDynamicPage />} />
            <Route path="/du-rock-chinon-rien-2026" element={<FestivalDynamicPage />} />
            <Route path="/betizfest-2026" element={<FestivalDynamicPage />} />
            <Route path="/on-na-plus-20-ans-2026" element={<FestivalDynamicPage />} />
            <Route path="/angry-burger-2026" element={<FestivalDynamicPage />} />
            <Route path="/download-uk-2026" element={<FestivalDynamicPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <ShareFloatingButton />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

/*
✨ AVANTAGES DE CETTE NOUVELLE ARCHITECTURE :

1. ❌ AVANT : 
   - Un fichier .tsx par festival (HellfestPage.tsx, WackenPage.tsx...)
   - Un fichier .ts de données par festival (hellfestData.ts, wackenData.ts...)
   - Modification manuelle d'App.tsx pour chaque ajout/suppression

2. ✅ MAINTENANT :
   - UNE SEULE page dynamique pour TOUS les festivals
   - Données dans Supabase (modifiables via l'interface admin)
   - AUCUNE modification de code nécessaire pour ajouter un festival

3. 🚀 POUR AJOUTER UN NOUVEAU FESTIVAL :
   - Va sur /admin/festivals
   - Clique sur "Nouveau Festival"
   - Remplis le formulaire
   - C'est tout ! Le festival est immédiatement accessible

4. 🛠️ POUR MODIFIER UN LINE-UP :
   - Va sur /admin/festivals
   - Sélectionne le festival
   - Modifie les artistes
   - Changements visibles instantanément

5. 🗑️ FICHIERS À SUPPRIMER (devenues inutiles) :
   - src/pages/HellfestPage.tsx
   - src/pages/WackenPage.tsx
   - src/pages/MotocultorPage.tsx
   - ... (tous les fichiers *Page.tsx de festivals)
   - src/data/hellfestData.ts
   - src/data/wackenData.ts
   - ... (tous les fichiers *Data.ts)
*/
