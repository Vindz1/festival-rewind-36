import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, Zap, Crown, User, ArrowRight, Music, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Index() {
  const [query, setQuery] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleProfileConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('setlistfm_username', username.trim());
      navigate('/my-concerts');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans selection:bg-[#4d94ff] selection:text-white">
      <Header />

      {/* --- 1. HERO MASSIF --- */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4d94ff] rounded-full blur-[200px] opacity-10 pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-5xl text-center space-y-10 animate-in fade-in zoom-in duration-700">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] bg-[#1a1a1a]/50 backdrop-blur text-sm font-bold uppercase tracking-widest text-[#a0a0a0]">
            <span className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse"/> Compatible Spotify • Deezer • Apple
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-9xl font-black italic text-white leading-[0.85] tracking-tighter uppercase">
            Vos Concerts.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] via-[#a361ff] to-[#ff4d94]">En Playlist.</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#888] max-w-3xl mx-auto font-medium leading-relaxed">
            L'outil ultime pour transformer vos souvenirs de concerts en playlists réelles. Setlists exactes, import instantané.
          </p>

          {/* BARRE DE RECHERCHE CENTRALE */}
          <div className="max-w-2xl mx-auto w-full pt-8">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#666] w-6 h-6 group-focus-within:text-[#4d94ff] transition-colors" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Quel artiste ou festival ?" 
                className="h-20 pl-16 pr-36 bg-[#1a1a1a] border border-[#333] text-xl rounded-full focus:ring-4 focus:ring-[#4d94ff]/20 focus:border-[#4d94ff] transition-all shadow-2xl placeholder:text-[#444]"
              />
              <Button type="submit" className="absolute right-3 top-2 bottom-2 px-8 rounded-full bg-[#4d94ff] hover:bg-white hover:text-black font-black italic uppercase transition-all text-lg shadow-lg shadow-blue-500/20">
                GO
              </Button>
            </form>
            <div className="mt-4 flex justify-center gap-4 text-xs font-bold uppercase tracking-widest text-[#444]">
              <span>Essayez :</span>
              <button onClick={() => navigate('/search?q=Metallica')} className="hover:text-white transition-colors">Metallica</button>
              <button onClick={() => navigate('/search?q=Hellfest')} className="hover:text-white transition-colors">Hellfest</button>
              <button onClick={() => navigate('/search?q=Muse')} className="hover:text-white transition-colors">Muse</button>
            </div>
          </div>
        </div>
      </section>


      {/* --- 2. IMPORT RAPIDE (PROFIL) --- */}
      <section className="py-24 bg-[#161616] border-y border-[#222]">
        <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase leading-none">
                        Déjà sur <br/><span className="text-[#88c446]">Setlist.fm</span> ?
                    </h2>
                    <p className="text-xl text-[#a0a0a0]">
                        Connectez votre compte pour importer automatiquement tout votre historique de concerts.
                    </p>
                    
                    <form onSubmit={handleProfileConnect} className="flex gap-3 max-w-md">
                        <div className="relative flex-1">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" />
                            <Input 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Votre pseudo Setlist.fm" 
                                className="h-14 pl-12 bg-[#000] border-[#333] rounded-xl focus:border-[#88c446]"
                            />
                        </div>
                        <Button type="submit" className="h-14 px-6 bg-[#88c446] hover:bg-[#a0e050] text-black font-bold rounded-xl">
                            <ArrowRight />
                        </Button>
                    </form>
                </div>
                {/* Visuel abstrait import */}
                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-[#333] relative overflow-hidden group hover:border-[#88c446] transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Music size={100} /></div>
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-4 p-3 bg-black/50 rounded-lg border border-[#333]">
                            <div className="w-10 h-10 bg-[#333] rounded-full"/>
                            <div className="h-2 w-32 bg-[#333] rounded-full"/>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-black/50 rounded-lg border border-[#333] translate-x-4">
                            <div className="w-10 h-10 bg-[#333] rounded-full"/>
                            <div className="h-2 w-24 bg-[#333] rounded-full"/>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-black/50 rounded-lg border border-[#333]">
                            <div className="w-10 h-10 bg-[#333] rounded-full"/>
                            <div className="h-2 w-40 bg-[#333] rounded-full"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>


      {/* --- 3. PRICING (Aéré et Clair) --- */}
      <section className="py-32 px-6 max-w-7xl mx-auto w-full" id="pricing">
        <div className="text-center mb-24 space-y-6">
          <h2 className="text-5xl md:text-7xl font-black italic uppercase">L'Export Universel</h2>
          <p className="text-[#a0a0a0] text-xl font-medium max-w-2xl mx-auto">
            Setlive est gratuit pour explorer. Créez un compte pour sauvegarder vos souvenirs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* VISITEUR */}
          <div className="group p-8 rounded-[2rem] border border-[#333] hover:border-[#666] transition-all bg-[#1a1a1a] flex flex-col min-h-[500px]">
            <div className="mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-[#333] text-xs font-bold uppercase tracking-widest text-[#a0a0a0] mb-4">Découverte</span>
                <h3 className="text-4xl font-black italic uppercase">Visiteur</h3>
                <div className="text-xl text-[#666] mt-2 font-bold">Gratuit</div>
            </div>
            <ul className="space-y-6 flex-grow">
                <li className="flex gap-3 text-[#a0a0a0]"><Check className="text-white shrink-0"/> Recherche illimitée</li>
                <li className="flex gap-3 text-[#a0a0a0]"><Check className="text-white shrink-0"/> Visualisation des setlists</li>
                <li className="flex gap-3 text-[#444] line-through"><Zap className="shrink-0"/> Export Playlist</li>
                <li className="flex gap-3 text-[#444] line-through"><Zap className="shrink-0"/> Sauvegarde historique</li>
            </ul>
            <Button onClick={() => window.scrollTo(0,0)} variant="outline" className="w-full h-14 mt-8 border-[#333] hover:bg-white hover:text-black font-bold uppercase tracking-widest">
                Essayer
            </Button>
          </div>

          {/* MEMBRE (Populaire) */}
          <div className="p-8 rounded-[2rem] border-2 border-[#4d94ff] bg-[#1a1a1a] flex flex-col min-h-[500px] relative shadow-[0_0_50px_rgba(77,148,255,0.1)] scale-105 z-10">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#4d94ff] text-white px-6 py-1 rounded-full text-xs font-black uppercase tracking-widest italic shadow-lg">
                Recommandé
            </div>
            <div className="mb-8">
                <h3 className="text-4xl font-black italic uppercase text-white">Compte Gratuit</h3>
                <div className="text-xl text-[#4d94ff] mt-2 font-bold">0€ / mois</div>
            </div>
            <ul className="space-y-6 flex-grow">
                <li className="flex gap-3 text-white"><Check className="text-[#4d94ff] shrink-0"/> <strong>2 Exports / mois</strong></li>
                <li className="flex gap-3 text-white"><Check className="text-[#4d94ff] shrink-0"/> Historique illimité</li>
                <li className="flex gap-3 text-white"><Check className="text-[#4d94ff] shrink-0"/> Synchronisation Setlist.fm</li>
                <li className="flex gap-3 text-[#a0a0a0] text-sm italic pl-8">Publicités activées</li>
            </ul>
            <Button onClick={() => navigate('/auth')} className="w-full h-14 mt-8 bg-[#4d94ff] hover:bg-white hover:text-black text-white font-black italic uppercase tracking-widest text-lg shadow-lg shadow-blue-900/20">
                Créer un compte
            </Button>
          </div>

          {/* PREMIUM */}
          <div className="group p-8 rounded-[2rem] border border-[#333] bg-gradient-to-b from-[#1a1a1a] to-[#222] flex flex-col min-h-[500px] hover:border-yellow-500/50 transition-all">
            <div className="mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold uppercase tracking-widest text-yellow-500 mb-4 flex w-fit items-center gap-2">
                    <Crown size={12}/> Premium
                </span>
                <h3 className="text-4xl font-black italic uppercase text-white">Supporter</h3>
                <div className="text-xl text-yellow-500 mt-2 font-bold">5€ / an</div>
            </div>
            <ul className="space-y-6 flex-grow">
                <li className="flex gap-3 text-white"><Check className="text-yellow-500 shrink-0"/> <strong>Exports Illimités</strong></li>
                <li className="flex gap-3 text-white"><Check className="text-yellow-500 shrink-0"/> Zéro Publicité</li>
                <li className="flex gap-3 text-white"><Check className="text-yellow-500 shrink-0"/> Badge Supporter</li>
                <li className="flex gap-3 text-white"><Check className="text-yellow-500 shrink-0"/> Support prioritaire</li>
            </ul>
            <Button onClick={() => navigate('/subscription')} className="w-full h-14 mt-8 bg-[#333] hover:bg-yellow-500 hover:text-black text-white font-bold uppercase tracking-widest">
                Devenir Premium
            </Button>
          </div>

        </div>

        {/* Note de bas de page */}
        <div className="mt-20 text-center">
            <p className="text-[#666] text-sm flex items-center justify-center gap-2">
                <ShieldCheck size={16}/> Paiement sécurisé via Stripe. Annulation à tout moment.
            </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
