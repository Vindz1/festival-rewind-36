import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ShoppingCart, Disc, Ticket, ShieldAlert, Shirt, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- TES TAGS D'AFFILIATION ---
const AMAZON_TAG = 'setlive-21';
// Remplace ces liens par tes liens de tracking Effinity
const EFFINITY_FNAC = 'https://www.fnacspectacles.com'; 
const EFFINITY_TICKETMASTER = 'https://www.ticketmaster.fr';
const EFFINITY_EMP = 'https://www.emp-online.fr';

const categories = [
  {
    id: 'tickets',
    title: 'Billetterie Concerts',
    icon: Ticket,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Réservez vos places de concerts et festivals officiellement.',
    items: [
      {
        name: 'Fnac Spectacles',
        price: 'Billets',
        desc: 'Trouvez les dates de vos artistes favoris dans toute la France.',
        image: 'https://placehold.co/400x400/1a1a1a/22c55e?text=FNAC',
        link: EFFINITY_FNAC,
        platform: 'Fnac'
      },
      {
        name: 'Ticketmaster',
        price: 'Concerts',
        desc: 'Billetterie officielle pour les grandes tournées internationales.',
        image: 'https://placehold.co/400x400/1a1a1a/22c55e?text=TICKETMASTER',
        link: EFFINITY_TICKETMASTER,
        platform: 'Ticketmaster'
      }
    ]
  },
  {
    id: 'vinyls',
    title: 'Vinyles & Musique',
    icon: Disc,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Complétez votre collection avec les classiques intemporels.',
    items: [
      {
        name: 'Metallica - The Black Album',
        price: 'Vinyle',
        desc: 'L\'album mythique remasterisé en double vinyle 180g.',
        image: 'https://placehold.co/400x400/1a1a1a/a855f7?text=METALLICA',
        link: `https://www.amazon.fr/dp/B095L89XJ5?tag=${AMAZON_TAG}`,
        platform: 'Amazon'
      },
      {
        name: 'AC/DC - Back In Black',
        price: 'Vinyle',
        desc: 'Le classique absolu du rock australien.',
        image: 'https://placehold.co/400x400/1a1a1a/a855f7?text=ACDC',
        link: `https://www.amazon.fr/dp/B00008WT5E?tag=${AMAZON_TAG}`,
        platform: 'Amazon'
      },
      {
        name: 'Platine Audio-Technica',
        price: 'Matériel',
        desc: 'AT-LP60XUSB - Platine Vinyle Automatique idéale pour débuter.',
        image: 'https://placehold.co/400x400/1a1a1a/a855f7?text=PLATINE',
        link: `https://www.amazon.fr/dp/B07MVQGVKJ?tag=${AMAZON_TAG}`,
        platform: 'Amazon'
      }
    ]
  },
  {
    id: 'merch',
    title: 'Merchandising Officiel',
    icon: Shirt,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Portez fièrement les couleurs de vos groupes favoris.',
    items: [
      {
        name: 'T-Shirts Rock & Metal',
        price: 'Vêtements',
        desc: 'Des centaines de t-shirts officiels de vos groupes préférés.',
        image: 'https://placehold.co/400x400/1a1a1a/f97316?text=TSHIRT',
        link: `https://www.amazon.fr/s?k=t-shirt+metal+rock+officiel&tag=${AMAZON_TAG}`,
        platform: 'Amazon'
      },
      {
        name: 'Boutique EMP',
        price: 'Merch',
        desc: 'Le spécialiste européen du merchandising rock, metal et alternatif.',
        image: 'https://placehold.co/400x400/1a1a1a/f97316?text=EMP',
        link: EFFINITY_EMP,
        platform: 'EMP'
      }
    ]
  },
  {
    id: 'earplugs',
    title: 'Protections Auditives',
    icon: ShieldAlert,
    color: 'text-[#4d94ff]',
    bgColor: 'bg-[#4d94ff]/10',
    borderColor: 'border-[#4d94ff]/30',
    description: 'Indispensable pour continuer à profiter des concerts à vie.',
    items: [
      {
        name: 'Loop Experience Plus',
        price: 'Bouchons',
        desc: 'Réduction de bruit avec filtre acoustique, idéal pour la musique live.',
        image: 'https://placehold.co/400x400/1a1a1a/4d94ff?text=LOOP',
        link: `https://www.amazon.fr/dp/B0968HWZXZ?tag=${AMAZON_TAG}`,
        platform: 'Amazon'
      },
      {
        name: 'Alpine PartyPlug',
        price: 'Bouchons',
        desc: 'Bouchons d\'oreilles naturels et confortables pour festivals.',
        image: 'https://placehold.co/400x400/1a1a1a/4d94ff?text=ALPINE',
        link: `https://www.amazon.fr/dp/B00REB9VTO?tag=${AMAZON_TAG}`,
        platform: 'Amazon'
      }
    ]
  }
];

export default function Shop() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4d94ff] to-purple-500 mb-6 shadow-lg shadow-blue-500/20">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase mb-4 tracking-tighter">
            LE SHOP <span className="text-[#4d94ff]">SETLIVE</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Achetez vos billets officiels, complétez votre collection de vinyles et protégez vos oreilles. 
            <br/><span className="text-xs text-gray-500 mt-2 block">*En achetant via ces liens affiliés, vous soutenez Setlive sans que cela ne vous coûte plus cher.</span>
          </p>
        </div>

        {/* Categories Grid */}
        <div className="space-y-16">
          {categories.map((cat) => (
            <div key={cat.id} className="scroll-mt-24" id={cat.id}>
              
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-xl ${cat.bgColor} border ${cat.borderColor}`}>
                  <cat.icon className={`w-6 h-6 ${cat.color}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic uppercase">{cat.title}</h2>
                  <p className="text-gray-400 text-sm">{cat.description}</p>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.items.map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group bg-[#1a1a1a] border border-[#333] hover:border-[#4d94ff] rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_20px_-5px_rgba(77,148,255,0.3)] flex flex-col"
                  >
                    {/* Image Box */}
                    <div className="relative aspect-square bg-[#252525] p-6 flex items-center justify-center overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold flex items-center gap-1.5">
                        {item.platform} <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-[#4d94ff] transition-colors line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 flex-1">
                        {item.desc}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#333]">
                        <span className="text-lg font-black italic text-gray-300">{item.price}</span>
                        <Button className="bg-white text-black group-hover:bg-[#4d94ff] group-hover:text-white transition-colors rounded-full px-6 font-bold">
                          Découvrir
                        </Button>
                      </div>
                    </div>
                  </a>
                ))}

                {/* Card "Voir plus" (Sauf pour Billetterie où on a déjà tout mis) */}
                {cat.id !== 'tickets' && (
                  <a 
                    href={
                      cat.id === 'merch' ? EFFINITY_EMP : 
                      `https://www.amazon.fr/s?k=${encodeURIComponent(cat.title)}&tag=${AMAZON_TAG}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-gradient-to-br from-[#1a1a1a] to-[#252525] border border-[#333] border-dashed hover:border-[#4d94ff] rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[300px]"
                  >
                    <div className={`p-4 rounded-full ${cat.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                      <ArrowRight className={`w-8 h-8 ${cat.color}`} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Voir tout le catalogue</h3>
                    <p className="text-sm text-gray-400">
                      Explorez plus de choix sur {cat.id === 'merch' ? 'EMP / Amazon' : 'Amazon'}
                    </p>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      <Footer />
    </div>
  );
}
