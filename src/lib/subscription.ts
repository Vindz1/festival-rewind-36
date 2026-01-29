import { supabase } from '@/integrations/supabase/client';

export interface UserSubscription {
  subscription_type: 'free' | 'premium' | 'admin';
  exports_this_year: number;
  can_export: boolean;
  remaining_exports?: number;
}

const FREE_LIMIT = 2; // Nombre d'exports gratuits par an

/**
 * Récupère les infos d'abonnement de l'utilisateur
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  try {
    // 1. Récupérer le type d'abonnement
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('subscription_type')
      .eq('user_id', userId)
      .single();

    const subscriptionType = subscription?.subscription_type || 'free';

    // 2. Si admin ou premium, pas de limite
    if (subscriptionType === 'admin' || subscriptionType === 'premium') {
      return {
        subscription_type: subscriptionType,
        exports_this_year: 0,
        can_export: true,
      };
    }

    // 3. Pour les gratuits, compter les exports de cette année
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1).toISOString();
    
    const { data: exports, error } = await supabase
      .from('playlist_exports')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', yearStart);

    if (error) throw error;

    const exportsThisYear = exports?.length || 0;
    const canExport = exportsThisYear < FREE_LIMIT;

    return {
      subscription_type: 'free',
      exports_this_year: exportsThisYear,
      can_export: canExport,
      remaining_exports: Math.max(0, FREE_LIMIT - exportsThisYear),
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    // Par défaut, retourner free sans accès
    return {
      subscription_type: 'free',
      exports_this_year: FREE_LIMIT,
      can_export: false,
      remaining_exports: 0,
    };
  }
}

/**
 * Enregistre un export de playlist
 */
export async function recordPlaylistExport(
  userId: string,
  playlistName: string,
  trackCount: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('playlist_exports')
      .insert({
        user_id: userId,
        playlist_name: playlistName,
        track_count: trackCount,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error recording export:', error);
    return false;
  }
}

/**
 * Définir le type d'abonnement (admin uniquement)
 */
export async function setSubscriptionType(
  userId: string,
  type: 'free' | 'premium' | 'admin'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        subscription_type: type,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error setting subscription:', error);
    return false;
  }
}

/**
 * Créer un abonnement gratuit pour un nouvel utilisateur
 */
export async function createFreeSubscription(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_type: 'free',
      });

    if (error) {
      // Si l'utilisateur existe déjà, ignorer l'erreur
      if (error.code === '23505') return true;
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return false;
  }
}
