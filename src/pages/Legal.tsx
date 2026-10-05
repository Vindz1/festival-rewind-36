// src/pages/Legal.tsx — mentions légales & CGV (thème Vinyl, textes inchangés)
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Frame } from '@/components/vinyl/Ui';

const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <section className="sl-card-dim p-5 md:p-6">
    <h2 className="sl-display mb-3 text-2xl"><span className="sl-mono mr-2 text-sm text-[var(--sl-gold)]">{n}.</span>{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed">{children}</div>
  </section>
);

export default function Legal() {
  return (
    <div className="sl-page">
      <Header />
      <Frame kicker="Informations légales" title="Mentions légales & CGV">
        <div className="mx-auto max-w-3xl space-y-5">
          <Section n={1} title="Éditeur du site">
            <p>
              Le site <strong>Setlive.fr</strong> (ci-après « le Site ») est un service édité à titre indépendant.<br />
              Contact : setlive@proton.me<br />
              Hébergeur : Vercel Inc., 340 S Lemon Ave #4133 Walnut, CA 91789, USA.
            </p>
            <p>
              Conformément à l'article 6, III, 2 de la loi n° 2004-575 du 21 juin 2004 (LCEN), l'identité de l'éditeur a été communiquée à l'hébergeur et peut être transmise aux autorités compétentes sur demande.
            </p>
          </Section>

          <Section n={2} title="Conditions Générales de Vente (CGV) - Premium">
            <p><strong>Service :</strong> L'abonnement « Premium » donne accès à des fonctionnalités avancées : exports illimités, téléchargement des listes aux formats .txt et .csv, historique complet des playlists, et analyse complète de la collection de vinyles (plus-value, ROI, graphiques, liste complète, exports CSV et PDF).</p>
            <p><strong>Prix :</strong> 5€ TTC / an.</p>
            <p><strong>Durée et renouvellement :</strong> L'abonnement est souscrit pour une durée d'un an. Il est reconduit automatiquement chaque année, au tarif en vigueur, sauf résiliation.</p>
            <p><strong>Résiliation :</strong> Vous pouvez résilier à tout moment depuis la page « Mon abonnement » (bouton « Gérer mon abonnement »). La résiliation empêche le renouvellement suivant ; l'abonnement reste actif jusqu'à la fin de la période déjà payée.</p>
            <p><strong>Paiement :</strong> Les paiements sont sécurisés et gérés exclusivement par notre partenaire Stripe. Setlive.fr ne conserve aucune coordonnée bancaire.</p>
            <p><strong>Rétractation :</strong> Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de 14 jours pour vous rétracter. Cependant, en utilisant le service (génération de playlist Premium) avant la fin de ce délai, vous renoncez expressément à ce droit.</p>
          </Section>

          <Section n={3} title="Données">
            <p><strong>Connexion :</strong> Votre compte (e-mail et mot de passe) est géré par notre prestataire Supabase. Setlive n'a jamais accès à votre mot de passe en clair.</p>
            <p><strong>Données collectées :</strong> Nous stockons votre email et l'historique des setlists générées pour vous fournir le service « Historique ». Vous pouvez demander la suppression intégrale de vos données à tout moment via setlive@proton.me.</p>
            <p><strong>Prestataires :</strong> Pour fournir le service, certaines données transitent par : Supabase (comptes et historique), Stripe (paiement), Vercel (hébergement), setlist.fm et Apple iTunes (recherche de concerts et de titres), Discogs (collection de vinyles).</p>
            <p><strong>Collection de vinyles :</strong> Le jeton Discogs que vous saisissez reste uniquement dans votre navigateur et n'est transmis qu'à Discogs.</p>
            <p><strong>Mesure d'audience :</strong> Avec votre accord (bandeau cookies), nous utilisons Google Analytics avec anonymisation de l'adresse IP. Vous pouvez modifier votre choix à tout moment via le lien « Gérer les cookies » en bas de page.</p>
          </Section>

          <Section n={4} title="Propriété intellectuelle">
            <p>Setlive est un outil indépendant et n'est pas affilié à Setlist.fm, iTunes, TuneMyMusic.com, ou aux organisateurs des festivals cités (Hellfest, etc.). Les noms d'artistes et de festivals sont la propriété de leurs détenteurs respectifs.</p>
          </Section>
        </div>
      </Frame>
      <Footer />
    </div>
  );
}
