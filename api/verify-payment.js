import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// On utilise la clé SERVICE_ROLE pour avoir le droit d'écrire n'importe où
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sessionId } = req.body;

    // 1. On demande à Stripe : "Ce paiement est-il validé ?"
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const userId = session.metadata.userId;

      // 2. Si oui, on active le Premium dans Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ 
            subscription_status: 'premium',
            subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // +1 an
            stripe_customer_id: session.customer
        })
        .eq('id', userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: 'Paiement non validé' });
    }

  } catch (error) {
    console.error('Erreur validation:', error);
    res.status(500).json({ error: error.message });
  }
}
