import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isMJ, HIDDEN_PERSONNAGE_IDS } from './AuthContext';
import './PersonnagesTable.css';

const SORT_FIELDS = {
  nom:        (a, b) => a.nom.localeCompare(b.nom, 'fr'),
  clan:       (a, b) => (a.clan_nom || '').localeCompare(b.clan_nom || '', 'fr'),
  generation: (a, b) => (a.generation || 99) - (b.generation || 99),
};

const SortIcon = ({ field, sortField, sortAsc }) => {
  if (sortField !== field) return <span className="pt-sort-icon neutral">⇅</span>;
  return <span className="pt-sort-icon active">{sortAsc ? '↑' : '↓'}</span>;
};

export default function PersonnagesTable({
  onSelectPersonnage,
  mode = 'mj',
  viewerClan = null,
  playerMode = false,
  joueur = null,
  selectedCampagne = null,
}) {
  const [personnages, setPersonnages] = useState([]);
  const [clans, setClans]             = useState([]);
  const [joueurs, setJoueurs]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterClan, setFilterClan]   = useState('');
  const [filterConnu, setFilterConnu] = useState('');
  const [sortField, setSortField]     = useState('clan');
  const [sortAsc, setSortAsc]         = useState(true);
  const [toggling, setToggling]       = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // personnage id with open dropdown
  const [savingFv, setSavingFv]         = useState(null); // personnage id being saved

  const mjMode       = isMJ(mode) && !playerMode;
  const isCampagneMode = playerMode && !!joueur;

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: clansData }, { data: persoData }, { data: joueursData }] = await Promise.all([
        supabase.from('clans').select('id, nom, couleur').order('nom'),
        supabase.from('personnages')
          .select('id, nom, clan_id, generation, roles, ghost, connu, image_url, field_visibility')
          .eq('ghost', false)
          .order('generation', { ascending: true }),
        supabase.from('joueurs').select('id, nom, campagne_id, campagnes(nom)').order('nom'),
      ]);

      const clansMap = Object.fromEntries((clansData || []).map(c => [c.id, c]));
      setClans(clansData || []);
      setJoueurs(joueursData || []);
      setPersonnages((persoData || []).map(p => ({
        ...p,
        clan_nom:   clansMap[p.clan_id]?.nom    || '',
        clan_color: clansMap[p.clan_id]?.couleur || '#888',
      })));
      setLoading(false);
    })();
  }, []);

  // ── Toggle connu (MJ only) ─────────────────────────────────────────────────
  const toggleConnu = useCallback(async (e, personnage) => {
    e.stopPropagation(); // don't open the detail
    if (!mjMode) return;
    const newVal = !personnage.connu;
    setToggling(personnage.id);
    const { error } = await supabase
      .from('personnages')
      .update({ connu: newVal })
      .eq('id', personnage.id);
    if (!error) {
      setPersonnages(prev =>
        prev.map(p => p.id === personnage.id ? { ...p, connu: newVal } : p)
      );
    }
    setToggling(null);
  }, [mjMode]);

  // ── Toggle joueur visibility in field_visibility ───────────────────────────
  const toggleJoueurVisibility = useCallback(async (e, personnage, joueurId) => {
    e.stopPropagation();
    const fv = { ...(personnage.field_visibility ?? {}) };
    if (joueurId in fv) {
      delete fv[joueurId];
    } else {
      fv[joueurId] = {};
    }
    setSavingFv(personnage.id);
    const { error } = await supabase
      .from('personnages')
      .update({ field_visibility: fv })
      .eq('id', personnage.id);
    if (!error) {
      setPersonnages(prev =>
        prev.map(p => p.id === personnage.id ? { ...p, field_visibility: fv } : p)
      );
    }
    setSavingFv(null);
  }, []);

  // Set all joueurs of current filter visible or hidden
  const setAllJoueurs = useCallback(async (e, personnage, visible) => {
    e.stopPropagation();
    const visibleJoueurs = selectedCampagne
      ? joueurs.filter(j => j.campagne_id === selectedCampagne)
      : joueurs;
    const fv = { ...(personnage.field_visibility ?? {}) };
    if (visible) {
      visibleJoueurs.forEach(j => { if (!(j.id in fv)) fv[j.id] = {}; });
    } else {
      visibleJoueurs.forEach(j => { delete fv[j.id]; });
    }
    setSavingFv(personnage.id);
    const { error } = await supabase
      .from('personnages')
      .update({ field_visibility: fv })
      .eq('id', personnage.id);
    if (!error) {
      setPersonnages(prev =>
        prev.map(p => p.id === personnage.id ? { ...p, field_visibility: fv } : p)
      );
    }
    setSavingFv(null);
  }, [joueurs, selectedCampagne]);

  // ── Filter & sort ──────────────────────────────────────────────────────────
  const filtered = personnages
    .filter(p => {
      // VETO ABSOLU — prioritaire sur toute autre règle (clan, connu, override)
      if (!mjMode && HIDDEN_PERSONNAGE_IDS.includes(p.id)) return false;

      // Campagne joueur: visible only if joueur.id is a key in field_visibility
      if (isCampagneMode) {
        const fv = p.field_visibility ?? {};
        if (!(joueur.id in fv)) return false;
      } else if (!mjMode) {
        // Clan player / guest
        if (viewerClan && p.clan_id === viewerClan) return true;
        if (!p.connu) return false;
      }

      const q = search.toLowerCase();
      if (q && !p.nom.toLowerCase().includes(q) &&
               !(p.clan_nom || '').toLowerCase().includes(q)) return false;

      if (filterClan && p.clan_id !== filterClan) return false;

      // MJ-only filters
      if (mjMode) {
        if (filterConnu === 'connu'   && !p.connu)  return false;
        if (filterConnu === 'inconnu' &&  p.connu)  return false;
      }

      return true;
    })
    .sort((a, b) => {
      const cmp = SORT_FIELDS[sortField]?.(a, b) ?? 0;
      return sortAsc ? cmp : -cmp;
    });

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(v => !v);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleReset = () => {
    setSearch('');
    setFilterClan('');
    setFilterConnu('');
    setSortField('clan');
    setSortAsc(true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handler = () => setOpenDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openDropdown]);

  const isDirty = search || filterClan || filterConnu || sortField !== 'clan' || !sortAsc;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="pt-loading">
      <div className="pt-spinner" />
      <p>Chargement des personnages...</p>
    </div>
  );

  return (
    <div className="pt-container">
      <div className="pt-header">
        <div className="pt-header-text">
          <h1>Personnages</h1>
          <p>{mjMode ? 'Tous les vampires de Paris' : 'Vampires connus'}</p>
        </div>
        <div className="pt-counter">
          {filtered.length} / {personnages.length} <span>Personnages</span>
        </div>
      </div>

      {/* Controls */}
      <div className="pt-controls">
        <div className="pt-search-wrap">
          <span className="pt-search-icon">🔍</span>
          <input
            className="pt-search"
            type="text"
            placeholder="Rechercher un nom, clan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="pt-clear-search" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <select
          className="pt-select"
          value={filterClan}
          onChange={e => setFilterClan(e.target.value)}
        >
          <option value="">Tous les clans</option>
          {clans.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>

        {/* MJ only: filter by connu status */}
        {mjMode && (
          <select
            className="pt-select"
            value={filterConnu}
            onChange={e => setFilterConnu(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="connu">✓ Connus des joueurs</option>
            <option value="inconnu">◌ Inconnus</option>
          </select>
        )}

        {isDirty && (
          <button className="pt-reset" onClick={handleReset}>↺ Réinitialiser</button>
        )}
      </div>

      {/* Table */}
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr>
              <th className="pt-th pt-th-icon" />
              <th className="pt-th pt-th-nom" onClick={() => handleSort('nom')}>
                Nom <SortIcon field="nom" sortField={sortField} sortAsc={sortAsc} />
              </th>
              <th className="pt-th pt-th-clan" onClick={() => handleSort('clan')}>
                Clan <SortIcon field="clan" sortField={sortField} sortAsc={sortAsc} />
              </th>
              <th className="pt-th pt-th-gen" onClick={() => handleSort('generation')}>
                Gén. <SortIcon field="generation" sortField={sortField} sortAsc={sortAsc} />
              </th>
              <th className="pt-th pt-th-roles">Rôles</th>
              {mjMode && (
                <th className="pt-th pt-th-connu" title="Visible par les joueurs">👁</th>
              )}
              {mjMode && (
                <th className="pt-th pt-th-joueurs">Joueurs</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={mjMode ? 7 : 5} className="pt-empty">
                  Aucun personnage ne correspond
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const fv = p.field_visibility ?? {};
                const visibleJoueurs = selectedCampagne
                  ? joueurs.filter(j => j.campagne_id === selectedCampagne)
                  : joueurs;
                const visibleCount = visibleJoueurs.filter(j => j.id in fv).length;
                const isDropOpen = openDropdown === p.id;

                return (
                <tr
                  key={p.id}
                  className={`pt-row ${p.connu ? 'pt-row--connu' : ''}`}
                  onClick={() => onSelectPersonnage(p.id)}
                >
                  {/* Portrait thumbnail */}
                  <td className="pt-td pt-td-icon">
                    <div className="pt-avatar" style={{ borderColor: p.clan_color }}>
                      {p.image_url
                        ? <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/personnages/${p.image_url}`} alt={p.nom} />
                        : <span className="pt-avatar-placeholder">🧛</span>
                      }
                    </div>
                  </td>

                  {/* Nom */}
                  <td className="pt-td pt-td-nom">
                    <span className="pt-nom" style={{ color: p.clan_color }}>{p.nom}</span>
                  </td>

                  {/* Clan */}
                  <td className="pt-td pt-td-clan">
                    <span className="pt-clan-badge" style={{ background: `${p.clan_color}22`, borderColor: `${p.clan_color}66`, color: p.clan_color }}>
                      {p.clan_nom}
                    </span>
                  </td>

                  {/* Génération */}
                  <td className="pt-td pt-td-gen">
                    <span className="pt-gen">{p.generation}ème</span>
                  </td>

                  {/* Rôles */}
                  <td className="pt-td pt-td-roles">
                    <div className="pt-roles">
                      {(() => {
                        const allRoles = p.roles || [];
                        const fv = p.field_visibility ?? {};

                        // MJ : détermine si un rôle à l'index i est visible par au moins un joueur
                        // Règle : toggle joueur 'roles' = accès au champ entier
                        //         roles_items flat MJ = quels items sont visibles dans ce champ
                        const ROLES_DEFAULT = true; // FIELD_DEFAULTS.roles = true
                        const flatRolesItems = fv['roles_items'] ?? {}; // toggles MJ globaux
                        const isRoleVisibleByAnyJoueur = (i) => {
                          if (!mjMode) return false;
                          // L'item est-il visible globalement (toggle MJ flat) ?
                          const itemVisibleGlobally = String(i) in flatRolesItems
                            ? flatRolesItems[String(i)] !== false
                            : ROLES_DEFAULT;
                          if (!itemVisibleGlobally) return false;
                          // Au moins un joueur a-t-il accès au champ roles ?
                          return joueurs.some(j => {
                            if (!(j.id in fv)) return false; // joueur sans accès au personnage
                            const scopedFv = fv[j.id] ?? {};
                            return 'roles' in scopedFv
                              ? scopedFv['roles'] !== false
                              : ROLES_DEFAULT;
                          });
                        };

                        // Campagne joueur : filtrer par roles_items MJ flat (le toggle joueur controle l'acces au champ, pas les items)
                        const visibleRoles = isCampagneMode
                          ? allRoles.filter((_, i) => {
                              return String(i) in flatRolesItems
                                ? flatRolesItems[String(i)] !== false
                                : ROLES_DEFAULT;
                            })
                          : allRoles;

                        const displayRoles = visibleRoles.slice(0, 2);
                        const extra = visibleRoles.length - 2;

                        return (
                          <>
                            {displayRoles.map((r, displayIdx) => {
                              // Retrouver l'index original dans allRoles
                              const origIdx = isCampagneMode
                                ? allRoles.indexOf(r)
                                : displayIdx;
                              const joueurVisible = isRoleVisibleByAnyJoueur(origIdx);
                              return (
                                <span
                                  key={displayIdx}
                                  className={`pt-role-badge ${mjMode && joueurVisible ? 'pt-role-badge--visible' : ''}`}
                                >
                                  {r}
                                </span>
                              );
                            })}
                            {extra > 0 && (
                              <span className="pt-role-more">+{extra}</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>

                  {/* MJ toggle connu */}
                  {mjMode && (
                    <td className="pt-td pt-td-connu" onClick={e => toggleConnu(e, p)}>
                      <button
                        className={`pt-connu-toggle ${p.connu ? 'pt-connu-toggle--on' : ''}`}
                        disabled={toggling === p.id}
                        title={p.connu ? 'Masquer aux joueurs' : 'Révéler aux joueurs'}
                      >
                        {toggling === p.id ? '…' : p.connu ? '👁' : '◌'}
                      </button>
                    </td>
                  )}

                  {/* MJ joueurs dropdown */}
                  {mjMode && (
                    <td className="pt-td pt-td-joueurs" onClick={e => e.stopPropagation()}>
                      <div className="pt-joueurs-cell">
                        <button
                          className={`pt-joueurs-btn ${isDropOpen ? 'open' : ''}`}
                          onClick={e => { e.stopPropagation(); setOpenDropdown(isDropOpen ? null : p.id); }}
                          disabled={savingFv === p.id}
                        >
                          {savingFv === p.id ? '…' : `${visibleCount} / ${visibleJoueurs.length}`}
                          <span className="pt-joueurs-arrow">{isDropOpen ? '▲' : '▼'}</span>
                        </button>

                        {isDropOpen && (
                          <div className="pt-joueurs-dropdown" onClick={e => e.stopPropagation()}>
                            {visibleJoueurs.map(j => {
                              const on = j.id in fv;
                              return (
                                <div key={j.id} className="pt-joueurs-row">
                                  <span className="pt-joueurs-name">{j.nom}</span>
                                  <div
                                    className={`pt-joueurs-toggle ${on ? 'on' : ''}`}
                                    onClick={e => toggleJoueurVisibility(e, p, j.id)}
                                  />
                                </div>
                              );
                            })}
                            <div className="pt-joueurs-divider" />
                            <div className="pt-joueurs-actions">
                              <button className="pt-joueurs-action" onClick={e => setAllJoueurs(e, p, true)}>✓ Tous</button>
                              <button className="pt-joueurs-action" onClick={e => setAllJoueurs(e, p, false)}>✕ Aucun</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
