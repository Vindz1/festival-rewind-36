import { Header } from '@/components/Header';
import { Ticket, ShoppingBag, Disc, ExternalLink, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Shop = () => {
  const categories = [
    {
      title: "Billetterie Officielle",
      icon: <Ticket className="w-6 h-6 text-[#4d94ff]" />,
      links: [
        { name: "Ticketmaster", desc: "Leader mondial des billets", url: "TON_LIEN_AFFILIE" },
        { name: "Fnac Spectacles", desc: "Le choix n°1 en France", url: "TON_LIEN_AFFILIE" },
        { name: "Dice", desc: "Billets sur mobile sans frais cachés", url: "TON_LIEN_AFFILIE" }
      ]
    },
    {
      title: "Merchandising & Vêtements",
      icon: <ShoppingBag className="w-6 h-6 text-[#00ff00]" />,
      links: [
        { name: "EMP", desc: "Le n°1 du merch Metal & Rock", url: "TON_LIEN_AFFILIE" },
        { name: "Large", desc: "Vêtements officiels de groupes", url: "TON_LIEN_AFFILIE" }
      ]
    },
    {
      title: "Supports Physiques",
      icon: <Disc className="w-6 h-6 text-purple-500" />,
      links: [
        { name: "Amazon Music", desc: "Vinyles, CD et éditions limitées", url: "TON_LIEN_AFFILIE" },
        { name: "Rough Trade", desc: "Pour les pépites indépendantes", url: "TON_LIEN_AFFILIE" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 pb-12">
      <Header />
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-black italic uppercase mb-2">SHOP<span className="text-[#4d94ff]">.</span></h1>
        <p className="text-[#a0a0a0] mb-12">Soutenez vos artistes préférés via nos partenaires officiels.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <div key={idx} className="bg-[#2d2d2d] border border-[#404040] rounded-2xl p-6 flex flex-col shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#1a1a1a] rounded-lg border border-[#404040]">{cat.icon}</div>
                <h2 className="font-bold text-xl">{cat.title}</h2>
              </div>
              <div className="space-y-4 flex-1">
                {cat.links.map((link, lIdx) => (
                  <a 
                    key={lIdx} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 bg-[#1a1a1a] rounded-xl border border-transparent hover:border-[#4d94ff] hover:bg-[#252525] transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold group-hover:text-[#4d94ff]">{link.name}</span>
                      <ExternalLink className="w-4 h-4 text-[#404040] group-hover:text-[#4d94ff]" />
                    </div>
                    <p className="text-xs text-[#a0a0a0]">{link.desc}</p>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Shop;
