// src/pages/Index.tsx — le Studio : choisir → ajuster → exporter, sur une seule page
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FaceTitle, Frame } from '@/components/vinyl/Ui';
import SourcePast from '@/components/studio/SourcePast';
import SourceFuture from '@/components/studio/SourceFuture';
import Basket from '@/components/studio/Basket';
import Result from '@/components/studio/Result';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { checkExportQuota, trackExport, type ExportQuota } from '@/lib/subscription';
import {
  ItemReport, Profile, StudioItem, Track,
  artistItem, buildPlaylist, downloadFile, loadProfile, toCsv, toText,
} from '@/lib/engine';

const EMPTY_PROFILE: Profile = { username: '', pastItems: [], futureItems: [], loading: false, loaded: false, partial: false };

function defaultName(items: StudioItem[]) {
  if (items.length === 1) return items[0].origin === 'past' ? `${items[0].artist} Live` : `${items[0].artist} — Setlive`;
  return items.every((i) => i.origin === 'past') ? 'Mes concerts' : 'Ma playlist Setlive';
}

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'future' ? 'future' : 'past';

  const [items, setItems] = useState<StudioItem[]>([]);
  const [name, setName] = useState('');
  const [topCount, setTopCount] = useState(5);
  const [preferLive, setPreferLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ tracks: Track[]; report: ItemReport[]; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [quota, setQuota] = useState<ExportQuota | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);

  // Arrivée depuis une page festival : { artists, eventName }
  const imported = useRef(false);
  useEffect(() => {
    const st: any = location.state;
    if (imported.current || !st?.artists?.length) return;
    imported.current = true;
    setItems(st.artists.map((a: string) => artistItem(a, undefined, undefined, 'festival')));
    if (st.eventName) setName(st.eventName);
    toast.success(`${st.artists.length} artiste(s) ajoutés depuis ${st.eventName || 'le festival'}`);
    navigate('.', { replace: true, state: null });
  }, [location.state, navigate]);

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
          tracks: tracks.map((t) => ({ artist: t.artist })),
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

  // ----- export (même règles qu'avant : copie = compte + quota, fichiers libres) -----
  const onExport = async (kind: 'copy' | 'txt' | 'csv') => {
    if (!result) return;
    const slug = result.name.replace(/[^a-z0-9]/gi, '_');
    if (kind === 'txt') return downloadFile(`${slug}.txt`, toText(result.tracks, preferLive), 'text/plain');
    if (kind === 'csv') return downloadFile(`${slug}.csv`, toCsv(result.tracks, preferLive), 'text/csv');

    if (!user) { toast.error('Connecte-toi pour copier la liste'); navigate('/auth'); return; }
    if (quota && !quota.canExport) {
      toast.error('Quota épuisé : 2 exports par an en version gratuite.', { action: { label: 'Premium', onClick: () => navigate('/subscription') } });
      return;
    }
    try {
      await navigator.clipboard.writeText(toText(result.tracks, preferLive));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      const ok = await trackExport(user.id, result.name, result.tracks.length);
      if (ok && quota && !quota.isPremium) setQuota({ ...quota, remaining: Math.max(0, quota.remaining - 1), used: quota.used + 1, canExport: quota.remaining - 1 > 0 });
      toast.success('Liste copiée !');
    } catch { toast.error('Impossible de copier la liste'); }
  };

  const quotaText = !user
    ? 'Connecte-toi pour copier la liste. Les fichiers .txt et .csv sont libres.'
    : quota?.isPremium ? 'Exports illimités (Premium).'
    : quota ? `${quota.remaining} export(s) restant(s) sur ta période gratuite.` : '';

  return (
    <div className="sl-page">
      <Header />
      <Frame
        kicker="Concerts & festivals → playlists"
        title="Setlive Studio"
        hero={<p className="mt-4 max-w-xl text-sm text-[var(--sl-paper)]/70">Choisis des concerts passés ou à venir, ajuste l’ordre, exporte vers Spotify, Deezer, Apple Music…</p>}
      >
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
