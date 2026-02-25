import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './ClansTable.css';

/* ── helpers ─────────────────────────────────────────── */
const STORAGE = 'https://jjmiaoodkuwmbrplskif.supabase.co/storage/v1/object/public';
const CLANS_AVEC_ARBRE = ['toreador', 'ventrue', 'brujah', 'nosferatu', 'malkavian'];

function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

function ClanLogo({ url, nom, couleur, size = 48 }) {
  if (!url) {
    return (
      <div
        className="ct-logo-placeholder"
        style={{ width: size, height: size, borderColor: couleur }}
      >
        {nom?.[0]}
      </div>
    );
  }
  return (
    <div
      className="ct-logo-wrap"
      style={{ width: size, height: size, '--clan-color': couleur }}
    >
      <img src={url} alt={nom} width={size} height={size} />
    </div>
  );
}

function PopBar({ value, max, couleur }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="ct-popbar">
      <div
        className="ct-popbar-fill"
        style={{ width: `${pct}%`, background: couleur }}
      />
      <span className="ct-popbar-label">{value}</span>
    </div>
  );
}

/* ── Relation chip ───────────────────────────────────── */
function RelChip({ rel, clans, onClick }) {
  const clan = clans.find(c => c.id === rel.id);
  return (
    <button
      className="cd-rel-chip"
      style={{ '--chip-color': clan?.couleur ?? '#888' }}
      onClick={() => onClick(rel.id)}
      title={rel.text}
    >
      {clan && clan.icon_url && (
        <span className="cd-rel-chip-icon">
          <img src={clan.icon_url} alt={clan.nom} />
        </span>
      )}
      <span className="cd-rel-chip-name">{clan?.nom ?? rel.id}</span>
      <span className="cd-rel-chip-text">{rel.text}</span>
    </button>
  );
}

/* ── Members list ────────────────────────────────────── */
function MembresList({ clanId, couleur, onNavigateToPersonnage, excludeHorsStructure = false }) {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase
      .from('personnages')
      .select('id, nom, generation, roles')
      .eq('clan_id', clanId)
      .eq('ghost', false)
      .order('generation', { ascending: true });

    if (excludeHorsStructure) {
      query = query.not('hors_structure', 'eq', true);
    }

    query.then(({ data }) => {
      setMembres(data ?? []);
      setLoading(false);
    });
  }, [clanId, excludeHorsStructure]);

  if (loading) return <p className="cd-membres-loading">Chargement…</p>;
  if (membres.length === 0) return <p className="cd-membres-empty">Aucun membre répertorié.</p>;

  return (
    <ul className="cd-membres-list">
      {membres.map(p => {
        const roles = safeArray(p.roles);
        const roleLabel = roles.length > 0 ? roles[0] : null;
        return (
          <li key={p.id} className="cd-membre-item">
            <button
              className="cd-membre-btn"
              style={{ '--clan-color': couleur }}
              onClick={() => onNavigateToPersonnage(p.id)}
            >
              <span className="cd-membre-gen">GÉN. {p.generation ?? '?'}</span>
              <span className="cd-membre-nom">{p.nom}</span>
              {roleLabel && <span className="cd-membre-role">{roleLabel}</span>}
              <span className="cd-membre-arrow">→</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Hors-structure list (grand clan, présence isolée) ── */
function HorsStructureList({ clanId, couleur, onNavigateToPersonnage }) {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('personnages')
      .select('id, nom, generation, roles')
      .eq('clan_id', clanId)
      .eq('ghost', false)
      .eq('hors_structure', true)
      .order('generation', { ascending: true })
      .then(({ data }) => {
        setMembres(data ?? []);
        setLoading(false);
      });
  }, [clanId]);

  if (loading || membres.length === 0) return null;

  return (
    <div className="cd-hors-structure">
      <h2 className="cd-section-title" style={{ marginTop: '2rem' }}>Présences isolées</h2>
      <ul className="cd-membres-list">
        {membres.map(p => {
          const roles = safeArray(p.roles);
          const roleLabel = roles.length > 0 ? roles[0] : null;
          return (
            <li key={p.id} className="cd-membre-item">
              <button
                className="cd-membre-btn"
                style={{ '--clan-color': couleur }}
                onClick={() => onNavigateToPersonnage(p.id)}
              >
                <span className="cd-membre-gen">GÉN. {p.generation ?? '?'}</span>
                <span className="cd-membre-nom">{p.nom}</span>
                {roleLabel && <span className="cd-membre-role">{roleLabel}</span>}
                <span className="cd-membre-arrow">→</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Detail view ─────────────────────────────────────── */
function ClanDetail({ clan, clans, onBack, onSelectClan, onNavigateToGenealogie, onNavigateToPersonnage, currentIndex, total, onGoTo, playerMode = false }) {
  const buts = safeArray(clan.buts);
  const relations = safeArray(clan.relation);
  const isMineur = clan.clan_mineur === true;

  return (
    <div className="cd-root">
      <button className="cd-back" onClick={onBack}>
        ← Retour aux clans
      </button>

      {/* Navigation arrows — clans mineurs exclus du roster */}
      {!isMineur && total > 1 && (
        <div className="pd-clan-nav">
          <button
            className="pd-clan-nav-arrow"
            onClick={() => onGoTo((currentIndex - 1 + total) % total)}
            title="Clan précédent"
            style={{ '--clan-color': clan.couleur ?? '#888' }}
          >
            ←
          </button>
          <span className="pd-clan-nav-info" style={{ color: clan.couleur ?? '#888' }}>
            Clan · {currentIndex + 1} / {total}
          </span>
          <button
            className="pd-clan-nav-arrow"
            onClick={() => onGoTo((currentIndex + 1) % total)}
            title="Clan suivant"
            style={{ '--clan-color': clan.couleur ?? '#888' }}
          >
            →
          </button>
        </div>
      )}

      <div className="cd-hero" style={{ '--clan-color': clan.couleur }}>
        <div className="cd-hero-logo">
          <ClanLogo url={clan.icon_url} nom={clan.nom} couleur={clan.couleur} size={120} />
        </div>
        <div className="cd-hero-info">
          <p className="cd-hero-eyebrow">{isMineur ? 'Présence isolée' : 'Clan'}</p>
          <h1 className="cd-hero-name">{clan.nom}</h1>
          {!isMineur && (
            <div className="cd-hero-pop">
              <span className="cd-hero-pop-label">Population</span>
              <span className="cd-hero-pop-val" style={{ color: clan.couleur }}>
                {clan.population}
              </span>
            </div>
          )}
        </div>
        <div className="cd-hero-bar" style={{ background: clan.couleur }} />
      </div>

      {/* Clans mineurs sans description : texte générique */}
      {isMineur && !clan.description && (
        <section className="cd-section">
          <p className="cd-desc cd-desc-mineur">
            Ce vampire évolue en marge des structures claniques officielles de Paris.
            Ses allégeances et ses desseins lui appartiennent.
          </p>
        </section>
      )}

      {clan.description && (
        <section className="cd-section">
          <h2 className="cd-section-title">Description</h2>
          <p className="cd-desc">{clan.description}</p>
        </section>
      )}

      {buts.length > 0 && (
        <section className="cd-section">
          <h2 className="cd-section-title">Objectifs</h2>
          <ul className="cd-buts">
            {buts.map((b, i) => (
              <li key={i} className="cd-but-item">
                <span className="cd-but-bullet" style={{ color: clan.couleur }}>◆</span>
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Membres */}
      {(!isMineur && CLANS_AVEC_ARBRE.includes(clan.id)) ? (
        <section className="cd-section">
          {!playerMode && (
            <button
              className="cd-genealogie-btn"
              onClick={() => onNavigateToGenealogie(clan.id, clan.nom)}
            >
              Arbre généalogique →
            </button>
          )}
          <HorsStructureList
            clanId={clan.id}
            couleur={clan.couleur}
            onNavigateToPersonnage={onNavigateToPersonnage}
          />
        </section>
      ) : (
        <section className="cd-section">
          <h2 className="cd-section-title">Membres</h2>
          <MembresList
            clanId={clan.id}
            couleur={clan.couleur}
            onNavigateToPersonnage={onNavigateToPersonnage}
            excludeHorsStructure={!isMineur}
          />
        </section>
      )}

      {relations.length > 0 && (
        <section className="cd-section">
          <h2 className="cd-section-title">Relations avec les autres clans</h2>
          <div className="cd-relations">
            {relations.map(rel => (
              <RelChip
                key={rel.id}
                rel={rel}
                clans={clans}
                onClick={onSelectClan}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Volet AUTRES — Vue MJ ───────────────────────────── */
function AutresMJ({ clansMineurs, allClans, onSelectClan, onNavigateToPersonnage }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ct-autres-root">
      <button
        className={`ct-autres-toggle ${open ? 'ct-autres-toggle--open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="ct-autres-toggle-label">Autres présences</span>
        <span className="ct-autres-toggle-icons">
          {clansMineurs.map(c => (
            <span key={c.id} className="ct-autres-icon-wrap" style={{ '--clan-color': c.couleur }}>
              <ClanLogo url={c.icon_url} nom={c.nom} couleur={c.couleur} size={28} />
            </span>
          ))}
        </span>
        <span className="ct-autres-toggle-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="ct-autres-body">
          <p className="ct-autres-intro">
            Quelques vampires étrangers aux clans établis à Paris ont élu domicile dans la ville,
            chacun poursuivant ses propres desseins en marge de la politique des grandes maisons.
          </p>
          <div className="ct-autres-clans">
            {clansMineurs.map(clan => (
              <button
                key={clan.id}
                className="ct-autres-clan-row"
                style={{ '--clan-color': clan.couleur }}
                onClick={() => onSelectClan(clan)}
              >
                <span className="ct-autres-clan-logo">
                  <ClanLogo url={clan.icon_url} nom={clan.nom} couleur={clan.couleur} size={36} />
                </span>
                <span className="ct-autres-clan-nom">{clan.nom}</span>
                <span className="ct-autres-clan-arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Volet AUTRES — Vue joueurs ──────────────────────── */
function AutresJoueurs() {
  const [open, setOpen] = useState(false);

  return (
    <div className="ct-autres-root">
      <button
        className={`ct-autres-toggle ${open ? 'ct-autres-toggle--open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="ct-autres-toggle-label">Autres présences</span>
        <span className="ct-autres-toggle-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="ct-autres-body">
          <p className="ct-autres-lore">
            Paris n'appartient pas qu'aux grandes maisons. Quelques vampires d'autres horizons
            ont élu domicile dans la ville, chacun poursuivant ses propres desseins.
            Leurs allégeances et leurs noms restent, pour l'heure, inconnus.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────── */
export default function ClansTable({ onNavigateToGenealogie, onNavigateToPersonnage, playerMode = false }) {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClan, setSelectedClan] = useState(null);
  const [sortKey, setSortKey] = useState('nom');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    supabase
      .from('clans')
      .select('*')
      .order('nom')
      .then(({ data }) => {
        setClans((data ?? []).filter(c => c.id !== 'mortel'));
        setLoading(false);
      });
  }, []);

  const clansNormaux = clans.filter(c => !c.clan_mineur);
  const clansMineurs = clans.filter(c => c.clan_mineur);

  const maxPop = Math.max(...clansNormaux.map(c => c.population ?? 0), 1);

  const sorted = [...clansNormaux].sort((a, b) => {
    let va = a[sortKey] ?? '';
    let vb = b[sortKey] ?? '';
    if (sortKey === 'population') { va = +va; vb = +vb; }
    else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); }
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="ct-sort-icon ct-sort-none">⇅</span>;
    return <span className="ct-sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return <div className="ct-loading">Chargement des clans…</div>;
  }

  // Roster de navigation (clans normaux uniquement)
  const clanRoster = [...clansNormaux].sort((a, b) =>
    String(a.nom).toLowerCase().localeCompare(String(b.nom).toLowerCase(), 'fr')
  );
  const currentIndex = clanRoster.findIndex(c => c.id === selectedClan?.id);
  const handleGoTo = (index) => {
    const next = clanRoster[index];
    if (next) setSelectedClan(next);
  };

  if (selectedClan) {
    const isMineur = selectedClan.clan_mineur === true;
    return (
      <ClanDetail
        clan={selectedClan}
        clans={clans}
        onBack={() => setSelectedClan(null)}
        onSelectClan={(id) => {
          const c = clans.find(x => x.id === id);
          if (c) setSelectedClan(c);
        }}
        onNavigateToGenealogie={onNavigateToGenealogie}
        onNavigateToPersonnage={onNavigateToPersonnage}
        currentIndex={isMineur ? -1 : currentIndex}
        total={isMineur ? 0 : clanRoster.length}
        onGoTo={handleGoTo}
        playerMode={playerMode}
      />
    );
  }

  return (
    <div className="ct-root">
      <div className="ct-header">
        <h1 className="ct-title">Clans de Paris</h1>
        <p className="ct-subtitle">
          {clansNormaux.filter(c => c.population > 0).length} clans actifs ·{' '}
          {clansNormaux.reduce((s, c) => s + (c.population ?? 0), 0)} vampires recensés
        </p>
      </div>

      <table className="ct-table">
        <thead>
          <tr>
            <th className="ct-th ct-th-logo" />
            <th className="ct-th ct-th-nom" onClick={() => handleSort('nom')}>
              Clan <SortIcon col="nom" />
            </th>
            <th className="ct-th ct-th-pop" onClick={() => handleSort('population')}>
              Population <SortIcon col="population" />
            </th>
            <th className="ct-th ct-th-desc">Aperçu</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(clan => (
            <tr
              key={clan.id}
              className="ct-row"
              onClick={() => setSelectedClan(clan)}
              style={{ '--clan-color': clan.couleur }}
            >
              <td className="ct-td ct-td-logo">
                <ClanLogo url={clan.icon_url} nom={clan.nom} couleur={clan.couleur} size={40} />
              </td>
              <td className="ct-td ct-td-nom">
                <span className="ct-clan-name">{clan.nom}</span>
              </td>
              <td className="ct-td ct-td-pop">
                <PopBar value={clan.population ?? 0} max={maxPop} couleur={clan.couleur} />
              </td>
              <td className="ct-td ct-td-desc">
                {clan.description
                  ? clan.description.slice(0, 100) + (clan.description.length > 100 ? '…' : '')
                  : <span className="ct-no-desc">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Volet AUTRES — visible seulement si des clans mineurs existent */}
      {clansMineurs.length > 0 && (
        playerMode
          ? <AutresJoueurs />
          : <AutresMJ
              clansMineurs={clansMineurs}
              allClans={clans}
              onSelectClan={setSelectedClan}
              onNavigateToPersonnage={onNavigateToPersonnage}
            />
      )}
    </div>
  );
}
