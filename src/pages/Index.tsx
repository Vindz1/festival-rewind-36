// src/pages/Index.tsx — le Studio : choisir → ajuster → exporter, sur une seule page
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FaceTitle, Frame, Steps } from '@/components/vinyl/Ui';
import SourcePast from '@/components/studio/SourcePast';
import SourceFuture from '@/components/studio/SourceFuture';
import Basket from '@/components/studio/Basket';
import Result from '@/components/studio/Result';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { checkExportQuota, type ExportQuota } from '@/lib/subscription';
import { toStored, trackExportWithTracks } from '@/lib/playlists';
import {
  ItemReport, Profile, StudioItem, Track,
  accessFor, buildPlaylist, downloadFile, loadProfile, toCsv, toText,
} from '@/lib/engine';

const EMPTY_PROFILE: Profile = { username: '', pastItems: [], futureItems: [], loading: false, loaded: false, partial: false };

function defaultName(items: StudioItem[]) {
  if (items.length === 1) return items[0].origin === 'past' ? `${items[0].artist} Live` : `${items[0].artist} — Setlive`;
  return items.every((i) => i.origin === 'past') ? 'Mes concerts' : 'Ma playlist Setlive';
}

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'future' ? 'future' : 'past';

  const [items, setItems] = useState<StudioItem[]>([]);
  const [name, setName] = useState('');
  const [topCount, setTopCount] = useState(5);
  const [preferLive, setPreferLive] = useState(true); // activé par défaut : on cherche les versions live
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ tracks: Track[]; report: ItemReport[]; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [quota, setQuota] = useState<ExportQuota | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);

  useEffect(() => {
    if (!user) { setQuota(null); return; }
    checkExportQuota(user.id).then(setQuota).catch(() => setQuota(null));
  }, [user]);

  // ----- sélection -----
  const has = (uid: string) => items.some((i) => i.uid === uid);
  const add = (list: StudioItem[]) => {
    const seen = new Set(items.map((i) => i.uid));
    const fresh = list.filter((i) => (seen.has(i.uid) ? false : seen.add(i.uid)));
    if (!fresh.length) return;
    setItems((prev) => [...prev, ...fresh.filter((f) => !prev.some((p) => p.uid === f.uid))]);
    if (fresh.length > 1) toast.success(`${fresh.length} éléments ajoutés`);
  };
  const remove = (uid: string) => setItems((prev) => prev.filter((i) => i.uid !== uid));
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // ----- profil Setlist.fm -----
  const onLoadProfile = async (username: string) => {
    setProfile((p) => ({ ...p, username, loading: true }));
    try {
      const d = await loadProfile(username, user?.id);
      setProfile({ username, ...d, loading: false, loaded: true });
      toast.success(`${d.pastItems.length} concerts passés, ${d.futureItems.length} à venir`);
    } catch (e: any) {
      setProfile((p) => ({ ...p, loading: false }));
      toast.error(e.status === 404 ? 'Profil Setlist.fm introuvable' : 'Impossible de charger le profil, réessaie');
    }
  };

  // ----- génération -----
  const generate = async () => {
    if (!items.length) return toast.error('Ajoute au moins un concert ou un artiste');
    setBusy(true);
    setResult(null);
    try {
      const { tracks, report } = await buildPlaylist(items, { topCount }, setProgress);
      if (!tracks.length) throw new Error('Aucun morceau trouvé pour cette sélection.');
      const finalName = name.trim() || defaultName(items);
      setResult({ tracks, report, name: finalName });
      if (user) {
        saveToHistory({
          userId: user.id,
          playlistName: finalName,
          tracks,
          live: preferLive,
          sourceType: items.every((i) => i.origin === 'past') ? 'concert' : 'upcoming',
          platform: 'csv',
        });
      }
      toast.success(`${tracks.length} morceaux prêts !`);
      setTimeout(() => document.getElementById('resultat')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de génération');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  // ----- droits : anonyme / gratuit / Premium (règles dans engine.ts → accessFor) -----
  const access = accessFor(user, quota, result?.tracks.length ?? 0);
  const unlock = () => navigate(user ? '/subscription' : '/auth');

  // ----- export : « Copier » = connecté + quota (consomme 1 export) ; .txt/.csv = Premium -----
  const onExport = async (kind: 'copy' | 'txt' | 'csv') => {
    if (!result) return;
    const slug = result.name.replace(/[^a-z0-9]/gi, '_');

    if (kind === 'txt' || kind === 'csv') {
      if (!access.canFiles) {
        toast.error('Le téléchargement de fichiers est réservé aux membres Premium.', { action: { label: 'Voir Premium', onClick: () => navigate('/subscription') } });
        return;
      }
      return kind === 'txt'
        ? downloadFile(`${slug}.txt`, toText(result.tracks, preferLive), 'text/plain')
        : downloadFile(`${slug}.csv`, toCsv(result.tracks, preferLive), 'text/csv');
    }

    if (!user) { toast.error('Connecte-toi pour copier la liste'); navigate('/auth'); return; }
    if (!access.canCopy) {
      toast.error('Quota épuisé : 2 exports par an en version gratuite.', { duration: 5000, action: { label: 'Passer Premium', onClick: () => navigate('/subscription') } });
      return;
    }
    try {
      await navigator.clipboard.writeText(toText(result.tracks, preferLive));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // On garde la liste exportée : elle pourra être rouverte depuis « Back in Time »
      const ok = await trackExportWithTracks(user.id, result.name, toStored(result.tracks, preferLive) ?? []);
      if (ok && quota && !quota.isPremium) {
        const remaining = Math.max(0, quota.remaining - 1);
        setQuota({ ...quota, remaining, used: quota.used + 1, canExport: remaining > 0 });
        toast.success(`Liste copiée ! ${remaining} export(s) restant(s)`);
      } else toast.success('Liste copiée !');
    } catch { toast.error('Impossible de copier la liste'); }
  };

  const quotaText =
    access.tier === 'anon' ? 'Non connecté : seuls les 3 premiers titres sont visibles. Connecte-toi pour voir et copier la liste.'
    : access.tier === 'premium' ? 'Premium : copie illimitée, .txt et .csv inclus.'
    : access.canCopy ? `${quota?.remaining ?? 0}/2 exports restants (année glissante). Le téléchargement .txt/.csv est réservé à Premium.`
    : 'Quota épuisé (2 exports par an en gratuit) : passe Premium pour voir et exporter toute la liste.';

  return (
    <div className="sl-page">
      <Header />
      <Frame
        kicker="Concerts & festivals → playlists"
        title="Studio"
        hero={<p className="mt-4 max-w-xl text-sm text-[var(--sl-paper)]/70">Ton atelier à playlists : choisis des concerts, Setlive retrouve les titres joués, et tu les importes dans Spotify, Deezer ou Apple Music.</p>}
      >
        <Steps items={[
          { title: 'Choisis', text: 'Un concert passé : on récupère sa vraie setlist (setlist.fm). Un concert à venir ou un festival : on reconstitue la setlist la plus probable.' },
          { title: 'Ajuste', text: 'Réordonne, retire des artistes, donne un nom à ta playlist, puis lance la génération.' },
          { title: 'Importe', text: 'Copie la liste et colle-la dans TuneMyMusic : elle arrive dans ton appli de streaming.' },
        ]} />
        <div className="grid gap-8 pb-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:pb-0">
          <div>
            <FaceTitle face="Face A" title="Choisir" />
            <div className="sl-seg mb-5">
              <button className={tab === 'past' ? 'on' : ''} onClick={() => setParams({})}>Concerts passés</button>
              <button className={tab === 'future' ? 'on' : ''} onClick={() => setParams({ tab: 'future' })}>Concerts à venir</button>
            </div>
            <div className={tab === 'past' ? '' : 'hidden'}>
              <SourcePast onAdd={add} onRemove={remove} has={has} profile={profile} onLoadProfile={onLoadProfile} />
            </div>
            <div className={tab === 'future' ? '' : 'hidden'}>
              <SourceFuture onAdd={add} onRemove={remove} has={has} profile={profile} />
            </div>
          </div>

          <div className="self-start lg:sticky lg:top-20">
            <Basket
              items={items} name={name} setName={setName}
              topCount={topCount} setTopCount={setTopCount}
              preferLive={preferLive} setPreferLive={setPreferLive}
              onMove={move} onRemove={remove} onClear={() => setItems([])}
              onGenerate={generate} busy={busy} progress={progress}
            />
          </div>
        </div>

        {result && (
          <Result
            name={result.name} tracks={result.tracks} report={result.report}
            preferLive={preferLive} copied={copied} quotaText={quotaText}
            access={access} onUnlock={unlock}
            onRemoveTrack={(i) => setResult((r) => (r ? { ...r, tracks: r.tracks.filter((_, k) => k !== i) } : r))}
            onExport={onExport}
          />
        )}
      </Frame>

      {/* Barre mobile : toujours accès à la playlist */}
      <div className="sl-noprint fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-[var(--sl-ink)] px-4 py-3 text-[var(--sl-paper)] lg:hidden">
        <span className="sl-mono text-[11px] uppercase tracking-widest">{items.length} sélectionné(s)</span>
        <a href="#playlist" className="sl-btn sl-btn-gold sl-btn-sm">Voir ma playlist</a>
      </div>

      <Footer />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
