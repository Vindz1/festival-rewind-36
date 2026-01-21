import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, redirectUri, userId } = await req.json();
    
    console.log('Spotify auth request:', { action, hasCode: !!code, redirectUri, userId });

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify credentials not configured');
    }

    if (action === 'getAuthUrl') {
      const scopes = [
        'playlist-modify-public',
        'playlist-modify-private',
        'user-read-email',
      ].join(' ');

      const authUrl = new URL('https://accounts.spotify.com/authorize');
      authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('show_dialog', 'true');

      return new Response(
        JSON.stringify({ success: true, authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchangeCode') {
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Spotify token error:', error);
        throw new Error('Failed to exchange code for tokens');
      }

      const tokens = await tokenResponse.json();
      console.log('Got Spotify tokens, expires_in:', tokens.expires_in);

      // Save tokens to profile
      if (userId) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
        
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            user_id: userId,
            spotify_access_token: tokens.access_token,
            spotify_refresh_token: tokens.refresh_token,
            spotify_token_expires_at: expiresAt,
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Error saving tokens:', upsertError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          accessToken: tokens.access_token,
          expiresIn: tokens.expires_in,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'refreshToken') {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Get refresh token from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('spotify_refresh_token')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.spotify_refresh_token) {
        throw new Error('No refresh token found');
      }

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: profile.spotify_refresh_token,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokens = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Update tokens
      await supabase
        .from('profiles')
        .update({
          spotify_access_token: tokens.access_token,
          spotify_token_expires_at: expiresAt,
          ...(tokens.refresh_token && { spotify_refresh_token: tokens.refresh_token }),
        })
        .eq('user_id', userId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          accessToken: tokens.access_token,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in spotify-auth function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
