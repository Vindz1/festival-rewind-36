// src/lib/collectionPdf.ts — PDF d'une analyse de collection archivée (pdfmake chargé à la demande)
import type { ArchivedItem } from '@/lib/collectionArchive';

interface PdfMakeLike {
  vfs?: unknown;
  createPdf: (definition: unknown) => { download: (fileName: string) => void };
}

export interface AnalysisSummary {
  created_at: string;
  discogs_username: string | null;
  item_count: number;
  total_value: number;
  total_purchase: number;
  total_gain: number;
  roi: number | null;
}

const PDFMAKE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/pdfmake.min.js';
const FONTS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/vfs_fonts.js';

let loading: Promise<PdfMakeLike> | null = null;

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Chargement impossible : ${src}`));
    document.head.appendChild(s);
  });

function getPdfMake(): Promise<PdfMakeLike> {
  const w = window as unknown as { pdfMake?: PdfMakeLike };
  if (w.pdfMake?.vfs) return Promise.resolve(w.pdfMake);
  if (!loading) {
    loading = (async () => {
      if (!w.pdfMake) await loadScript(PDFMAKE_URL);
      if (!w.pdfMake?.vfs) await loadScript(FONTS_URL);
      if (!w.pdfMake) throw new Error('pdfmake indisponible');
      return w.pdfMake;
    })().catch((err) => { loading = null; throw err; });
  }
  return loading;
}

// Les espaces insécables des nombres français ne s'affichent pas dans la police du PDF : on les remplace
const clean = (s: string) => s.replace(/[\u202f\u00a0]/g, ' ');
const eur = (n: number, digits = 0) =>
  clean(Number(n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: digits, maximumFractionDigits: digits }));
const dateFr = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export async function downloadCollectionPdf(a: AnalysisSummary, items: ArchivedItem[]) {
  const pdfMake = await getPdfMake();

  const byValue = [...items].sort((x, y) => y.marche - x.marche);
  const inventory = [...items].sort((x, y) => x.artist.localeCompare(y.artist, 'fr') || x.title.localeCompare(y.title, 'fr'));

  const th = (text: string, alignment = 'left') => ({ text, bold: true, fontSize: 8, color: '#F1E9D8', fillColor: '#14110D', alignment, margin: [0, 3, 0, 3] });
  const td = (text: string, alignment = 'left') => ({ text, fontSize: 8, alignment });
  const kpi = (label: string, value: string) => ({
    stack: [
      { text: label.toUpperCase(), fontSize: 7, color: '#8A8272' },
      { text: value, fontSize: 18, bold: true, margin: [0, 2, 0, 0] },
    ],
  });
  const lines = { hLineColor: () => '#DED2B8', vLineColor: () => '#DED2B8', hLineWidth: () => 0.5, vLineWidth: () => 0 };

  const topRows = byValue.slice(0, 10).map((i) => [
    td(i.artist), td(i.title), td(i.condition), td(i.year),
    td(i.marche > 0 ? eur(i.marche, 2) : 'N/C', 'right'),
  ]);
  const inventoryRows = inventory.map((i) => [
    td(i.artist), td(i.title), td(i.condition), td(i.year),
    td(i.achat > 0 ? eur(i.achat, 2) : '-', 'right'),
    td(i.marche > 0 ? eur(i.marche, 2) : 'N/C', 'right'),
  ]);

  const definition = {
    pageOrientation: 'landscape',
    pageMargins: [30, 30, 30, 40],
    info: { title: 'Analyse de collection de vinyles' },
    defaultStyle: { fontSize: 9 },
    footer: (current: number, count: number) => ({ text: `${current} / ${count}`, alignment: 'center', fontSize: 8, color: '#8A8272', margin: [0, 12, 0, 0] }),
    content: [
      { text: 'My Vinyl Collection', fontSize: 22, bold: true },
      {
        text: `Analyse du ${dateFr(a.created_at)}${a.discogs_username ? ` · compte Discogs ${a.discogs_username}` : ''} · ${a.item_count} disques`,
        fontSize: 10, color: '#8A8272', margin: [0, 2, 0, 14],
      },
      {
        columns: [
          kpi('Valeur marché', eur(a.total_value)),
          kpi('Achats renseignés', eur(a.total_purchase)),
          kpi('Gain', eur(a.total_gain)),
          kpi('ROI', a.roi == null ? '—' : `${Math.round(Number(a.roi))} %`),
        ],
        columnGap: 10, margin: [0, 0, 0, 18],
      },
      { text: 'Les 10 disques les plus cotés', fontSize: 12, bold: true, margin: [0, 0, 0, 6] },
      {
        table: { headerRows: 1, widths: ['*', '*', 70, 45, 70], body: [[th('Artiste'), th('Titre'), th('État'), th('Année'), th('Cote', 'right')], ...topRows] },
        layout: lines,
      },
      { text: 'Inventaire complet', fontSize: 12, bold: true, pageBreak: 'before', margin: [0, 0, 0, 6] },
      {
        table: { headerRows: 1, widths: ['*', '*', 70, 45, 65, 65], body: [[th('Artiste'), th('Titre'), th('État'), th('Année'), th('Achat', 'right'), th('Cote', 'right')], ...inventoryRows] },
        layout: lines,
      },
    ],
  };

  pdfMake.createPdf(definition).download(`collection-${a.created_at.slice(0, 10)}.pdf`);
}
