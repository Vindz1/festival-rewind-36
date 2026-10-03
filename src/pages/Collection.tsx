// src/pages/Collection.tsx — Vinyl Analytics intégré au site (page autonome /collection.html)
import { Header } from '@/components/Header';

export default function Collection() {
  return (
    <div className="sl-page flex h-screen flex-col">
      <Header />
      <iframe
        title="My Vinyl Collection — Analytics Pro"
        src="/collection.html"
        className="w-full flex-1 border-0"
      />
    </div>
  );
}
