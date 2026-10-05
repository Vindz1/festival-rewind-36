// api/create-portal-session.js — ouvre le portail Stripe (résiliation, moyen de paiement, factures)
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Qui appelle ? On vérifie le jeton de connexion : jamais un identifiant envoyé par le navigateur
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Connexion requise' });
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth?.user) return res.status(401).json({ error: 'Session invalide' });

    // 2. Son client Stripe (enregistré lors du paiement par verify-payment)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', auth.user.id)
      .single();
    if (error || !profile?.stripe_customer_id) return res.status(404).json({ error: 'Aucun abonnement trouvé' });

    // 3. Page de gestion hébergée par Stripe
    const base = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${base}/subscription`,
    });
    return res.status(200).json({ url: portal.url });
  } catch (err) {
    console.error('Erreur portail Stripe:', err);
    return res.status(500).json({ error: err.message });
  }
}
