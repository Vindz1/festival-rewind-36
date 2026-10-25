// src/lib/collectionArchive.ts — archivage des analyses « My Vinyl Collection » (affichées dans Back in Time)
import { supabase } from '@/supabaseClient';

// Copie complète d'un disque tel que la page collection.html le manipule (pochette incluse),
// pour pouvoir régénérer exactement le même PDF plus tard.
export interface ArchivedItem {
  id: string | number;
  artist: string;
  title: string;
  format?: string;
  condition?: string;
  mediaCond?: string;
  sleeveCond?: string;
  initialYear?: string | number;
  pressingYear?: string | number;
  ecart?: string | number;
  addedMonthRaw?: string;
  country?: string;
  label?: string;
  thumb?: string;
  confidence?: number;
  achat: number;
  marche: number;
  pv?: number;
  roi?: number;
  manuallyEdited?: boolean;
}

type Raw = Record<string, unknown>;

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Transforme les résultats de la page vinyle en un instantané complet. */
export function buildSnapshot(rows: Raw[], financial: Raw[]) {
  const items = rows.map((r) => JSON.parse(JSON.stringify(r)) as ArchivedItem);
  const totalValue = round2(items.reduce((s, i) => s + num(i.marche), 0));
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
