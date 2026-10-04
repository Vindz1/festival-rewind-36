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
              Le site <strong>Setlive.fr</strong> (ci-après « le Site ») est édité par Vincent DENIS, domicilié au 9 rue de la feltière, Lerné.<br />
              Contact : setlive@proton.me<br />
              Hébergeur : Vercel Inc., 340 S Lemon Ave #4133 Walnut, CA 91789, USA.
            </p>
          </Section>

          <Section n={2} title="Conditions Générales de Vente (CGV) - Premium">
            <p><strong>Service :</strong> L'abonnement « Premium » permet l'accès à des fonctionnalités avancées (exports illimités, historique, etc.) pour une durée d'un an.</p>
            <p><strong>Prix :</strong> 5€ TTC / an.</p>
            <p><strong>Paiement :</strong> Les paiements sont sécurisés et gérés exclusivement par notre partenaire Stripe. Setlive.fr ne conserve aucune coordonnée bancaire.</p>
            <p><strong>Rétractation :</strong> Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de 14 jours pour vous rétracter. Cependant, en utilisant le service (génération de playlist Premium) avant la fin de ce délai, vous renoncez expressément à ce droit.</p>
          </Section>

          <Section n={3} title="Données">
            <p><strong>Connexion :</strong> Setlive utilise l'API officielle de iTunes. Nous ne stockons JAMAIS votre mot de passe.</p>
            <p><strong>Données collectées :</strong> Nous stockons votre email et l'historique des setlists générées pour vous fournir le service « Historique ». Vous pouvez demander la suppression intégrale de vos données à tout moment via setlive@proton.me.</p>
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
