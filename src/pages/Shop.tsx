import { Header } from '@/components/Header';
import { Ticket, ShoppingBag, Disc, ExternalLink, Zap } from 'lucide-react';

export default function Shop() {
  const sections = [
    {
      id: "tickets",
      title: "Billetterie",
      icon: <Ticket className="text-[#4d94ff]" />,
      items: [
        { name: "Ticketmaster", url: "#", desc: "Billets officiels & revente sécurisée" },
        { name: "Fnac Spectacles", url: "#", desc: "Le plus grand choix en France" },
        { name: "Dice", url: "#", desc: "L'appli préférée des fans de musique" }
      ]
    },
    {
      id: "merch",
      title: "Merch & Vinyles",
      icon: <ShoppingBag className="text-[#00ff00]" />,
      items: [
        { name: "EMP France", url: "#", desc: "Vêtements & Merch Rock / Metal" },
        { name: "Amazon Music", url: "#", desc: "Vinyles, CD & Boxsets limités" },
        { name: "Rough Trade", url: "#", desc: "Le temple des vinyles indépendants" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 pb-20">
      <Header />
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-black italic uppercase mb-12 tracking-tighter">
          Espace <span className="text-[#4d94ff]">Fan</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {sections.map((sec) => (
            <div key={sec.id} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-[#333] pb-4">
                {sec.icon}
                <h2 className="text-2xl font-bold uppercase italic">{sec.title}</h2>
              </div>
              
              <div className="grid gap-4">
                {sec.items.map((item, i) => (
                  <a 
                    key={i} 
                    href={item.url} 
                    target="_blank" 
                    className="group bg-[#252525] p-5 rounded-2xl border border-transparent hover:border-[#4d94ff] hover:bg-[#2d2d2d] transition-all flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-bold group-hover:text-[#4d94ff] transition-colors">{item.name}</h3>
                      <p className="text-sm text-[#a0a0a0]">{item.desc}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-[#444] group-hover:text-[#4d94ff]" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
