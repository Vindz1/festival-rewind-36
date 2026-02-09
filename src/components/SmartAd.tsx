import { ShoppingBag, Disc, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartAdProps {
  artistName: string;
  index: number; // Pour varier les pubs (une fois Amazon, une fois Fnac...)
}

export const SmartAd = ({ artistName, index }: SmartAdProps) => {
  // 1. Détection simple de genre (à améliorer avec le temps)
  const isMetal = ["Gojira", "Metallica", "Iron Maiden", "Slipknot", "Rammstein"].some(a => 
    artistName.toLowerCase().includes(a.toLowerCase())
  );

  // 2. Choix de la pub en fonction de l'index (Pair = Amazon, Impair = Fnac/EMP)
  const adType = index % 2 === 0 ? 'amazon' : 'merch';

  // 3. Liens d'affiliation (À REMPLACER PAR VOS VRAIS LIENS PARTENAIRES PLUS TARD)
  // Astuce : Sur Amazon, le paramètre &tag=votre_tag permet de toucher la commission
  const amazonLink = `https://www.amazon.fr/s?k=${encodeURIComponent(artistName)}+vinyl&tag=setlive-21`;
  const fnacLink = `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${encodeURIComponent(artistName)}`;

  if (adType === 'amazon') {
    return (
      <div className="my-4 p-4 rounded-xl bg-gradient-to-r from-[#252525] to-[#1a1a1a] border border-[#333] flex items-center justify-between group hover:border-[#4d94ff]/50 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-yellow-500">
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-200 group-hover:text-white">
              Fan de {artistName} ?
            </p>
            <p className="text-xs text-[#a0a0a0]">
              Complétez votre collection vinyle sur Amazon.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-2 text-[#4d94ff] hover:text-white hover:bg-[#4d94ff]">
          <a href={amazonLink} target="_blank" rel="noopener noreferrer">
            Voir les offres <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="my-4 p-4 rounded-xl bg-gradient-to-r from-[#2a1a1a] to-[#1a1a1a] border border-red-900/30 flex items-center justify-between group hover:border-red-500/50 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-red-500">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-200 group-hover:text-white">
            Merch Officiel
          </p>
          <p className="text-xs text-[#a0a0a0]">
            T-shirts & Accessoires {artistName} disponibles.
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" asChild className="gap-2 text-red-500 hover:text-white hover:bg-red-600">
        <a href={fnacLink} target="_blank" rel="noopener noreferrer">
          Acheter <ExternalLink className="w-3 h-3" />
        </a>
      </Button>
    </div>
  );
};
