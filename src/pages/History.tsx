// src/pages/History.tsx — « Back in Time » : playlists générées + exports + analyses de collection, avec réouverture de la liste
// Tout l'historique est accessible : 50 éléments à la fois (30 pour les collections) + « Afficher la suite ». Les titres ne sont chargés qu'à l'ouverture.
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
import type { ArchivedItem } from '@/lib/collectionArchive';
import { downloadCollectionPdf } from '@/lib/collectionPdf';
import PlaylistDetail from '@/components/PlaylistDetail';

interface PlaylistRow { id: string; playlist_name: string; track_count: number; top_artists: string[]; source_type: 'concert' | 'upcoming'; created_at: string; tracks?: unknown; first_track?: unknown }
interface ExportRow { id: string; playlist_name: string; track_count: number; created_at: string; tracks?: unknown; first_track?: unknown }
interface AnalysisRow { id: string; discogs_username: string | null; item_count: number; total_value: number; total_purchase: number; total_gain: number; roi: number | null; created_at: string; updated_at: string }

const when = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const eur = (n: number) => Number(n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const PAGE = 50;
const ANALYSES_PAGE = 30;
// La liste ne charge que les informations utiles ; les titres (volumineux) sont chargés à l'ouverture.
// « first_track » (premier titre) sert seulement à savoir si une liste a été conservée.
const COLS_PLAYLISTS = 'id,playlist_name,track_count,top_artists,source_type,created_at,first_track:tracks->0';
const COLS_EXPORTS = 'id,playlist_name,track_count,created_at,first_track:tracks->0';
const COLS_ANALYSES = 'id,discogs_username,item_count,total_value,total_purchase,total_gain,roi,created_at,updated_at';

async function fetchPage(table: string, cols: string, userId: string, from: number, size: number) {
  const run = (c: string) => supabase.from(table).select(c, { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).range(from, from + size - 1);
  let r: any = await run(cols);
  if (r.error && cols.includes('first_track')) r = await run('*'); // repli : si la colonne calculée n'est pas acceptée, on charge tout
  return r;
}
const hasList = (row: { first_track?: unknown; tracks?: unknown }) => !!row.first_track || !!readStored(row.tracks);

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [exportsList, setExportsList] = useState<ExportRow[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [analysisItems, setAnalysisItems] = useState<Record<string, ArchivedItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [quota, setQuota] = useState({ remaining: 0, used: 0 });
  const [tab, setTab] = useState<'playlists' | 'exports' | 'collections'>('playlists');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [totals, setTotals] = useState({ p: 0, e: 0, c: 0 });
  const [moreBusy, setMoreBusy] = useState<'p' | 'e' | 'c' | null>(null);
  const [tracksMap, setTracksMap] = useState<Record<string, StoredTrack[] | null>>({});

  // Si la base renvoie les listes avec les lignes (repli), on les garde : pas besoin de les recharger à l'ouverture
  const seedTracks = (prefix: 'p' | 'e', rows: { id: string; tracks?: unknown }[]) => {
    const seeded: Record<string, StoredTrack[] | null> = {};
    rows.forEach((r) => { if (Array.isArray(r.tracks)) seeded[`${prefix}:${r.id}`] = readStored(r.tracks); });
    if (Object.keys(seeded).length) setTracksMap((m) => ({ ...m, ...seeded }));
  };

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
        const p = await fetchPage('playlists_history', COLS_PLAYLISTS, user.id, 0, PAGE);
        if (p.error) throw p.error;
        const pRows = (p.data || []) as PlaylistRow[];
        setPlaylists(pRows);
        seedTracks('p', pRows);
        const e = await fetchPage('playlist_exports', COLS_EXPORTS, user.id, 0, PAGE);
        if (e.error) throw e.error;
        const eRows = (e.data || []) as ExportRow[];
        setExportsList(eRows);
        seedTracks('e', eRows);
        // Analyses de collection : la liste seulement (le détail est chargé à l'ouverture, il est volumineux)
        const c = await fetchPage('collection_analyses', COLS_ANALYSES, user.id, 0, ANALYSES_PAGE);
        if (c.error) console.warn('Archive de collection indisponible :', c.error.message);
        else setAnalyses((c.data as AnalysisRow[]) || []);
        setTotals({ p: p.count ?? pRows.length, e: e.count ?? eRows.length, c: c.error ? 0 : (c.count ?? (c.data || []).length) });
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
    setTotals((t) => ({ ...t, p: Math.max(0, t.p - 1) }));
    toast.success('Playlist supprimée');
  };

  const removeAnalysis = async (id: string) => {
    if (!confirm("Supprimer cette analyse de collection de l'historique ?")) return;
    const { error } = await supabase.from('collection_analyses').delete().eq('id', id);
    if (error) return toast.error('Erreur lors de la suppression');
    setAnalyses((a) => a.filter((x) => x.id !== id));
    setTotals((t) => ({ ...t, c: Math.max(0, t.c - 1) }));
    toast.success('Analyse supprimée');
  };

  const toggleAnalysis = async (id: string) => {
    const k = `c:${id}`;
    if (openKey === k) { setOpenKey(null); return; }
    setOpenKey(k);
    if (analysisItems[id]) return;
    const { data, error } = await supabase.from('collection_analyses').select('items').eq('id', id).single();
    if (error) { toast.error('Impossible de charger le détail de cette analyse'); return; }
    setAnalysisItems((m) => ({ ...m, [id]: ((data?.items as ArchivedItem[]) || []) }));
  };

  const downloadCsv = (a: AnalysisRow, items: ArchivedItem[]) => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Artiste', 'Titre', 'Format', 'État', 'Année pressage', 'Pays', 'Label', 'Prix achat (€)', 'Cote marché (€)', 'Confiance (%)'];
    const lines = items.map((i) => [i.artist, i.title, i.format, i.condition, i.pressingYear, i.country, i.label, i.achat, i.marche, i.confidence].map(esc).join(';'));
    const blob = new Blob(['\uFEFF' + [head.map(esc).join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collection-${a.created_at.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async (a: AnalysisRow, items: ArchivedItem[]) => {
    setPdfBusy(a.id);
    const tid = toast.loading('Génération du PDF… (récupération des pochettes, cela peut prendre une minute)');
    try {
      await downloadCollectionPdf(a, items);
      toast.success('PDF généré', { id: tid });
    } catch (err) {
      console.error('Erreur génération PDF :', err);
      toast.error('Impossible de générer le PDF', { id: tid });
    } finally {
      setPdfBusy(null);
    }
  };

  // Ouvre une playlist ou un export : ses titres sont chargés à la demande (ils sont volumineux)
  const openList = async (k: string, table: 'playlists_history' | 'playlist_exports', id: string) => {
    if (openKey === k) { setOpenKey(null); return; }
    setOpenKey(k);
    if (k in tracksMap) return;
    const { data, error } = await supabase.from(table).select('tracks').eq('id', id).single();
    if (error) { toast.error('Impossible de charger cette liste'); setOpenKey(null); return; }
    setTracksMap((m) => ({ ...m, [k]: readStored((data as any)?.tracks) }));
  };

  // « Afficher la suite » : 50 de plus (30 pour les analyses de collection)
  const loadMore = async (kind: 'p' | 'e' | 'c') => {
    if (!user || moreBusy) return;
    setMoreBusy(kind);
    try {
      if (kind === 'c') {
        const r = await fetchPage('collection_analyses', COLS_ANALYSES, user.id, analyses.length, ANALYSES_PAGE);
        if (r.error) throw r.error;
        setAnalyses((prev) => [...prev, ...((r.data as AnalysisRow[]) || []).filter((x) => !prev.some((y) => y.id === x.id))]);
      } else if (kind === 'p') {
        const r = await fetchPage('playlists_history', COLS_PLAYLISTS, user.id, playlists.length, PAGE);
        if (r.error) throw r.error;
        const rows = (r.data || []) as PlaylistRow[];
        setPlaylists((prev) => [...prev, ...rows.filter((x) => !prev.some((y) => y.id === x.id))]);
        seedTracks('p', rows);
      } else {
        const r = await fetchPage('playlist_exports', COLS_EXPORTS, user.id, exportsList.length, PAGE);
        if (r.error) throw r.error;
        const rows = (r.data || []) as ExportRow[];
        setExportsList((prev) => [...prev, ...rows.filter((x) => !prev.some((y) => y.id === x.id))]);
        seedTracks('e', rows);
      }
    } catch (err) {
      console.error('Erreur chargement de la suite :', err);
      toast.error('Impossible de charger la suite');
    } finally { setMoreBusy(null); }
  };

  // Bouton « Ouvrir » (liste conservée) ou mention (export fait avant que la liste soit enregistrée)
  const OpenToggle = ({ k, has, onOpen }: { k: string; has: boolean; onOpen: () => void }) =>
    has ? (
      <button className="sl-btn sl-btn-line sl-btn-sm shrink-0" onClick={onOpen} aria-expanded={openKey === k}>
        {openKey === k ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} {openKey === k ? 'Fermer' : 'Ouvrir'}
      </button>
    ) : (
      <span className="sl-mono hidden shrink-0 text-[10px] uppercase tracking-wide text-[var(--sl-muted)] sm:block" title="Cette playlist a été créée avant l’enregistrement des listes de titres">liste non conservée</span>
    );

  // Détail d'une playlist ouverte (appelée comme une fonction, pas comme un composant : l'état « Copié ! » n'est pas réinitialisé)
  const renderDetail = (k: string, title: string) => {
    if (openKey !== k) return null;
    const t = tracksMap[k];
    if (t) return <PlaylistDetail title={title} tracks={t} canFiles={isPremium} />;
    if (k in tracksMap) return null;
    return <div className="flex justify-center border-t border-[var(--sl-groove)] bg-[var(--sl-paper-dim)] py-6"><Spinner className="h-5 w-5" /></div>;
  };

  const MoreButton = ({ kind, shown, total }: { kind: 'p' | 'e' | 'c'; shown: number; total: number }) =>
    shown < total ? (
      <div className="border-t border-[var(--sl-groove)] p-3 text-center">
        <button className="sl-btn sl-btn-line" onClick={() => loadMore(kind)} disabled={moreBusy !== null}>
          {moreBusy === kind ? <Spinner /> : null} Afficher la suite ({total - shown} restante{total - shown > 1 ? 's' : ''})
        </button>
      </div>
    ) : null;

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
        hero={<p className="mt-4 max-w-xl text-sm text-[var(--sl-paper)]/70">Le journal de tes playlists : chaque playlist créée dans le Studio est gardée ici, avec la liste de tes exports et l’archive de tes analyses de collection. Ouvre-en une pour la recopier ou l’envoyer vers TuneMyMusic (historique complet avec Premium).</p>}
      >
        {loading ? <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div> : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Kpi hero label="Playlists générées" value={totals.p} />
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
                  <button className={tab === 'playlists' ? 'on' : ''} onClick={() => setTab('playlists')}>Playlists ({totals.p})</button>
                  <button className={tab === 'exports' ? 'on' : ''} onClick={() => setTab('exports')}>Exports ({totals.e})</button>
                  <button className={tab === 'collections' ? 'on' : ''} onClick={() => setTab('collections')}>Collection ({totals.c})</button>
                </div>
              } />

              {tab === 'playlists' && (
                isPremium ? (
                  !playlists.length ? (
                    <div className="sl-card"><Empty title="Aucune playlist" text="Crée ta première playlist depuis le Studio." /></div>
                  ) : (
                    <div className="sl-card overflow-hidden">
                      {playlists.map((p) => {
                        const has = hasList(p);
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
                              <OpenToggle k={k} has={has} onOpen={() => openList(k, 'playlists_history', p.id)} />
                              <button aria-label="Supprimer" className="p-1 text-[var(--sl-muted)] hover:text-[var(--sl-wine)]" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></button>
                            </div>
                            {has && renderDetail(k, p.playlist_name)}
                          </div>
                        );
                      })}
                      <MoreButton kind="p" shown={playlists.length} total={totals.p} />
                    </div>
                  )
                ) : (
                  <div className="sl-card">
                    <Empty
                      title="Historique complet : Premium"
                      text={totals.p ? `Tes ${totals.p} playlist(s) sont bien sauvegardées et seront visibles dès le passage en Premium.` : 'Tes prochaines playlists seront sauvegardées automatiquement.'}
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
                        const has = hasList(e);
                        const k = `e:${e.id}`;
                        return (
                          <div key={e.id} className="border-b border-[var(--sl-groove)] last:border-b-0">
                            <div className="sl-row !border-b-0">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{e.playlist_name}</p>
                                <p className="text-xs text-[var(--sl-muted)]">{when(e.created_at)}</p>
                              </div>
                              <span className="sl-mono text-[10px] uppercase tracking-wide text-[var(--sl-muted)]">{e.track_count} titres</span>
                              <OpenToggle k={k} has={has} onOpen={() => openList(k, 'playlist_exports', e.id)} />
                            </div>
                            {has && renderDetail(k, e.playlist_name)}
                          </div>
                        );
                      })}
                      <MoreButton kind="e" shown={exportsList.length} total={totals.e} />
                    </div>
                  </>
                )
              )}

              {tab === 'collections' && (
                isPremium ? (
                  !analyses.length ? (
                    <div className="sl-card"><Empty title="Aucune analyse de collection" text="Lance une estimation dans l’onglet Collection : elle sera archivée ici automatiquement." /></div>
                  ) : (
                    <>
                      <p className="mb-3 text-xs text-[var(--sl-muted)]">Chaque scan de ta collection est conservé. L’écart est calculé par rapport à l’analyse précédente.</p>
                      <div className="sl-card overflow-hidden">
                        {analyses.map((a, i) => {
                          const prev = analyses[i + 1];
                          const delta = prev ? Number(a.total_value) - Number(prev.total_value) : null;
                          const k = `c:${a.id}`;
                          const items = analysisItems[a.id];
                          const top = items ? [...items].sort((x, y) => Number(y.marche) - Number(x.marche)).slice(0, 10) : [];
                          return (
                            <div key={a.id} className="border-b border-[var(--sl-groove)] last:border-b-0">
                              <div className="sl-row !border-b-0">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">{eur(a.total_value)} · {a.item_count} disques</p>
                                  <p className="truncate text-xs text-[var(--sl-muted)]">{when(a.created_at)}{a.discogs_username ? ` · compte ${a.discogs_username}` : ''}</p>
                                </div>
                                {delta !== null && (
                                  <span className="sl-mono hidden text-[10px] uppercase tracking-wide sm:block" style={{ color: delta >= 0 ? 'var(--sl-forest)' : 'var(--sl-wine)' }}>
                                    {delta >= 0 ? '+' : ''}{eur(delta)} vs précédente
                                  </span>
                                )}
                                <button className="sl-btn sl-btn-line sl-btn-sm shrink-0" onClick={() => toggleAnalysis(a.id)} aria-expanded={openKey === k}>
                                  {openKey === k ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} {openKey === k ? 'Fermer' : 'Ouvrir'}
                                </button>
                                <button aria-label="Supprimer" className="p-1 text-[var(--sl-muted)] hover:text-[var(--sl-wine)]" onClick={() => removeAnalysis(a.id)}><Trash2 className="h-4 w-4" /></button>
                              </div>

                              {openKey === k && (
                                <div className="border-t border-[var(--sl-groove)] bg-[var(--sl-paper-dim)] p-4">
                                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div><p className="sl-label">Valeur marché</p><p className="sl-display text-2xl">{eur(a.total_value)}</p></div>
                                    <div><p className="sl-label">Achats renseignés</p><p className="sl-display text-2xl">{eur(a.total_purchase)}</p></div>
                                    <div><p className="sl-label">Gain</p><p className="sl-display text-2xl">{eur(a.total_gain)}</p></div>
                                    <div><p className="sl-label">ROI</p><p className="sl-display text-2xl">{a.roi == null ? '—' : `${Math.round(Number(a.roi))} %`}</p></div>
                                  </div>

                                  {!items ? (
                                    <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
                                  ) : (
                                    <>
                                      <p className="sl-label mt-5">Les 10 disques les plus cotés</p>
                                      <div className="mt-2 overflow-x-auto rounded border border-[var(--sl-groove)] bg-[var(--sl-paper)]">
                                        <table className="w-full text-left text-xs">
                                          <tbody>
                                            {top.map((it, n) => (
                                              <tr key={`${it.id}-${n}`} className="border-b border-[var(--sl-groove)] last:border-b-0">
                                                <td className="p-2"><span className="font-semibold">{it.artist}</span> — {it.title}</td>
                                                <td className="p-2 text-[var(--sl-muted)]">{it.condition}</td>
                                                <td className="p-2 text-right font-semibold">{Number(it.marche) > 0 ? `${Number(it.marche).toFixed(2)} €` : 'N/C'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        <button className="sl-btn sl-btn-line sl-btn-sm" onClick={() => downloadPdf(a, items)} disabled={pdfBusy === a.id}>
                                          {pdfBusy === a.id ? 'Génération du PDF…' : 'Télécharger le rapport (PDF)'}
                                        </button>
                                        <button className="sl-btn sl-btn-line sl-btn-sm" onClick={() => downloadCsv(a, items)}>Télécharger la liste complète (CSV)</button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <MoreButton kind="c" shown={analyses.length} total={totals.c} />
                      </div>
                    </>
                  )
                ) : (
                  <div className="sl-card">
                    <Empty
                      title="Archive de collection : Premium"
                      text={totals.c ? `Tes ${totals.c} analyse(s) sont bien sauvegardées et seront visibles dès le passage en Premium.` : 'Tes prochaines analyses de collection seront sauvegardées automatiquement.'}
                    />
                    <div className="pb-6 text-center"><Link to="/subscription" className="sl-btn sl-btn-ink">Passer Premium</Link></div>
                  </div>
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
