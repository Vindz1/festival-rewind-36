import { Header } from '@/components/Header';
import { Ticket, ShoppingBag, Disc, ExternalLink, Speaker } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function Shop() {
  const sections = [
    {
      title: "Billetterie",
      icon: <Ticket className="text-[#4d94ff]" />,
      items: [
        { name: "Ticketmaster", url: "#", desc: "Billets officiels & revente sécurisée" },
        { name: "Fnac Spectacles", url: "#", desc: "Le plus grand choix en France" }
      ]
    },
    {
      title: "Merch & Vinyles",
      icon: <Disc className="text-[#00ff00]" />,
      items: [
        { name: "EMP France", url: "#", desc: "Vêtements & Merch Rock / Metal" },
        { name: "Amazon Music", url: "#", desc: "Vinyles & CD en éditions limitées" }
      ]
    },
    {
      title: "Platines & Audio",
      icon: <Speaker className="text-purple-500" />,
      items: [
        { name: "Platines Vinyles", url: "#", desc: "Audio-Technica, Pro-Ject & Sony" },
        { name: "Enceintes Hi-Fi", url: "#", desc: "Le son live dans votre salon" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 pb-20">
      <Header />
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-black italic uppercase mb-12">
          SETLIVE<span className="text-[#4d94ff]">.SHOP</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map((sec, i) => (
            <div key={i} className="space-y-6 bg-[#252525]/30 p-6 rounded-3xl border border-[#333]">
              <div className="flex items-center gap-3 border-b border-[#333] pb-4">
                {sec.icon}
                <h2 className="text-xl font-bold uppercase italic">{sec.title}</h2>
              </div>
              <div className="grid gap-3">
                {sec.items.map((item, j) => (
                  <a key={j} href={item.url} target="_blank" className="group bg-[#252525] p-4 rounded-xl border border-transparent hover:border-[#4d94ff] hover:bg-[#2d2d2d] transition-all flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm group-hover:text-[#4d94ff]">{item.name}</h3>
                      <p className="text-xs text-[#a0a0a0]">{item.desc}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#444] group-hover:text-[#4d94ff]" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
