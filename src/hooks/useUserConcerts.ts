import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserConcert {
  id: string;
  setlist_fm_event_id: string;
  artist_name: string;
  artist_mbid: string | null;
  event_date: string | null;
  venue_name: string | null;
}

export const useUserConcerts = (festivalId?: string) => {
  const { user } = useAuth();
  const [userConcerts, setUserConcerts] = useState<UserConcert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserConcerts = useCallback(async () => {
    if (!user) {
      setUserConcerts([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('user_concerts')
        .select('*')
        .eq('user_id', user.id);

      if (festivalId) {
        query = query.eq('setlist_fm_event_id', festivalId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUserConcerts(data || []);
    } catch (error) {
      console.error('Error fetching user concerts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, festivalId]);

  useEffect(() => {
    fetchUserConcerts();
  }, [fetchUserConcerts]);

  const toggleConcert = async (
    artistName: string,
    eventId: string,
    artistMbid?: string,
    eventDate?: string,
    venueName?: string
  ) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour sauvegarder vos concerts');
      return;
    }

    const existingConcert = userConcerts.find(
      c => c.artist_name === artistName && c.setlist_fm_event_id === eventId
    );

    try {
      if (existingConcert) {
        const { error } = await supabase
          .from('user_concerts')
          .delete()
          .eq('id', existingConcert.id);

        if (error) throw error;
        setUserConcerts(prev => prev.filter(c => c.id !== existingConcert.id));
      } else {
        const { data, error } = await supabase
          .from('user_concerts')
          .insert({
            user_id: user.id,
            artist_name: artistName,
            setlist_fm_event_id: eventId,
            artist_mbid: artistMbid || null,
            event_date: eventDate || null,
            venue_name: venueName || null,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setUserConcerts(prev => [...prev, data]);
        }
      }
    } catch (error: any) {
      console.error('Error toggling concert:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const isSelected = (artistName: string, eventId: string) => {
    return userConcerts.some(
      c => c.artist_name === artistName && c.setlist_fm_event_id === eventId
    );
  };

  return {
    userConcerts,
    loading,
    toggleConcert,
    isSelected,
    refetch: fetchUserConcerts,
  };
};
