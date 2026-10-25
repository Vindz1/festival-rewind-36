// src/lib/collectionArchive.ts — archivage des analyses « My Vinyl Collection » (affichées dans Back in Time)
import { supabase } from '@/supabaseClient';

export interface ArchivedItem {
  id: string;
  artist: string;
  title: string;
  format: string;
  condition: string;
  year: string;
  country: string;
  label: string;
  confidence: number;
  achat: number;
  marche: number;
}

type Raw = Record<string, unknown>;

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
};
const txt = (v: unknown) => (v == null ? '' : String(v));
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Transforme les résultats de la page vinyle en un instantané compact (sans les images). */
export function buildSnapshot(rows: Raw[], financial: Raw[]) {
  const items: ArchivedItem[] = rows.map((r) => ({
    id: txt(r.id),
    artist: txt(r.artist),
    title: txt(r.title),
    format: txt(r.format),
    condition: txt(r.condition),
    year: txt(r.pressingYear),
    country: txt(r.country),
    label: txt(r.label),
    confidence: num(r.confidence),
    achat: num(r.achat),
    marche: num(r.marche),
  }));
  const totalValue = round2(items.reduce((s, i) => s + i.marche, 0));
  const totalPurchase = round2(financial.reduce((s, r) => s + num(r.achat), 0));
  const totalGain = round2(financial.reduce((s, r) => s + num(r.pv), 0));
  const roi = totalPurchase > 0 ? round2((totalGain / totalPurchase) * 100) : null;
  return { items, totalValue, totalPurchase, totalGain, roi };
}

/** Enregistre (ou met à jour) l'analyse de la session en cours. */
export async function archiveCollection(
  userId: string,
  sessionKey: string,
  username: string,
  snap: ReturnType<typeof buildSnapshot>,
): Promise<boolean> {
  try {
    const { error } = await supabase.from('collection_analyses').upsert(
      {
        user_id: userId,
        session_key: sessionKey,
        discogs_username: username || null,
        item_count: snap.items.length,
        total_value: snap.totalValue,
        total_purchase: snap.totalPurchase,
        total_gain: snap.totalGain,
        roi: snap.roi,
        items: snap.items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,session_key' },
    );
    if (error) {
      console.error('Archivage collection impossible :', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Archivage collection : erreur inattendue', err);
    return false;
  }
}
