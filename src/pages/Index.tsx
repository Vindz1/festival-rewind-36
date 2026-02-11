import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, Crown, User, ArrowRight, Music, ShieldCheck, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#4d94ff] selection:text-white">
      <Header />

      {/* --- 1. HERO SECTION (Noir Profond) --- */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden pt-20 border-b border-[#111]">
        
        {/* Effet de fond subtil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4d94ff] rounded-full blur-[250px] opacity-[0.08] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-6xl text-center space-y-12 animate-in fade-in zoom-in duration-700">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#222] bg-[#0a0a0a] backdrop-blur text-xs font-bold uppercase tracking-widest text-[#666]">
            <span className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse shadow-[0_0_10px_#00ff00]"/> Compatible Spotify • Deezer • Apple
          </div>

          {/* TITRE CORRIGÉ : Espacement normal et hauteur de ligne confortable */}
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black italic text-white leading-tight tracking-tight uppercase drop-shadow-2xl">
            Vos Concerts.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] via-[#a361ff] to-[#ff4d94]">En Playlist.</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#888] max-w-3xl mx-auto font-medium leading-relaxed">
            L'outil ultime pour transformer l'énergie du live en playlists réelles. Setlists exactes, import instantané.
          </p>

          {/* BARRE DE RECHERCHE */}
          <div className="max-w-2xl mx-auto w-full pt-10">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#444] w-6 h-6 group-focus-within:text-[#4d94ff] transition-colors" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Quel artiste ou festival ?" 
                className="h-20 pl-16 pr-36 bg-[#0a0a0a] border border-[#222] text-xl rounded-full focus:ring-2 focus:ring-[#4d94ff] focus:border-[#4d94ff] transition-all shadow-2xl placeholder:text-[#333]"
              />
              <Button type="submit" className="absolute right-2 top-2 bottom-2 px-8 rounded-full bg-[#4d94ff] hover:bg-white hover:text-black font-black italic uppercase transition-all text-lg shadow-[0_0_20px_rgba(77,148,255,0.3)] hover:shadow-none">
                GO
              </Button>
            </form>
            
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-bold uppercase tracking-widest text-[#444]">
              <span>Populaire :</span>
              <button onClick={() => navigate('/search?q=Metallica')} className="hover:text-white transition-colors border-b border-transparent hover:border-[#4d94ff]">Metallica</button>
              <button onClick={() => navigate('/search?q=Hellfest')} className="hover:text-white transition-colors border-b border-transparent hover:border-[#4d94ff]">Hellfest</button>
              <button onClick={() => navigate('/search?q=Daft Punk')} className="hover:text-white transition-colors border-b border-transparent hover:border-[#4d94ff]">Daft Punk</button>
            </div>
          </div>
        </div>
      </section>


      {/* --- 2. IMPORT RAPIDE (PROFIL) --- */}
      <section className="py-32 bg-black border-b border-[#111]">
        <div className="max-w-6xl mx-auto px-6">
            <div className="bg-[#050505] rounded-[3rem] border border-[#1a1a1a] p-12 md:p-20 relative overflow-hidden group">
                {/* Décoration */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#88c446]/10 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 text-[#88c446] font-bold uppercase tracking-widest text-xs">
                            <Music size={14} /> Import Automatique
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black italic uppercase leading-none">
                            Déjà sur <br/><span className="text-[#88c446]">Setlist.fm</span> ?
                        </h2>
                        <p className="text-xl text-[#888]">
                            Connectez votre compte pour importer automatiquement tout votre historique de concerts en une seconde.
                        </p>
                        
                        <form onSubmit={handleProfileConnect} className="flex gap-4 max-w-md pt-4">
                            <div className="relative flex-1">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" />
                                <Input 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Votre pseudo Setlist.fm" 
                                    className="h-16 pl-12 bg-black border-[#222] rounded-2xl focus:border-[#88c446] text-lg"
                                />
                            </div>
                            <Button type="submit" className="h-16 px-8 bg-[#88c446] hover:bg-[#a0e050] text-black font-bold rounded-2xl text-xl">
                                <ArrowRight />
                            </Button>
                        </form>
                    </div>

                    {/* Visuel Setlist */}
                    <div className="hidden md:block relative">
                         <div className="bg-[#0a0a0a] border border-[#222] rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#222]">
                                <div className="w-16 h-16 bg-[#1a1a1a] rounded-full animate-pulse"/>
                                <div>
                                    <div className="h-4 w-32 bg-[#222] rounded mb-2"/>
                                    <div className="h-3 w-20 bg-[#1a1a1a] rounded"/>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="text-[#333] font-mono">0{i}</span>
                                        <div className="h-3 w-full bg-[#1a1a1a] rounded"/>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </section>


      {/* --- 3. PRICING (Clair & Aéré) --- */}
       <section className="py-32 px-6 max-w-7xl mx-auto w-full" id="pricing">
        <div className="text-center mb-24 space-y-6">
          <h2 className="text-5xl md:text-7xl font-black italic uppercase">Offres & Tarifs</h2>
          <p className="text-[#666] text-xl font-medium max-w-2xl mx-auto">
            Setlive est gratuit pour explorer. Passez Premium pour l'illimité.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* VISITEUR */}
          <div className="group p-10 rounded-[2.5rem] border border-[#1a1a1a] bg-black hover:bg-[#050505] transition-all flex flex-col min-h-[550px]">
            <div className="mb-10">
                <span className="inline-block px-3 py-1 rounded-full bg-[#111] text-xs font-bold uppercase tracking-widest text-[#666] mb-6">Découverte</span>
                <h3 className="text-4xl font-black italic uppercase text-[#888]">Visiteur</h3>
                <div className="text-2xl text-white mt-2 font-bold">Gratuit</div>
            </div>
            <ul className="space-y-6 flex-grow">
                <li className="flex gap-4 text-[#888]"><Check className="text-white shrink-0"/> Recherche concerts</li>
                <li className="flex gap-4 text-[#888]"><Check className="text-white shrink-0"/> Voir les setlists</li>
                <li className="flex gap-4 text-[#333] line-through decoration-[#333]"><Zap className="shrink-0"/> Export Playlist</li>
                <li className="flex gap-4 text-[#333] line-through decoration-[#333]"><Zap className="shrink-0"/> Sauvegarde historique</li>
            </ul>
            <Button onClick={() => window.scrollTo(0,0)} variant="outline" className="w-full h-16 mt-8 border-[#222] bg-transparent text-white hover:bg-white hover:text-black font-bold uppercase tracking-widest rounded-xl">
                Essayer
            </Button>
          </div>

          {/* MEMBRE (Inscrit) */}
          <div className="p-10 rounded-[2.5rem] border border-[#4d94ff]/30 bg-[#050505] flex flex-col min-h-[550px] relative shadow-[0_0_50px_rgba(77,148,255,0.05)] hover:border-[#4d94ff] transition-all">
            <div className="mb-10">
                <span className="inline-block px-3 py-1 rounded-full bg-[#4d94ff]/10 text-xs font-bold uppercase tracking-widest text-[#4d94ff] mb-6">Compte Gratuit</span>
                <h3 className="text-4xl font-black italic uppercase text-white">Membre</h3>
                <div className="text-2xl text-[#4d94ff] mt-2 font-bold">0€ <span className="text-sm text-[#666] font-normal">/ mois</span></div>
            </div>
            <ul className="space-y-6 flex-grow">
                <li className="flex gap-4 text-white"><Check className="text-[#4d94ff] shrink-0"/> <strong>2 Exports / mois</strong></li>
                <li className="flex gap-4 text-white"><Check className="text-[#4d94ff] shrink-0"/> Historique illimité</li>
                <li className="flex gap-4 text-white"><Check className="text-[#4d94ff] shrink-0"/> Import Setlist.fm</li>
                <li className="flex gap-4 text-[#666] text-sm italic pl-10">Publicités activées</li>
            </ul>
            <Button onClick={() => navigate('/auth')} className="w-full h-16 mt-8 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-black italic uppercase tracking-widest text-lg rounded-xl shadow-[0_10px_30px_rgba(77,148,255,0.2)]">
                Créer un compte
            </Button>
          </div>

          {/* PREMIUM */}
          <div className="group p-10 rounded-[2.5rem] border border-[#222] bg-gradient-to-b from-[#0a0a0a] to-black flex flex-col min-h-[550px] hover:border-yellow-500/50 transition-all relative overflow-hidden">
            {/* Petit effet Shine */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full pointer-events-none"/>
            
            <div className="mb-10">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold uppercase tracking-widest text-yellow-500 mb-6">
                    <Crown size={12}/> Premium
                </span>
                <h3 className="text-4xl font-black italic uppercase text-white">Gold</h3>
                <div className="text-2xl text-yellow-500 mt-2 font-bold">5€ <span className="text-sm text-[#666] font-normal">/ an</span></div>
            </div>
            <ul className="space-y-6 flex-grow">
                <li className="flex gap-4 text-white"><Check className="text-yellow-500 shrink-0"/> <strong>Exports Illimités</strong></li>
                <li className="flex gap-4 text-white"><Check className="text-yellow-500 shrink-0"/> <strong>Zéro Publicité</strong></li>
                <li className="flex gap-4 text-white"><Check className="text-yellow-500 shrink-0"/> Badge Supporter</li>
                <li className="flex gap-4 text-white"><Check className="text-yellow-500 shrink-0"/> Support prioritaire</li>
            </ul>
            <Button onClick={() => navigate('/subscription')} className="w-full h-16 mt-8 bg-[#222] hover:bg-yellow-500 hover:text-black text-white font-bold uppercase tracking-widest rounded-xl transition-all">
                Passer Premium
            </Button>
          </div>

        </div>

        <div className="mt-24 text-center border-t border-[#111] pt-12">
            <p className="text-[#444] text-sm flex items-center justify-center gap-2 uppercase tracking-widest font-bold">
                <ShieldCheck size={16}/> Paiement sécurisé • Annulation immédiate
            </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
