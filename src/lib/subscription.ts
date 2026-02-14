import { supabase } from '@/supabaseClient';

export interface UserSubscription {
  subscription_type: 'free' | 'premium';
  can_export: boolean;
  end_date?: string;
}

export async function checkExportQuota(userId: string): Promise<{ 
  canExport: boolean; 
  remaining: number;
  isPremium: boolean;
  renewalDate?: string;
}> {
  const sub = await getUserSubscription(userId);
  
  if (sub.subscription_type === 'premium') {
    return { 
      canExport: true, 
      remaining: -1, // Illimité
      isPremium: true,
      renewalDate: sub.end_date 
    };
  }
  
  // Gratuit : vérifier les exports de l'année
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
  
  const { count, error } = await supabase
    .from('playlist_exports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfYear);
  
  const used = count || 0;
  const remaining = Math.max(0, 2 - used);
  
  return { 
    canExport: remaining > 0, 
    remaining,
    isPremium: false,
    renewalDate: `${new Date().getFullYear() + 1}-01-01`
  };
}

export async function trackExport(userId: string, playlistId: string) {
  await supabase.from('playlist_exports').insert({
    user_id: userId,
    playlist_id: playlistId,
    created_at: new Date().toISOString()
  });
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  try {
    // On va lire la colonne 'subscription_status' dans la table 'profiles'
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
      can_export: isPremium, // Si Premium, export autorisé
      end_date: data.subscription_end_date
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return { subscription_type: 'free', can_export: false };
  }
}
