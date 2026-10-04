import { supabase } from '@/supabaseClient';
import { isMissingTracksColumn, toStored } from '@/lib/playlists';

export interface HistoryEntry {
  userId: string;
  playlistName: string;
  // artiste obligatoire (stats) ; titre et source servent à pouvoir rouvrir la playlist plus tard
  tracks: { artist: string; name?: string; source?: string }[];
  sourceType: 'concert' | 'upcoming';
  platform: 'spotify' | 'csv';
  live?: boolean;
}

export async function saveToHistory({ userId, playlistName, tracks, sourceType, platform, live = false }: HistoryEntry) {
  try {
    // 1. On extrait les 5 artistes les plus récurrents pour les stats rapides
    const artistCounts: { [key: string]: number } = {};
    tracks.forEach((t) => {
      artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
    });
    const topArtists = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    // 2. On insère dans Supabase (avec la liste des titres si la colonne existe)
    const row = {
      user_id: userId,
      playlist_name: playlistName,
      source_type: sourceType,
      track_count: tracks.length,
      top_artists: topArtists, // Stocké en JSONB
      platform_target: platform,
      created_at: new Date().toISOString(),
    };
    const stored = toStored(tracks, live);
    let { error } = await supabase.from('playlists_history').insert(stored ? { ...row, tracks: stored } : row);
    if (error && stored && isMissingTracksColumn(error)) ({ error } = await supabase.from('playlists_history').insert(row));

    if (error) console.error('Erreur lors de la sauvegarde historique:', error);
  } catch (err) {
    // On ne bloque pas l'utilisateur si l'historique plante, c'est une feature « invisible »
    console.error('Erreur critique historique:', err);
  }
}
