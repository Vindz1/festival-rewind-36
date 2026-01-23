import { Ticket, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AffiliateLinksProps {
  artistName: string;
  variant?: 'compact' | 'full';
}

export const AffiliateLinks = ({ artistName, variant = 'compact' }: AffiliateLinksProps) => {
  // Build affiliate URLs
  const ticketMasterUrl = `https://www.ticketmaster.com/search?q=${encodeURIComponent(artistName)}`;
  const diceUrl = `https://dice.fm/search?query=${encodeURIComponent(artistName)}`;
  const merchbarUrl = `https://www.merchbar.com/search?q=${encodeURIComponent(artistName)}`;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <a 
          href={ticketMasterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors text-muted-foreground hover:text-foreground"
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Billets</span>
        </a>
        <a 
          href={merchbarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors text-muted-foreground hover:text-foreground"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Merch</span>
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <a 
        href={ticketMasterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1"
      >
        <Button variant="outline" className="w-full gap-2">
          <Ticket className="w-4 h-4" />
          Billets & Tournées
        </Button>
      </a>
      <a 
        href={diceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1"
      >
        <Button variant="outline" className="w-full gap-2">
          <Ticket className="w-4 h-4" />
          DICE Events
        </Button>
      </a>
      <a 
        href={merchbarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1"
      >
        <Button variant="outline" className="w-full gap-2">
          <ShoppingBag className="w-4 h-4" />
          Merch Officiel
        </Button>
      </a>
    </div>
  );
};