// src/pages/History.tsx — « Back in Time » : playlists générées + exports, avec réouverture de la liste
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Empty, FaceTitle, Frame, Spinner } from '@/components/vinyl/Ui';
import { useAuth } from '@/AuthContext';
import { supabase } from '@/supabaseClient';
import { checkExportQuota } from '@/lib/subscription';
import { readStored, type StoredTrack } from '@/lib/playlists';
import PlaylistDetail from '@/components/PlaylistDetail';

interface PlaylistRow { id: string; playlist_name: string; track_count: number; top_artists: string[]; source_type: 'concert' | 'upcoming'; created_at: string; tracks?: unknown }
interface ExportRow { id: string; playlist_name: string; track_count: number; created_at: string; tracks?: unknown }

const when = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [exportsList, setExportsList] = useState<ExportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [quota, setQuota] = useState({ remaining: 0, used: 0 });
  const [tab, setTab] = useState<'playlists' | 'exports'>('playlists');
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // La session peut encore être en cours de chargement (ouverture directe, rafraîchissement) :
      // on laisse un court délai avant de renvoyer vers la connexion.
      const t = setTimeout(() => navigate('/auth'), 2500);
      return () => clearTimeout(t);
    }
    (async () => {
      setLoading(true);
      try {
        const q = await checkExportQuota(user.id);
        setIsPremium(q.isPremium);
        setQuota({ remaining: q.remaining, used: q.used });
        const p = await supabase.from('playlists_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
        if (p.error) throw p.error;
        setPlaylists(p.data || []);
        const e = await supabase.from('playlist_exports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
        if (e.error) throw e.error;
        setExportsList(e.data || []);
      } catch (err) {
        console.error('Erreur chargement historique:', err);
        toast.error("Erreur lors du chargement de l'historique");
      } finally { setLoading(false); }
    })();
  }, [user, navigate]);

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette playlist de l'historique ?")) return;
    const { error } = await supabase.from('playlists_history').delete().eq('id', id);
    if (error) return toast.error('Erreur lors de la suppression');
    setPlaylists((p) => p.filter((x) => x.id !== id));
    toast.success('Playlist supprimée');
  };

  // Bouton « Ouvrir » (liste conservée) ou mention (export fait avant que la liste soit enregistrée)
  const OpenToggle = ({ k, tracks }: { k: string; tracks: StoredTrack[] | null }) =>
    tracks ? (
      <button className="sl-btn sl-btn-line sl-btn-sm shrink-0" onClick={() => setOpenKey(openKey === k ? null : k)} aria-expanded={openKey === k}>
        {openKey === k ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} {openKey === k ? 'Fermer' : 'Ouvrir'}
      </button>
    ) : (
      <span className="sl-mono hidden shrink-0 text-[10px] uppercase tracking-wide text-[var(--sl-muted)] sm:block" title="Cette playlist a été créée avant l’enregistrement des listes de titres">liste non conservée</span>
    );

  const Kpi = ({ label, value, hero }: { label: string; value: string | number; hero?: boolean }) => (
    <div className={hero ? 'rounded-lg border-l-4 border-[var(--sl-gold)] bg-[var(--sl-ink)] p-4 text-[var(--sl-paper)]' : 'sl-card border-l-4 !border-l-[var(--sl-groove)] p-4'}>
      <p className={hero ? 'sl-mono text-[10px] uppercase tracking-[0.2em] text-[var(--sl-gold-bright)]' : 'sl-label'}>{label}</p>
      <p className="sl-display mt-1 text-4xl">{value}</p>
    </div>
  );

  return (
    <div className="sl-page">
      <Header />
      <Frame
        kicker="Historique"
        title="Back in Time"
        hero={<p className="mt-4 max-w-xl text-sm text-[var(--sl-paper)]/70">Le journal de tes playlists : chaque playlist créée dans le Studio est gardée ici, avec la liste de tes exports. Ouvre-en une pour la recopier ou l’envoyer vers TuneMyMusic (historique complet avec Premium).</p>}
      >
        {loading ? <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div> : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Kpi hero label="Playlists générées" value={playlists.length} />
              <Kpi label="Exports cette période" value={quota.used} />
              <Kpi label={isPremium ? 'Exports' : 'Exports restants'} value={isPremium ? '∞' : quota.remaining} />
            </div>

            {!isPremium && (
              <div className="sl-card-dim mt-6 flex flex-col gap-3 border-l-4 !border-l-[var(--sl-gold)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">Premium : exports illimités, fichiers .txt/.csv, historique et collection complets.</p>
                <Link to="/subscription" className="sl-btn sl-btn-gold">Voir les offres</Link>
              </div>
            )}

            <div className="mt-8">
              <FaceTitle face="Face A" title="Historique" right={
                <div className="sl-seg">
                  <button className={tab === 'playlists' ? 'on' : ''} onClick={() => setTab('playlists')}>Playlists ({playlists.length})</button>
                  <button className={tab === 'exports' ? 'on' : ''} onClick={() => setTab('exports')}>Exports ({exportsList.length})</button>
                </div>
              } />

              {tab === 'playlists' && (
                isPremium ? (
                  !playlists.length ? (
                    <div className="sl-card"><Empty title="Aucune playlist" text="Crée ta première playlist depuis le Studio." /></div>
                  ) : (
                    <div className="sl-card overflow-hidden">
                      {playlists.map((p) => {
                        const tracks = readStored(p.tracks);
                        const k = `p:${p.id}`;
                        return (
                          <div key={p.id} className="border-b border-[var(--sl-groove)] last:border-b-0">
                            <div className="sl-row !border-b-0">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{p.playlist_name}</p>
                                <p className="truncate text-xs text-[var(--sl-muted)]">
                                  {when(p.created_at)} · {p.track_count} titres{p.top_artists?.length ? ` · ${p.top_artists.slice(0, 3).join(', ')}` : ''}
                                </p>
                              </div>
                              <span className="sl-mono hidden text-[10px] uppercase tracking-wide sm:block" style={{ color: p.source_type === 'concert' ? 'var(--sl-forest)' : 'var(--sl-gold)' }}>
                                ● {p.source_type === 'concert' ? 'Concert passé' : 'À venir'}
                              </span>
                              <OpenToggle k={k} tracks={tracks} />
                              <button aria-label="Supprimer" className="p-1 text-[var(--sl-muted)] hover:text-[var(--sl-wine)]" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></button>
                            </div>
                            {tracks && openKey === k && <PlaylistDetail title={p.playlist_name} tracks={tracks} canFiles={isPremium} />}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="sl-card">
                    <Empty
                      title="Historique complet : Premium"
                      text={playlists.length ? `Tes ${playlists.length} playlist(s) sont bien sauvegardées et seront visibles dès le passage en Premium.` : 'Tes prochaines playlists seront sauvegardées automatiquement.'}
                    />
                    <div className="pb-6 text-center"><Link to="/subscription" className="sl-btn sl-btn-ink">Passer Premium</Link></div>
                  </div>
                )
              )}

              {tab === 'exports' && (
                !exportsList.length ? (
                  <div className="sl-card"><Empty title="Aucun export" text="Tes copies de listes apparaîtront ici." /></div>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-[var(--sl-muted)]">Ouvre un export pour retrouver sa liste et l’envoyer vers TuneMyMusic : recopier un export déjà fait ne consomme pas d’export.</p>
                    <div className="sl-card overflow-hidden">
                      {exportsList.map((e) => {
                        const tracks = readStored(e.tracks);
                        const k = `e:${e.id}`;
                        return (
                          <div key={e.id} className="border-b border-[var(--sl-groove)] last:border-b-0">
                            <div className="sl-row !border-b-0">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{e.playlist_name}</p>
                                <p className="text-xs text-[var(--sl-muted)]">{when(e.created_at)}</p>
                              </div>
                              <span className="sl-mono text-[10px] uppercase tracking-wide text-[var(--sl-muted)]">{e.track_count} titres</span>
                              <OpenToggle k={k} tracks={tracks} />
                            </div>
                            {tracks && openKey === k && <PlaylistDetail title={e.playlist_name} tracks={tracks} canFiles={isPremium} />}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )
              )}
            </div>
          </>
        )}
      </Frame>
      <Footer />
    </div>
  );
}
