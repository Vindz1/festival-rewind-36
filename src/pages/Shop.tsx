import { Header } from '@/components/Header';
import { ShoppingBag, Disc, ExternalLink, Speaker, Music, Headphones } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function Shop() {
  const sections = [
    {
      title: "Merch Rock & Metal",
      icon: <ShoppingBag className="text-[#00ff00]" />,
      color: "green",
      items: [
        { 
          name: "EMP France", 
          url: "https://action.metaffiliation.com/trk.php?mclic=P51C4C414550505&redir=https://www.emp-online.fr/", 
          desc: "50 000 produits - T-shirts, hoodies, accessoires rock et metal"
        },
        { 
          name: "Amazon Mode Rock", 
          url: "https://www.amazon.fr/s?k=t+shirt+rock+metal&tag=setlive-21", 
          desc: "T-shirts de groupes, merchandising officiel et accessoires"
        },
        { 
          name: "Cultura Fashion", 
          url: "https://action.metaffiliation.com/trk.php?mclic=P51C4C414550505&redir=https://www.cultura.com/", 
          desc: "Vêtements et accessoires culture pop, manga et musique"
        }
      ]
    },
    {
      title: "Vinyles & CD",
      icon: <Disc className="text-purple-500" />,
      color: "purple",
      items: [
        { 
          name: "Fnac Musique", 
          url: "https://action.metaffiliation.com/trk.php?mclic=P51C4C414550505&redir=https://www.fnac.com/Musique/n23", 
          desc: "Des milliers de vinyles neufs et occasions - Retrait gratuit en magasin"
        },
        { 
          name: "Amazon Vinyles", 
          url: "https://www.amazon.fr/Vinyles-CD/b?ie=UTF8&node=541686&tag=setlive-21", 
          desc: "Rééditions collector, vinyles rares et nouveautés - Livraison Prime"
        },
        { 
          name: "Cultura Musique", 
          url: "https://action.metaffiliation.com/trk.php?mclic=P51C4C414550505&redir=https://www.cultura.com/musique.html", 
          desc: "Vinyles, CD et coffrets collector - Large choix rock et metal"
        }
      ]
    },
    {
      title: "Platines Vinyles",
      icon: <Music className="text-yellow-500" />,
      color: "yellow",
      items: [
        { 
          name: "Audio-Technica AT-LP60X", 
          url: "https://www.amazon.fr/s?k=audio+technica+AT-LP60X&tag=setlive-21", 
          desc: "Platine automatique parfaite pour débuter - Best-seller mondial"
        },
        { 
          name: "Audio-Technica AT-LP120", 
          url: "https://www.amazon.fr/s?k=audio+technica+AT-LP120&tag=setlive-21", 
          desc: "Platine semi-pro avec entraînement direct - Qualité DJ"
        },
        { 
          name: "Sony PS-LX310BT", 
          url: "https://www.amazon.fr/dp/B07PBLD4QN?tag=setlive-21", 
          desc: "Platine Bluetooth automatique - Connexion sans fil facile"
        }
      ]
    },
    {
      title: "Enceintes & Audio",
      icon: <Speaker className="text-blue-500" />,
      color: "blue",
      items: [
        { 
          name: "Marshall Stanmore", 
          url: "https://www.amazon.fr/s?k=marshall+stanmore&tag=setlive-21", 
          desc: "Design iconique - Le son des amplis légendaires chez vous"
        },
        { 
          name: "Darty Audio & Hi-Fi", 
          url: "https://action.metaffiliation.com/trk.php?mclic=P51C4C414550505&redir=https://www.darty.com/nav/extra/extra_son", 
          desc: "Enceintes, amplis, chaînes Hi-Fi - Livraison et installation"
        },
        { 
          name: "Boulanger Audio", 
          url: "https://action.metaffiliation.com/trk.php?mclic=P51C4C414550505&redir=https://www.boulanger.com/c/tous-les-produits-son-hifi", 
          desc: "Large choix platines, enceintes et casques - Garantie étendue"
        }
      ]
    },
    {
      title: "Casques Audio",
      icon: <Headphones className="text-pink-500" />,
      color: "pink",
      items: [
        { 
          name: "Sony WH-1000XM5", 
          url: "https://www.amazon.fr/s?k=sony+wh-1000xm5&tag=setlive-21", 
          desc: "Meilleur casque à réduction de bruit - Qualité studio audiophile"
        },
        { 
          name: "Audio-Technica ATH-M50X", 
          url: "https://www.amazon.fr/dp/B00HVLUR86?tag=setlive-21", 
          desc: "Casque studio professionnel - Référence des ingénieurs du son"
        },
        { 
          name: "Fnac Casques Audio", 
          url: "https://action.metaffiliation.com/trk.php?mclic=P51C4C414550505&redir=https://www.fnac.com/Casques-Audio/Casques/shi412493/w-4", 
          desc: "Tous types de casques - Sans fil, studio, gaming - Retrait 1h"
        }
      ]
    },
    {
      title: "Billetterie Concerts",
      icon: <Music className="text-red-500" />,
      color: "red",
      items: [
        { 
          name: "Fnac Spectacles", 
          url: "https://action.metaffiliation.com/trk.php?mclic=P51C4C414550505&redir=https://spectacles.fnac.com/", 
          desc: "Tous les concerts et festivals en France - Points de retrait partout"
        },
        { 
          name: "Cultura Billetterie", 
          url: "https://action.metaffiliation.com/trk.php?mclic=P51C4C414550505&redir=https://www.cultura.com/spectacles.html", 
          desc: "Concerts, théâtre, one-man shows - Retrait en magasin gratuit"
        }
      ]
    }
  ];

  const colorClasses = {
    blue: {
      border: "hover:border-[#4d94ff]",
      text: "group-hover:text-[#4d94ff]"
    },
    green: {
      border: "hover:border-[#00ff00]",
      text: "group-hover:text-[#00ff00]"
    },
    purple: {
      border: "hover:border-purple-500",
      text: "group-hover:text-purple-400"
    },
    yellow: {
      border: "hover:border-yellow-500",
      text: "group-hover:text-yellow-400"
    },
    pink: {
      border: "hover:border-pink-500",
      text: "group-hover:text-pink-400"
    },
    red: {
      border: "hover:border-red-500",
      text: "group-hover:text-red-400"
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
            Notre sélection de matériel audio, vinyles et merch pour vivre vos concerts à 100%
          </p>
        </div>

        {/* Top Pick Banner */}
        <a 
          href="https://www.amazon.fr/s?k=audio+technica+AT-LP60X&tag=setlive-21" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block mb-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 rounded-2xl p-6 sm:p-8 hover:border-blue-500 transition-all group"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Speaker className="w-12 h-12 text-blue-500" />
              <div className="text-center sm:text-left">
                <div className="text-xs text-blue-400 font-bold mb-1">🏆 BEST-SELLER</div>
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-blue-400 mb-1">
                  Audio-Technica AT-LP60X
                </h2>
                <p className="text-sm text-gray-300">
                  La platine vinyle n°1 des débutants - À partir de 149€
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
              Voir sur Amazon
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
                      <h3 className={`font-bold text-sm sm:text-base mb-2 ${colorClasses[sec.color].text} transition-colors`}>
                        {item.name}
                      </h3>
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
        <div className="mt-12 p-6 bg-[#252525]/30 border border-[#333] rounded-2xl">
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed text-center">
            <strong className="text-white">💡 Bon à savoir :</strong> Certains liens sont affiliés. 
            En achetant via ces liens, vous soutenez Setlive sans surcoût. 
            Nous recommandons uniquement des produits que nous utiliserions nous-mêmes.
          </p>
        </div>

      </div>
      
      <Footer />
    </div>
  );
}
