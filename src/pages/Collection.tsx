// src/pages/Collection.tsx — Vinyl Analytics intégré au site (page autonome /collection.html)
import { useRef, useState } from 'react';
import { Header } from '@/components/Header';

export default function Collection() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [missing, setMissing] = useState(false);

  // Si /collection.html renvoie le site lui-même (fichier absent du déploiement), on l'explique au lieu d'afficher « le site dans le site »
  const onLoad = () => {
    try {
      const doc = frame.current?.contentDocument;
      if (doc && doc.getElementById('root')) setMissing(true);
    } catch { /* origine différente : on laisse tel quel */ }
  };

  return (
    <div className="sl-page flex h-screen flex-col">
      <Header />
      {missing ? (
        <div className="mx-auto mt-16 max-w-lg rounded-lg border border-[var(--sl-groove)] bg-[var(--sl-paper)] p-8 text-center">
          <p className="sl-display text-3xl">Fichier introuvable</p>
          <p className="mt-3 text-sm text-[var(--sl-muted)]">
            Le fichier <code className="sl-mono">public/collection.html</code> n’est pas présent dans le déploiement. Ajoute-le dans le dépôt GitHub (dossier <code className="sl-mono">public</code>, nom exact en minuscules), puis redéploie.
          </p>
        </div>
      ) : (
        <iframe ref={frame} onLoad={onLoad} title="My Vinyl Collection — Analytics Pro" src="/collection.html" className="w-full flex-1 border-0" />
      )}
    </div>
  );
}
