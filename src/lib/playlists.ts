// src/lib/playlists.ts — conservation de la liste des titres (historique + exports)
// Les colonnes `tracks` (jsonb) sont ajoutées aux tables playlists_history et playlist_exports.
// Si la colonne n'existe pas encore, on enregistre comme avant (sans la liste) : rien ne casse.
import { supabase } from '@/supabaseClient';
import { withLive } from '@/lib/engine';

export interface StoredTrack { artist: string; name: string; source?: 'exact' | 'average' | 'top' }

// Liste à stocker (null si on n'a pas les titres). « (Live) » est intégré aux titres de setlist si l'option était cochée.
export function toStored(tracks: { artist: string; name?: string; source?: string }[], live = false): StoredTrack[] | null {
  const out: StoredTrack[] = tracks
    .filter((t) => t.name)
    .map((t) => ({
      artist: t.artist,
      name: withLive(t.name as string, t.source, live),
      source: (t.source === 'exact' || t.source === 'average' || t.source === 'top' ? t.source : undefined) as StoredTrack['source'],
    }));
  return out.length ? out : null;
}

// Lecture sûre : colonne absente, ancienne ligne ou format inattendu → null
export function readStored(raw: unknown): StoredTrack[] | null {
  if (!Array.isArray(raw)) return null;
  const out = raw.filter((t: any) => t && typeof t.artist === 'string' && typeof t.name === 'string') as StoredTrack[];
  return out.length ? out : null;
}

export const isMissingTracksColumn = (e: any) =>
  /PGRST204|column.*tracks|tracks.*column/i.test(`${e?.code || ''} ${e?.message || ''} ${e?.details || ''}`);

/** Enregistre un export (compte dans le quota) en gardant la liste exportée. */
export async function trackExportWithTracks(userId: string, playlistName: string, tracks: StoredTrack[]): Promise<boolean> {
  try {
    const row = { user_id: userId, playlist_name: playlistName, track_count: tracks.length, created_at: new Date().toISOString() };
    let { error } = await supabase.from('playlist_exports').insert({ ...row, tracks });
    if (error && isMissingTracksColumn(error)) ({ error } = await supabase.from('playlist_exports').insert(row));
    if (error) {
      console.error("Erreur lors de l'enregistrement de l'export:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erreur critique trackExportWithTracks:', err);
    return false;
  }
}
