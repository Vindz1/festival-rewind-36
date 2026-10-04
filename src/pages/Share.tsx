// src/pages/Share.tsx — partager Setlive + bouton pour les sites de festivals (thème Vinyl)
import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Code, Copy, Mail, MessageCircle, Share2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FaceTitle, Frame } from '@/components/vinyl/Ui';

const SITE_URL = 'https://setlive.fr';
const SHARE_TEXT = 'Transforme tes concerts et les affiches de festivals en playlists ! 🎸';
const HASHTAGS = 'Setlive,Concerts,Playlists,Festivals';

// Bouton à coller sur le site d'un festival : il ouvre directement l'onglet « Concerts à venir »
const WIDGET_CODE = `<a href="${SITE_URL}/?tab=future" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:10px;background:#14110D;color:#FBF7EF;text-decoration:none;padding:12px 24px;border-radius:6px;font-family:sans-serif;font-weight:bold;border:1px solid #C9971C;"><img src="${SITE_URL}/favicon.svg" alt="Setlive" style="width:24px;height:24px;" /> Crée la playlist du festival avec Setlive</a>`;

const SOCIALS = [
  { name: 'Instagram', icon: Share2, url: 'https://instagram.com', hint: 'Copie le lien pour ta Story', instagram: true },
  { name: 'X / Twitter', icon: Share2, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SITE_URL)}&hashtags=${HASHTAGS}`, hint: 'Partager sur X' },
  { name: 'Facebook', icon: Share2, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`, hint: 'Partager sur Facebook' },
  { name: 'WhatsApp', icon: MessageCircle, url: `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${SITE_URL}`)}`, hint: 'Envoyer à un ami' },
];

export default function Share() {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copy = async (text: string, done: (b: boolean) => void, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      done(true);
      toast.success(okMsg);
      setTimeout(() => done(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const share = async (s: (typeof SOCIALS)[number]) => {
    if (s.instagram) {
      try {
        await navigator.clipboard.writeText(SITE_URL);
        toast.success('Lien copié ! Ouvre Instagram et colle-le dans ta Story.');
        setTimeout(() => window.open(s.url, '_blank'), 1500);
      } catch {
        window.open(s.url, '_blank');
      }
      return;
    }
    window.open(s.url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="sl-page">
      <Header />
      <Frame kicker="Faire connaître Setlive" title="Partager" hero={<p className="mt-4 max-w-xl text-sm text-[var(--sl-paper)]/70">Aide tes amis à transformer leurs concerts en playlists.</p>}>
        <div className="mx-auto max-w-4xl space-y-10">
          <section>
            <FaceTitle face="Face A" title="Pour les fans" />
            <div className="sl-card-dim mb-5 overflow-hidden sm:flex">
              <div className="flex items-center justify-center bg-[var(--sl-ink)] p-8 sm:w-1/3">
                <img src="/favicon.svg" alt="Setlive" className="h-20 w-20" />
              </div>
              <div className="flex flex-col justify-center p-5 sm:w-2/3">
                <p className="sl-display text-2xl">Setlive — tes concerts en playlists</p>
                <p className="mt-1 text-xs text-[var(--sl-muted)]">Concerts passés, concerts à venir et line-ups de festivals en playlists pour Spotify, Deezer, Apple Music…</p>
                <p className="sl-mono mt-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--sl-gold)]">setlive.fr</p>
              </div>
            </div>

            <div className="sl-card-dim mb-5 p-5">
              <label className="sl-label mb-2 block">Lien direct</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input readOnly value={SITE_URL} className="sl-input sl-mono" />
                <button className="sl-btn sl-btn-ink shrink-0" onClick={() => copy(SITE_URL, setCopied, 'Lien copié !')}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {SOCIALS.map((s) => (
                <button key={s.name} onClick={() => share(s)} className="sl-card flex flex-col items-start gap-2 p-4 text-left transition-colors hover:border-[var(--sl-gold)]">
                  <s.icon className="h-5 w-5 text-[var(--sl-gold)]" />
                  <span className="sl-display text-xl leading-none">{s.name}</span>
                  <span className="text-[11px] text-[var(--sl-muted)]">{s.hint}</span>
                </button>
              ))}
            </div>

            <div className="sl-card-dim mt-5 flex flex-col items-center gap-3 p-5 text-center">
              <p className="sl-label">QR code — parfait dans la file d’attente d’un concert</p>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(SITE_URL)}`} alt="QR code Setlive" className="h-32 w-32 rounded bg-white p-2" />
            </div>
          </section>

          <section>
            <FaceTitle face="Face B" title="Pour les festivals" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="sl-card-dim p-5">
                <p className="sl-display mb-1 flex items-center gap-2 text-xl"><Code className="h-4 w-4 text-[var(--sl-gold)]" /> Le bouton web</p>
                <p className="mb-4 text-xs text-[var(--sl-muted)]">Colle ce code HTML sur la page programmation de ton festival : le bouton ouvre Setlive prêt à recevoir l’affiche.</p>
                <div className="mb-4 flex justify-center rounded bg-[var(--sl-paper)] p-4" dangerouslySetInnerHTML={{ __html: WIDGET_CODE }} />
                <div className="relative">
                  <textarea readOnly value={WIDGET_CODE} className="sl-input sl-mono h-24 resize-none text-[11px]" />
                  <button className="sl-btn sl-btn-ink sl-btn-sm absolute right-2 top-2" onClick={() => copy(WIDGET_CODE, setCopiedCode, 'Code HTML copié !')}>
                    {copiedCode ? <Check className="h-3 w-3" /> : 'Copier'}
                  </button>
                </div>
              </div>

              <div className="sl-card-dim flex flex-col justify-between p-5">
                <div>
                  <p className="sl-display mb-1 flex items-center gap-2 text-xl"><Mail className="h-4 w-4 text-[var(--sl-gold)]" /> Un partenariat ?</p>
                  <p className="text-xs text-[var(--sl-muted)]">Tu organises un festival et tu veux prolonger l’expérience de tes festivaliers ? Écris-nous.</p>
                </div>
                <a className="sl-btn sl-btn-gold mt-6" href="mailto:setlive@proton.me?subject=Partenariat Setlive">setlive@proton.me</a>
              </div>
            </div>
          </section>
        </div>
      </Frame>
      <Footer />
    </div>
  );
}
