import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { FESTIVALS_2026 } from '@/data/festivalsData';
import { MapPin, Calendar, ExternalLink, ArrowLeft, Music } from 'lucide-react';

export default function FestivalDetailPage() {
  const { festivalId } = useParams();
  const navigate = useNavigate();
  const festival = FESTIVALS_2026.find(f => f.id === festivalId);

  // Si festival pas trouvé, rediriger vers /festivals
  if (!festival) {
    return <Navigate to="/festivals" replace />;
  }

  // Si c'est Hellfest, rediriger vers la page existante
  if (festivalId === 'hellfest-2026') {
    return <Navigate to="/hellfest-2026" replace />;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />

      <main className="pt-20 pb-20 max-w-4xl mx-auto px-4">
        
        {/* Bouton retour */}
        <Button
          onClick={() => navigate('/festivals')}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux festivals
        </Button>

        {/* Header festival */}
        <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border-2 border-[#4d94ff] rounded-2xl p-8 sm:p-12 mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold mb-4">
            <Music className="w-3 h-3" />
            BIENTÔT DISPONIBLE
          </div>

          <h1 className="text-4xl sm:text-6xl font-black italic uppercase mb-4 tracking-tighter">
            {festival.name}
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{festival.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-lg">{festival.dates}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {festival.genre.map(g => (
              <span key={g} className="px-4 py-1.5 rounded-full bg-[#4d94ff]/20 text-[#4d94ff] border border-[#4d94ff]/30 text-sm font-semibold">
                {g}
              </span>
            ))}
          </div>

          {/* Headliners si disponibles */}
          {festival.lineup && festival.lineup.length > 0 && (
            <div className="pt-6 border-t border-[#404040]">
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-3">Headliners</p>
              <p className="text-2xl font-bold text-white">
                {festival.lineup.join(' • ')}
              </p>
            </div>
          )}
        </div>

        {/* Message "Coming Soon" */}
        <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-black italic uppercase mb-4">
            Programmation complète <span className="text-[#4d94ff]">bientôt</span>
          </h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto leading-relaxed">
            Nous travaillons à intégrer la programmation complète de {festival.name} pour vous permettre de générer vos playlists en un clic. 
            En attendant, visitez le site officiel pour découvrir tous les artistes.
          </p>

          {festival.website && (
            <Button
              onClick={() => window.open(festival.website, '_blank')}
              className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-8 h-12 rounded-full"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Visiter le site officiel
            </Button>
          )}
        </div>

        {/* CTA notification */}
        <div className="bg-gradient-to-br from-[#4d94ff]/10 to-purple-500/10 border border-[#4d94ff]/30 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400 mb-2">
            💡 <strong className="text-white">Astuce :</strong> Revenez régulièrement
          </p>
          <p className="text-xs text-gray-500">
            Nous ajoutons constamment de nouveaux festivals avec leurs programmations complètes
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
