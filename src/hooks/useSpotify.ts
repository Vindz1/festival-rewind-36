import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSpotify = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkConnection = useCallback(async () => {
    if (!user) {
      setIsConnected(false);
      setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('spotify_access_token, spotify_token_expires_at')
        .eq('user_id', user.id)
        .single();

      if (profile?.spotify_access_token) {
        // Check if token is not expired
        if (profile.spotify_token_expires_at) {
          const expiresAt = new Date(profile.spotify_token_expires_at);
          setIsConnected(expiresAt > new Date());
        } else {
          setIsConnected(true);
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = async () => {
    if (!user) return;

    try {
      const redirectUri = `${window.location.origin}/spotify-callback`;
      
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'getAuthUrl', redirectUri },
      });

      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      throw error;
    }
  };

  const exchangeCode = async (code: string) => {
    if (!user) return;

    try {
      const redirectUri = `${window.location.origin}/spotify-callback`;
      
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'exchangeCode', code, redirectUri, userId: user.id },
      });

      if (error) throw error;
      setIsConnected(true);
      return data;
    } catch (error) {
      console.error('Error exchanging Spotify code:', error);
      throw error;
    }
  };

  return {
    isConnected,
    loading,
    connect,
    exchangeCode,
    refetch: checkConnection,
  };
};
