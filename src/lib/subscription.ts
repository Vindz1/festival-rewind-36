import { supabase } from '@/supabaseClient';

export interface UserSubscription {
  subscription_type: 'free' | 'premium';
  can_export: boolean;
  end_date?: string;
}

export interface ExportQuota {
  canExport: boolean;
  remaining: number;
  isPremium: boolean;
  renewalDate: string;
  used: number;
}

/**
 * Récupère le statut d'abonnement de l'utilisateur
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_end_date')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('⚠️ Erreur ou pas de profil trouvé, retour au mode gratuit par défaut');
      return { subscription_type: 'free', can_export: false };
    }

    const isPremium = data.subscription_status === 'premium';
    
    return {
      subscription_type: isPremium ? 'premium' : 'free',
      can_export: isPremium,
      end_date: data.subscription_end_date
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return { subscription_type: 'free', can_export: false };
  }
}

/**
 * Vérifie le quota d'exports annuel de l'utilisateur
 * - Premium : illimité
 * - Gratuit : 2 exports par an
 */
export async function checkExportQuota(userId: string): Promise<ExportQuota> {
  try {
    // 1. Vérifier si Premium
    const sub = await getUserSubscription(userId);
    
    if (sub.subscription_type === 'premium') {
      return {
        canExport: true,
        remaining: -1, // -1 = illimité
        isPremium: true,
        renewalDate: sub.end_date || '',
        used: 0
      };
    }

    // 2. Gratuit : compter les exports de l'année en cours
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString();
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

    const { count, error } = await supabase
      .from('playlist_exports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfYear)
      .lte('created_at', endOfYear);

    if (error) {
      console.error('Erreur lors du comptage des exports:', error);
      // En cas d'erreur, on autorise quand même (meilleure UX)
      return {
        canExport: true,
        remaining: 2,
        isPremium: false,
        renewalDate: `${currentYear + 1}-01-01`,
        used: 0
      };
    }

    const used = count || 0;
    const remaining = Math.max(0, 2 - used);

    return {
      canExport: remaining > 0,
      remaining,
      isPremium: false,
      renewalDate: `${currentYear + 1}-01-01`,
      used
    };
  } catch (error) {
    console.error('Erreur checkExportQuota:', error);
    return {
      canExport: false,
      remaining: 0,
      isPremium: false,
      renewalDate: '',
      used: 0
    };
  }
}

/**
 * Enregistre un export (décrémente le quota)
 */
export async function trackExport(userId: string, playlistName: string, trackCount: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('playlist_exports')
      .insert({
        user_id: userId,
        playlist_name: playlistName,
        track_count: trackCount,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erreur lors de l\'enregistrement de l\'export:', error);
      return false;
    }

    console.log('✅ Export tracké avec succès');
    return true;
  } catch (error) {
    console.error('Erreur critique trackExport:', error);
    return false;
  }
}

/**
 * Récupère l'historique des exports de l'utilisateur
 */
export async function getExportHistory(userId: string, year?: number) {
  const targetYear = year || new Date().getFullYear();
  const startOfYear = new Date(targetYear, 0, 1).toISOString();
  const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('playlist_exports')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfYear)
    .lte('created_at', endOfYear)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération historique exports:', error);
    return [];
  }

  return data || [];
}
