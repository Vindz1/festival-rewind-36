import { supabase } from '@/supabaseClient';

export interface HistoryEntry {
  userId: string;
  playlistName: string;
  tracks: { artist: string }[]; // On a juste besoin du nom de l'artiste pour les stats
  sourceType: 'concert' | 'upcoming';
  platform: 'spotify' | 'csv';
}

export async function saveToHistory({ userId, playlistName, tracks, sourceType, platform }: HistoryEntry) {
  try {
    // 1. On extrait les 5 artistes les plus récurrents pour les stats rapides
    const artistCounts: { [key: string]: number } = {};
    tracks.forEach(t => {
      const artist = t.artist;
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    });

    // On trie pour avoir les top artistes
    const topArtists = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a) // Tri décroissant
      .slice(0, 5) // On garde les 5 premiers
      .map(([name]) => name);

    // 2. On insère dans Supabase
    const { error } = await supabase
      .from('playlists_history')
      .insert({
        user_id: userId,
        playlist_name: playlistName,
        source_type: sourceType,
        track_count: tracks.length,
        top_artists: topArtists, // Stocké en JSONB
        platform_target: platform,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Erreur lors de la sauvegarde historique:', error);
    } else {
      console.log('✅ Historique sauvegardé avec succès !');
    }

  } catch (err) {
    console.error('Erreur critique historique:', err);
    // On ne bloque pas l'utilisateur si l'historique plante, c'est une feature "invisible"
  }
}
