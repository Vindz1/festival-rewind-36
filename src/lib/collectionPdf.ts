// src/lib/collectionPdf.ts — PDF d'une analyse archivée : on réutilise le générateur PDF de /collection.html
// (même mise en page, même fond, mêmes pochettes et graphiques que le PDF de fin d'analyse).
import type { ArchivedItem } from '@/lib/collectionArchive';

type PageWin = Window & {
  eval: (code: string) => unknown;
  triggerPrint?: () => Promise<void>;
  Date: DateConstructor;
  __slArchiveData?: unknown;
};

export interface AnalysisSummary {
  created_at: string;
  discogs_username: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function downloadCollectionPdf(a: AnalysisSummary, items: ArchivedItem[]) {
  if (!items.length) throw new Error('Analyse vide');

  const iframe = document.createElement('iframe');
  iframe.src = '/collection.html';
  iframe.tabIndex = -1;
  iframe.setAttribute('aria-hidden', 'true');
  // Hors écran mais bien « affichée » : les graphiques ont besoin d'une vraie taille pour se dessiner
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1280px;height:900px;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Chargement de la page collection trop long')), 20000);
      iframe.onload = () => { clearTimeout(timeout); resolve(); };
      iframe.onerror = () => { clearTimeout(timeout); reject(new Error('Page collection introuvable')); };
    });

    const w = iframe.contentWindow as PageWin | null;
    if (!w || typeof w.triggerPrint !== 'function') throw new Error('Générateur PDF indisponible');

    // 1. Palier premium (sinon la page limiterait les tableaux à 3 lignes)
    w.postMessage({ type: 'sl-tier', tier: 'premium' }, window.location.origin);
    await sleep(400);

    // 2. On remet les données archivées à la place d'un scan, puis on dessine le tableau de bord
    w.__slArchiveData = items;
    w.eval(
      "allResults = window.__slArchiveData;" +
      "validFinancialResults = allResults.filter(function (r) { return r.achat > 0 && r.marche > 0; });" +
      `currentUsername = ${JSON.stringify(a.discogs_username || '')};` +
      "generateDashboard();",
    );

    // 3. On laisse les graphiques finir leur animation (le PDF en reprend l'image)
    await sleep(2500);

    // 4. Le PDF affichera la date de l'analyse archivée, pas celle d'aujourd'hui
    const fixed = new Date(a.created_at).getTime();
    const Base = w.Date as unknown as new (...args: unknown[]) => Date;
    class ArchiveDate extends Base {
      constructor(...args: unknown[]) {
        if (args.length === 0) super(fixed);
        else super(...args);
      }
    }
    w.Date = ArchiveDate as unknown as DateConstructor;

    // 5. Génération et téléchargement par la fonction d'origine de la page
    await w.triggerPrint();
    await sleep(1500);
  } finally {
    iframe.remove();
  }
}
