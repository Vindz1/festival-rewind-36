import { Header } from '@/components/Header';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Legal() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 pb-12">
      <Header />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-black italic uppercase mb-8 text-[#4d94ff]">Mentions Légales & CGV</h1>
        
        <div className="bg-[#252525] p-8 rounded-3xl border border-[#333] space-y-8 text-sm text-[#d0d0d0]">
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4 uppercase">1. Éditeur du site</h2>
            <p>
              Le site <strong>Setlive.fr</strong> (ci-après "le Site") est édité par Vincent DENIS, domicilié au 9 rue de la feltière, Lerné.<br/>
              Contact : setlive@proton.me<br/>
              Hébergeur : Vercel Inc., 340 S Lemon Ave #4133 Walnut, CA 91789, USA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 uppercase">2. Conditions Générales de Vente (CGV) - Premium</h2>
            <p className="mb-2"><strong>Service :</strong> L'abonnement "Premium" permet l'accès à des fonctionnalités avancées (exports illimités, historique, etc.) pour une durée d'un an.</p>
            <p className="mb-2"><strong>Prix :</strong> 5€ TTC / an.</p>
            <p className="mb-2"><strong>Paiement :</strong> Les paiements sont sécurisés et gérés exclusivement par notre partenaire Stripe. Setlive.fr ne conserve aucune coordonnée bancaire.</p>
            <p><strong>Rétractation :</strong> Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de 14 jours pour vous rétracter. Cependant, en utilisant le service (génération de playlist Premium) avant la fin de ce délai, vous renoncez expressément à ce droit.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 uppercase">3. Données & Spotify</h2>
            <p className="mb-2">
              <strong>Connexion Spotify :</strong> Setlive utilise l'API officielle de Spotify. Nous ne stockons JAMAIS votre mot de passe. Nous conservons uniquement un "token" d'accès temporaire pour créer les playlists sur votre compte à votre demande.
            </p>
            <p>
              <strong>Données collectées :</strong> Nous stockons votre email et l'historique des setlists générées pour vous fournir le service "Historique". Vous pouvez demander la suppression intégrale de vos données à tout moment via vindz1@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 uppercase">4. Propriété Intellectuelle</h2>
            <p>
              Setlive est un outil indépendant et n'est pas affilié à Setlist.fm, Spotify, ou aux organisateurs des festivals cités (Hellfest, etc.). Les noms d'artistes et de festivals sont la propriété de leurs détenteurs respectifs.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
