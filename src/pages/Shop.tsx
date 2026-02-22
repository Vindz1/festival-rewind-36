import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ShoppingCart, Disc, Ticket, ShieldAlert, Shirt, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- DONNÉES DE LA BOUTIQUE (Facile à modifier) ---
const AMAZON_TAG = 'setlive-21';

const categories = [
  {
    id: 'tickets',
    title: 'Billetterie & Festivals',
    icon: Ticket,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Sécurisez vos places pour les prochains concerts.',
    items: [
      {
        name: 'Hellfest 2026 - Pass',
        price: 'Voir tarifs',
        desc: 'Revente officielle et billetterie',
        image: 'https://placehold.co/400x400/1a1a1a/22c55e?text=TICKETS',
        // Remplacer par ton lien Effinity (ex: Ticketmaster / Fnac)
        link: 'https://www.ticketmaster.fr', 
        platform: 'Ticketmaster'
      },
      {
        name: 'Fnac Spectacles',
        price: 'Concerts',
        desc: 'Trouvez les dates de vos artistes favoris',
        image: 'https://placehold.co/400x400/1a1a1a/22c55e?text=FNAC',
        link: 'https://www.fnacspectacles.com', // Lien Effinity
        platform: 'Fnac'
      }
    ]
  },
  {
    id: 'earplugs',
    title: 'Protection Auditive',
    icon: ShieldAlert,
    color: 'text-[#4d94ff]',
    bgColor: 'bg-[#4d94ff]/10',
    borderColor: 'border-[#4d94ff]/30',
    description: 'Indispensable pour profiter de la musique à vie.',
    items: [
      {
        name: 'Loop Experience Plus',
        price: '34.95€',
        desc: 'Réduction de bruit avec filtre acoustique',
        image: 'https://placehold.co/400x400/1a1a1a/4d94ff?text=LOOP',
        link: `https://www.amazon.fr/dp/B0968HWZXZ?tag=${AMAZON_TAG}`,
        platform: 'Amazon'
      },
      {
        name: 'Alpine PartyPlug Pro',
        price: '29.99€',
        desc: 'Bouchons d\'oreilles naturels pour concerts',
        image: 'https://placehold.co/400x400/1a1a1a/4d94ff?text=ALPINE',
        link: `https://www.amazon.fr/dp/B07S7DML8B?tag=${AMAZON_TAG}`,
        platform: 'Amazon'
      }
    ]
  },
  {
    id: 'vinyls',
    title: 'Vinyles & Audio',
    icon: Disc,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Ramenez l\'ambiance du concert à la maison.',
    items: [
      {
        name: 'Metallica - 72 Seasons',
        price: '32.99€',
        desc: 'Double Vinyle Noir 180g',
        image: 'https://placehold.co/400x400/1a1a1a/a855f7?text=VINYLE',
        link: `https://www.amazon.fr/dp/B0BMSNBSVQ?tag=${AMAZON_TAG}`,
        platform: 'Amazon'
      },
      {
        name: 'Platine Audio-Technica',
        price: '149.00€',
        desc: 'AT-LP60XUSB - Platine Vinyle Automatique',
        image: 'https://placehold.co/400x400/1a1a1a/a855f7?text=PLATINE',
        link: `https://www.amazon.fr/dp/B07MVQGVKJ?tag=${AMAZON_TAG}`,
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
            Équipez-vous pour vos prochains festivals, protégez vos oreilles et ramenez l'ambiance des concerts dans votre salon. 
            <br/><span className="text-xs text-gray-500 mt-2 block">*En achetant via ces liens partenaires, vous soutenez Setlive sans que cela ne vous coûte plus cher.</span>
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
                      {/* Remplace l'image ici quand tu as les vraies photos */}
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
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xl font-black italic">{item.price}</span>
                        <Button className="bg-white text-black group-hover:bg-[#4d94ff] group-hover:text-white transition-colors rounded-full px-6 font-bold">
                          Acheter
                        </Button>
                      </div>
                    </div>
                  </a>
                ))}

                {/* Card "Voir plus" pour Amazon par exemple */}
                {cat.id !== 'tickets' && (
                  <a 
                    href={`https://www.amazon.fr/s?k=${encodeURIComponent(cat.title)}&tag=${AMAZON_TAG}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-gradient-to-br from-[#1a1a1a] to-[#252525] border border-[#333] border-dashed hover:border-[#4d94ff] rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[300px]"
                  >
                    <div className={`p-4 rounded-full ${cat.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                      <ArrowRight className={`w-8 h-8 ${cat.color}`} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Voir plus de choix</h3>
                    <p className="text-sm text-gray-400">Découvrez le catalogue complet sur {cat.id === 'tickets' ? 'Fnac Spectacles' : 'Amazon'}</p>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bannière d'affiliation générique (Emp/Effinity) */}
        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-black italic uppercase mb-2">Merchandising Officiel 👕</h2>
            <p className="text-gray-300">T-shirts, sweats et accessoires de vos groupes préférés.</p>
          </div>
          <Button 
            className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-white font-bold h-12 px-8 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            onClick={() => window.open('https://www.amazon.fr/s?k=t-shirt+metal+rock+band&tag=' + AMAZON_TAG, '_blank')}
          >
            Voir les collections
          </Button>
        </div>

      </div>

      <Footer />
    </div>
  );
}
