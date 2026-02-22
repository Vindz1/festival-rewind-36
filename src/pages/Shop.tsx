import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Ticket, Disc, Shirt, ShieldAlert, ArrowUpRight } from 'lucide-react';

// --- TES LIENS D'AFFILIATION ---
const AMAZON_TAG = 'setlive-21';

// Tes futurs liens de tracking Effinity (à remplacer quand tu seras inscrit aux programmes)
const AFFILIATE_SEETICKETS = 'https://www.seetickets.com/fr'; 
const AFFILIATE_CULTURA_TICKETS = 'https://billetterie.cultura.com/';
const AFFILIATE_CULTURA_MUSIC = 'https://www.cultura.com/musique.html';

export default function Shop() {
  const tiles = [
    {
      id: 'tickets',
      title: 'Billetterie',
      subtitle: 'SeeTickets & Cultura',
      description: 'Réservez vos places pour les tournées et festivals en toute sécurité via les réseaux de billetterie officiels.',
      icon: Ticket,
      color: 'text-green-500',
      hoverBorder: 'hover:border-green-500/50',
      bgGlow: 'group-hover:bg-green-500/5',
      links: [
        { name: 'SeeTickets (Concerts & Festivals)', url: AFFILIATE_SEETICKETS },
        { name: 'Cultura Billetterie', url: AFFILIATE_CULTURA_TICKETS }
      ]
    },
    {
      id: 'vinyls',
      title: 'Vinyles & CD',
      subtitle: 'Amazon & Cultura',
      description: 'Complétez votre collection physique. Retrouvez les albums mythiques et les dernières sorties de vos artistes favoris.',
      icon: Disc,
      color: 'text-purple-500',
      hoverBorder: 'hover:border-purple-500/50',
      bgGlow: 'group-hover:bg-purple-500/5',
      links: [
        { name: 'Rayon Musique Cultura', url: AFFILIATE_CULTURA_MUSIC },
        { name: 'Vinyles Rock/Metal (Amazon)', url: `https://www.amazon.fr/s?k=vinyle+rock+metal&tag=${AMAZON_TAG}` },
        { name: 'Platines Vinyles (Amazon)', url: `https://www.amazon.fr/s?k=platine+vinyle&tag=${AMAZON_TAG}` }
      ]
    },
    {
      id: 'merch',
      title: 'Merchandising',
      subtitle: 'Amazon',
      description: 'Portez fièrement les couleurs de vos groupes. T-shirts officiels, sweats, patchs et accessoires exclusifs.',
      icon: Shirt,
      color: 'text-orange-500',
      hoverBorder: 'hover:border-orange-500/50',
      bgGlow: 'group-hover:bg-orange-500/5',
      links: [
        { name: 'T-Shirts rock et metal', url: `https://www.amazon.fr/s?k=t-shirt+officiel+rock+metal+groupe&tag=${AMAZON_TAG}` },
        { name: 'Sweats & Vestes', url: `https://www.amazon.fr/s?k=sweat+rock+metal+groupe&tag=${AMAZON_TAG}` }
      ]
    },
    {
      id: 'earplugs',
      title: 'Protections Auditives',
      subtitle: 'Loop, Alpine...',
      description: 'Indispensable pour les concerts et festivals. Protégez votre audition sans altérer la qualité du son.',
      icon: ShieldAlert,
      color: 'text-[#4d94ff]',
      hoverBorder: 'hover:border-[#4d94ff]/50',
      bgGlow: 'group-hover:bg-[#4d94ff]/5',
      links: [
        { name: 'Bouchons de Concert (Amazon)', url: `https://www.amazon.fr/s?k=bouchons+oreilles+concert+musique&tag=${AMAZON_TAG}` },
        { name: 'Boutique Officielle Loop', url: `https://www.amazon.fr/s?k=loop+experience+plus&tag=${AMAZON_TAG}` }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 font-sans">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* HEADER SHOP */}
        <div className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-black italic uppercase mb-4 tracking-tighter">
            LE <span className="text-[#4d94ff]">SHOP</span>
          </h1>
          <p className="text-[#a0a0a0] text-lg max-w-2xl leading-relaxed">
            L'essentiel pour vivre votre passion. De la billetterie officielle aux protections auditives, retrouvez notre sélection de partenaires de confiance.
          </p>
        </div>

        {/* TUILES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiles.map((tile) => (
            <div 
              key={tile.id} 
              className={`group flex flex-col p-8 rounded-3xl bg-[#141414] border border-[#2a2a2a] transition-all duration-300 ${tile.hoverBorder} ${tile.bgGlow}`}
            >
              {/* Entête de la tuile */}
              <div className="flex items-start gap-5 mb-6">
                <div className={`p-4 rounded-2xl bg-[#1a1a1a] border border-[#333] ${tile.color}`}>
                  <tile.icon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{tile.title}</h2>
                  <p className="text-sm font-bold text-[#666] uppercase tracking-widest mt-1">{tile.subtitle}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#a0a0a0] leading-relaxed flex-grow mb-8 text-sm">
                {tile.description}
              </p>

              {/* Liens (Boutons minimalistes) */}
              <div className="flex flex-col gap-3 mt-auto">
                {tile.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#252525] hover:border-[#404040] transition-colors"
                  >
                    <span className="font-bold text-sm text-gray-200">{link.name}</span>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mention légale d'affiliation */}
        <div className="mt-16 text-center">
          <p className="text-xs text-[#666] max-w-2xl mx-auto">
            Setlive participe à des programmes d'affiliation (Amazon Partenaires, Effinity...). En cliquant sur ces liens, vous soutenez le financement et le développement de la plateforme, sans aucun surcoût pour vous. Merci ! 🤘
          </p>
        </div>

      </div>

      <Footer />
    </div>
  );
}
