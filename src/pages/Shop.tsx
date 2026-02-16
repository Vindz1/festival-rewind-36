import { Header } from '@/components/Header';
import { Ticket, ShoppingBag, Disc, ExternalLink, Speaker, Flame, Zap } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function Shop() {
  const sections = [
    {
      title: "Billetterie Concerts",
      icon: <Ticket className="text-[#4d94ff]" />,
      color: "blue",
      items: [
        { 
          name: "Ticketmaster FR", 
          url: "https://www.ticketmaster.fr/", 
          desc: "Leader mondial - Tous les concerts & festivals",
          badge: "Officiel"
        },
        { 
          name: "See Tickets", 
          url: "https://www.seetickets.com/fr/", 
          desc: "Download, Hellfest, festivals européens",
          badge: "Recommandé"
        },
        { 
          name: "Fnac Spectacles", 
          url: "https://spectacles.fnac.com/", 
          desc: "Grande distribution - Points de retrait partout"
        }
      ]
    },
    {
      title: "Merch Officiel",
      icon: <ShoppingBag className="text-[#00ff00]" />,
      color: "green",
      items: [
        { 
          name: "EMP France", 
          url: "https://www.emp-online.fr/", 
          desc: "Rock, Metal, Gothic - 50 000 produits",
          badge: "Spécialiste"
        },
        { 
          name: "Hellfest Shop", 
          url: "https://shop.hellfest.fr/", 
          desc: "Merch officiel Hellfest - Éditions limitées",
          badge: "Exclusif"
        },
        { 
          name: "Impericon", 
          url: "https://www.impericon.com/fr/", 
          desc: "Hardcore, Punk, Metal - Marques premium"
        }
      ]
    },
    {
      title: "Vinyles & Musique",
      icon: <Disc className="text-purple-500" />,
      color: "purple",
      items: [
        { 
          name: "Amazon Musique", 
          url: "https://www.amazon.fr/music/unlimited?tag=VOTRE_TAG", 
          desc: "Vinyles, CD, éditions collector",
          badge: "Affiliation"
        },
        { 
          name: "Fnac Musique", 
          url: "https://www.fnac.com/Musique/n23", 
          desc: "Vinyles neufs & occasions - Points relais"
        },
        { 
          name: "Discogs", 
          url: "https://www.discogs.com/", 
          desc: "Marketplace vinyles rares & collector"
        }
      ]
    },
    {
      title: "Matériel Audio",
      icon: <Speaker className="text-yellow-500" />,
      color: "yellow",
      items: [
        { 
          name: "Audio-Technica", 
          url: "https://www.amazon.fr/s?k=audio+technica+platine&tag=VOTRE_TAG", 
          desc: "Platines vinyles AT-LP60X, AT-LP120",
          badge: "Top ventes"
        },
        { 
          name: "Enceintes Marshall", 
          url: "https://www.amazon.fr/s?k=marshall+enceinte&tag=VOTRE_TAG", 
          desc: "Stanmore, Acton - Design iconique"
        },
        { 
          name: "Casques Audio", 
          url: "https://www.amazon.fr/s?k=casque+audio+studio&tag=VOTRE_TAG", 
          desc: "Sony, Bose, Sennheiser - Qualité studio"
        }
      ]
    }
  ];

  const colorClasses = {
    blue: {
      border: "hover:border-[#4d94ff]",
      text: "group-hover:text-[#4d94ff]",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/30"
    },
    green: {
      border: "hover:border-[#00ff00]",
      text: "group-hover:text-[#00ff00]",
      badge: "bg-green-500/10 text-green-400 border-green-500/30"
    },
    purple: {
      border: "hover:border-purple-500",
      text: "group-hover:text-purple-400",
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/30"
    },
    yellow: {
      border: "hover:border-yellow-500",
      text: "group-hover:text-yellow-400",
      badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 pb-20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase mb-4 tracking-tighter">
            SETLIVE<span className="text-[#4d94ff]">.SHOP</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            Nos partenaires de confiance pour vivre vos concerts à 100% : billets, merch, vinyles et équipement audio
          </p>
        </div>

        {/* Banner Hellfest */}
        <a 
          href="https://shop.hellfest.fr/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block mb-12 bg-gradient-to-r from-red-600/20 to-orange-600/20 border-2 border-red-500/30 rounded-2xl p-6 sm:p-8 hover:border-red-500 transition-all group"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Flame className="w-12 h-12 text-red-500" />
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-red-500 mb-1">
                  Hellfest 2026
                </h2>
                <p className="text-sm text-gray-300">
                  Shop officiel - T-shirts, hoodies, accessoires exclusifs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-red-500 font-bold group-hover:translate-x-2 transition-transform">
              Découvrir
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
        </a>

        {/* Grid des sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {sections.map((sec, i) => (
            <div 
              key={i} 
              className="space-y-4 bg-[#252525]/30 p-6 sm:p-8 rounded-3xl border border-[#333] hover:border-[#444] transition-all"
            >
              <div className="flex items-center gap-3 border-b border-[#333] pb-4">
                {sec.icon}
                <h2 className="text-xl sm:text-2xl font-bold uppercase italic">{sec.title}</h2>
              </div>
              
              <div className="space-y-3">
                {sec.items.map((item, j) => (
                  <a 
                    key={j} 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`group bg-[#252525] p-4 sm:p-5 rounded-xl border border-transparent ${colorClasses[sec.color].border} transition-all flex items-start gap-3`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-bold text-sm sm:text-base ${colorClasses[sec.color].text} transition-colors`}>
                          {item.name}
                        </h3>
                        {item.badge && (
                          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-semibold ${colorClasses[sec.color].badge}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#a0a0a0] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <ExternalLink className={`w-4 h-4 sm:w-5 sm:h-5 text-[#444] ${colorClasses[sec.color].text} transition-colors shrink-0 mt-1`} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 p-6 bg-[#252525]/30 border border-[#333] rounded-2xl text-center">
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            <strong className="text-white">💡 Bon à savoir :</strong> Certains liens sont affiliés (Amazon). 
            En achetant via ces liens, vous soutenez Setlive sans surcoût. 
            Nous recommandons uniquement des produits/services que nous utiliserions nous-mêmes.
          </p>
        </div>

      </div>
      
      <Footer />
    </div>
  );
}
