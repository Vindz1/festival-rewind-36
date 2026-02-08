import { supabase } from '@/supabaseClient';

export interface UserSubscription {
  subscription_type: 'free' | 'premium';
  can_export: boolean;
  end_date?: string;
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
