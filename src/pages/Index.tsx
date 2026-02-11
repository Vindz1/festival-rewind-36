import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, Zap, Crown, User, Globe, ArrowRight, Music } from 'lucide-react';
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
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
      <Header />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden border-b border-[#222]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#4d94ff]/10 via-transparent to-transparent -z-10" />
        
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-[0.85] uppercase">
            Transformez vos <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] to-[#ff4d94]">concerts en playlists.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#a0a0a0] max-w-3xl mx-auto font-medium leading-relaxed">
            Récupérez les setlists exactes de vos artistes préférés et exportez-les vers toutes les plateformes de streaming.
          </p>

          <div className="max-w-2xl mx-auto pt-8">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#666] group-focus-within:text-[#4d94ff] transition-colors" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Chercher un artiste, un festival..." 
                className="h-20 pl-16 pr-32 bg-[#1a1a1a] border-[#333] text-xl rounded-full focus:ring-2 focus:ring-[#4d94ff] transition-all shadow-2xl"
              />
              <Button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 h-14 px-8 rounded-full bg-[#4d94ff] hover:bg-white hover:text-black font-black italic uppercase transition-all">
                C'est parti
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* --- SECTION PROFIL RAPIDE --- */}
      <section className="py-20 bg-[#161616] border-b border-[#222]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#1a1a1a] border border-[#333] p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 shadow-xl">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-black italic uppercase italic">Déjà sur Setlist.fm ?</h2>
              <p className="text-[#a0a0a0]">Importez votre profil pour retrouver tous vos concerts passés en un clic.</p>
            </div>
            <form onSubmit={handleProfileConnect} className="w-full md:w-auto flex gap-2">
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Pseudo Setlist.fm" 
                className="h-14 bg-[#121212] border-[#333] min-w-[200px]"
              />
              <Button type="submit" className="h-14 bg-white text-black hover:bg-[#4d94ff] hover:text-white font-bold px-6">
                <ArrowRight />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section className="py-32 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black italic uppercase">Choisissez votre formule</h2>
          <p className="text-[#a0a0a0] text-lg font-medium tracking-widest uppercase">L'export universel pour tous</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Visiteur */}
          <div className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border border-[#333] flex flex-col justify-between hover:border-[#4d94ff] transition-colors">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[#4d94ff] font-bold uppercase tracking-widest text-xs">Visiteur</span>
                <h3 className="text-3xl font-black italic uppercase">Gratuit</h3>
              </div>
              <ul className="space-y-4 text-[#a0a0a0] font-medium">
                <li className="flex gap-3 items-start"><Check className="text-[#4d94ff] shrink-0" size={20}/> Consultation des playlists</li>
                <li className="flex gap-3 items-start"><Check className="text-[#4d94ff] shrink-0" size={20}/> Historique Setlist.fm</li>
                <li className="flex gap-3 items-start text-[#444] line-through italic"><Zap size={20}/> Export vers plateformes</li>
              </ul>
            </div>
            <Button variant="outline" className="mt-10 h-14 border-[#333] text-white hover:bg-white hover:text-black font-bold uppercase" onClick={() => navigate('/')}>Continuer</Button>
          </div>

          {/* Inscrit (Best Seller) */}
          <div className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border-2 border-[#4d94ff] flex flex-col justify-between relative shadow-[0_0_40px_rgba(77,148,255,0.15)]">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#4d94ff] text-white px-6 py-1 rounded-full text-xs font-black uppercase tracking-widest italic">Populaire</div>
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[#4d94ff] font-bold uppercase tracking-widest text-xs">Inscrit</span>
                <h3 className="text-3xl font-black italic uppercase">0€ / mois</h3>
              </div>
              <ul className="space-y-4 text-[#a0a0a0] font-medium">
                <li className="flex gap-3 items-start"><Check className="text-[#4d94ff] shrink-0" size={20}/> Sauvegarde de l'historique</li>
                <li className="flex gap-3 items-start"><Check className="text-[#4d94ff] shrink-0" size={20}/> <strong className="text-white">2 Exports / mois</strong></li>
                <li className="flex gap-3 items-start"><Check className="text-[#4d94ff] shrink-0" size={20}/> Publicités activées</li>
              </ul>
            </div>
            <Button className="mt-10 h-14 bg-[#4d94ff] hover:bg-white hover:text-black text-white font-black italic uppercase tracking-widest" onClick={() => navigate('/auth')}>S'inscrire gratuitement</Button>
          </div>

          {/* Premium */}
          <div className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border border-[#333] flex flex-col justify-between bg-gradient-to-b from-[#1a1a1a] to-[#252525]">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-yellow-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><Crown size={14} /> Membre Gold</span>
                <h3 className="text-3xl font-black italic uppercase">5€ / an</h3>
              </div>
              <ul className="space-y-4 text-[#a0a0a0] font-medium">
                <li className="flex gap-3 items-start"><Check className="text-yellow-500 shrink-0" size={20}/> <strong className="text-white">Exports illimités</strong></li>
                <li className="flex gap-3 items-start"><Check className="text-yellow-500 shrink-0" size={20}/> Zéro Publicité</li>
                <li className="flex gap-3 items-start"><Check className="text-yellow-500 shrink-0" size={20}/> Accès prioritaire nouveautés</li>
              </ul>
            </div>
            <Button className="mt-10 h-14 bg-yellow-600 hover:bg-yellow-500 text-white font-black italic uppercase tracking-widest" onClick={() => navigate('/subscription')}>Devenir Premium</Button>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
