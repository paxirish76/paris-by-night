import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Influences.css';

// ── Label maps ────────────────────────────────────────────────────────────────

const CAT_LABELS = {
  politique_mortelle:      'Politique Mortelle',
  economie:                'Économie',
  information_surveillance:'Information & Surveillance',
  culture:                 'Culture',
  societe:                 'Société',
  territoire_mobilite:     'Territoire & Mobilité',
  criminalite:             'Criminalité',
  institutions_essentielles:'Institutions',
  influence_intellectuelle: 'Influence Intellectuelle',
  technologie_systemes:    'Technologie & Systèmes',
  territoire_environnement:'Territoire & Environnement',
};

const CAT_ICONS = {
  politique_mortelle:      '🏛️',
  economie:                '💰',
  information_surveillance:'👁️',
  culture:                 '🎭',
  societe:                 '👥',
  territoire_mobilite:     '🗺️',
  criminalite:             '🗡️',
  institutions_essentielles:'⚕️',
  influence_intellectuelle: '🧠',
  technologie_systemes:    '⚙️',
  territoire_environnement:'🌆',
};

const SOUS_CAT_LABELS = {
  gouvernement_national:     'Gouvernement national',
  'ministeres.interieur':    'Ministère — Intérieur',
  'ministeres.defense':      'Ministère — Défense',
  'ministeres.justice':      'Ministère — Justice',
  'ministeres.culture':      'Ministère — Culture',
  ministeres:                'Ministères',
  prefecture_police:         'Préfecture de Police',
  mairies_arrondissements:   'Mairies d\'arrondissement',
  conseil_paris:             'Conseil de Paris',
  syndicats_police:          'Syndicats de Police',
  renseignement_actif:       'Renseignement actif',
  renseignement_passif:      'Renseignement passif',
  influence_indirecte:       'Influence indirecte',
  'partis_politiques.extreme_gauche':  'Parti — Extrême Gauche',
  'partis_politiques.gauche_moderee':  'Parti — Gauche modérée',
  'partis_politiques.centre':          'Parti — Centre',
  'partis_politiques.centre_droit':    'Parti — Centre-Droit',
  'partis_politiques.droite':          'Parti — Droite',
  'partis_politiques.extreme_droite':  'Parti — Extrême Droite',
  ambassades:                'Ambassades',
  reseaux_diplomatiques:     'Réseaux diplomatiques',
  ONG:                       'ONG',
  extreme_gauche:            'Extrême Gauche',
  extreme_droite:            'Extrême Droite',
  CAC40:                     'CAC 40',
  immobilier_BTP:            'Immobilier & BTP',
  energie_eau_transport:     'Énergie / Eau / Transport',
  banques_finance:           'Banques & Finance',
  logistique_ports:          'Logistique & Ports',
  tourisme_hotellerie:       'Tourisme & Hôtellerie',
  luxe_mode:                 'Luxe & Mode',
  medias_traditionnels:      'Médias traditionnels',
  cinema_musique:            'Cinéma & Musique',
  finance_illegale:          'Finance illégale',
  interet:                   'Intérêt économique',
  presse_TV_radio:           'Presse / TV / Radio',
  influence_journalistes:    'Influence journalistes',
  reseaux_sociaux:           'Réseaux sociaux',
  controle_recit_public:     'Contrôle du récit public',
  propagande_desinformation: 'Propagande & Désinformation',
  cyber_surveillance:        'Cyber-surveillance',
  dossiers_administratifs:   'Dossiers administratifs',
  secrets_etat:              'Secrets d\'État',
  espionnage_mortel:         'Espionnage mortel',
  espionnage_vampirique:     'Espionnage vampirique',
  arts_culture_generale:     'Arts & Culture générale',
  cinema_series:             'Cinéma & Séries',
  architecture_urbanisme:    'Architecture & Urbanisme',
  opinion_publique:          'Opinion publique',
  mode_de_vie:               'Mode de vie',
  reseaux_associatifs:       'Réseaux associatifs',
  syndicats_mouvements:      'Syndicats & Mouvements',
  influence_communautaire:   'Influence communautaire',
  lieux_socialisation:       'Lieux de socialisation',
  controle_flux_humains:     'Contrôle des flux humains',
  tendances_population:      'Tendances population',
  couloirs_mobilite:         'Couloirs de mobilité',
  trafic_stupefiants:        'Trafic de stupéfiants',
  reseaux_mafieux:           'Réseaux mafieux',
  bandes_quartier:           'Bandes de quartier',
  police_renseignement_criminel: 'Police & Renseignement criminel',
  corruption_infiltration:   'Corruption & Infiltration',
  hopitaux:                  'Hôpitaux',
  universites:               'Universités',
  musees_bibliotheques:      'Musées & Bibliothèques',
  grandes_infrastructures:   'Grandes infrastructures',
  production_ideologies:     'Production d\'idéologies',
  think_tanks:               'Think tanks',
  recherche_scientifique:    'Recherche scientifique',
  systemes_information:      'Systèmes d\'information',
  cybersecurite:             'Cybersécurité',
  cryptographie_occulte:     'Cryptographie occulte',
  reseaux_speciaux:          'Réseaux spéciaux',
  surveillance_algorithmique:'Surveillance algorithmique',
  fleuves_canaux_ports:      'Fleuves, canaux & ports',
  gares_reseau_ferre:        'Gares & Réseau ferré',
  prostitution:              'Prostitution',
  clubs_cabarets:            'Clubs & Cabarets',
  fetes_clandestines:        'Fêtes clandestines',
  crypto_culture:            'Crypto-culture',
};

const NIVEAU_CONFIG = {
  dominant:   { label: 'Dominant',   color: '#d4af37', rank: 7 },
  important:  { label: 'Important',  color: '#c07830', rank: 6 },
  secondaire: { label: 'Secondaire', color: '#5b8fc9', rank: 5 },
  present:    { label: 'Présent',    color: '#6aaa8a', rank: 4 },
  contextuel: { label: 'Contextuel', color: '#9b7fb6', rank: 3 },
  chaotique:  { label: 'Chaotique',  color: '#cc4466', rank: 3 },
  montante:   { label: 'Montante',   color: '#e8883a', rank: 3 },
  faible:     { label: 'Faible',     color: '#666',    rank: 2 },
  nulle:      { label: 'Nulle',      color: '#333',    rank: 1 },
};

const ALL_CATS = Object.keys(CAT_LABELS);

function labelSousCat(key) {
  return SOUS_CAT_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function NiveauBadge({ niveau, detail }) {
  const cfg = NIVEAU_CONFIG[niveau] || NIVEAU_CONFIG.faible;
  const showDetail = detail && detail !== niveau && !['faible','nulle','dominant','important','secondaire','present','partage'].includes(detail);
  return (
    <span
      className="inf-badge"
      style={{ '--badge-color': cfg.color }}
      title={showDetail ? detail.replace(/_/g, ' ') : undefined}
    >
      <span className="inf-badge-dot" />
      {cfg.label}
      {showDetail && <span className="inf-badge-detail">{detail.replace(/_/g, ' ')}</span>}
    </span>
  );
}

// ── View: Par Clan ────────────────────────────────────────────────────────────

function VueParClan({ influences, clans, playerMode, viewerClan }) {
  const [selectedClanId, setSelectedClanId] = useState(
    playerMode && viewerClan ? viewerClan : (clans[0]?.id ?? null)
  );
  const [openCats, setOpenCats] = useState(new Set(ALL_CATS));

  const visibleClans = playerMode && viewerClan
    ? clans.filter(c => c.id === viewerClan)
    : clans;

  const clan = visibleClans.find(c => c.id === selectedClanId)
    ?? visibleClans[0]
    ?? null;
  const activeClanId = clan?.id ?? null;
  const clanData = influences.filter(r => r.clan_id === activeClanId);

  const toggleCat = (cat) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const cats = ALL_CATS.filter(cat => clanData.some(r => r.categorie === cat));

  return (
    <div className="inf-clan-view">
      {/* Clan selector — MJ only */}
      {!playerMode && (
        <div className="inf-clan-tabs">
          {visibleClans.map(c => (
            <button
              key={c.id}
              className={`inf-clan-tab ${c.id === activeClanId ? 'active' : ''}`}
              style={{ '--tab-color': c.couleur }}
              onClick={() => { setSelectedClanId(c.id); setOpenCats(new Set(ALL_CATS)); }}
            >
              {c.icon_url && <img src={c.icon_url} alt={c.nom} className="inf-clan-tab-icon" />}
              {c.nom}
            </button>
          ))}
        </div>
      )}

      {clan && (
        <div className="inf-clan-content">
          <div className="inf-clan-header" style={{ '--clan-color': clan.couleur }}>
            <div className="inf-clan-header-bar" style={{ background: clan.couleur }} />
            <h2 className="inf-clan-title">{clan.nom}</h2>
            <span className="inf-clan-subtitle">Sphères d'influence</span>
          </div>

          <div className="inf-categories">
            {cats.map(cat => {
              const rows = clanData
                .filter(r => r.categorie === cat)
                .sort((a, b) => (NIVEAU_CONFIG[b.niveau]?.rank ?? 0) - (NIVEAU_CONFIG[a.niveau]?.rank ?? 0));
              const isOpen = openCats.has(cat);
              const topNiveau = rows[0]?.niveau;
              const topColor = NIVEAU_CONFIG[topNiveau]?.color ?? '#666';

              return (
                <div key={cat} className={`inf-cat ${isOpen ? 'open' : ''}`}>
                  <button className="inf-cat-head" onClick={() => toggleCat(cat)}
                    style={{ '--cat-accent': topColor }}>
                    <span className="inf-cat-icon">{CAT_ICONS[cat]}</span>
                    <span className="inf-cat-label">{CAT_LABELS[cat]}</span>
                    <span className="inf-cat-count">{rows.length}</span>
                    <span className="inf-cat-chevron">{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div className="inf-cat-body">
                      {rows.map((r, i) => (
                        <div key={i} className="inf-row">
                          <span className="inf-row-label">{labelSousCat(r.sous_cat)}</span>
                          <NiveauBadge niveau={r.niveau} detail={r.detail} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── View: Par Catégorie ───────────────────────────────────────────────────────

function VueParCategorie({ influences, clans }) {
  const [selectedCat, setSelectedCat] = useState(ALL_CATS[0]);

  const catData = influences.filter(r => r.categorie === selectedCat);

  // All unique sous_cats in this category
  const sousCats = [...new Set(catData.map(r => r.sous_cat))].sort((a, b) => {
    // Group by prefix (ministeres.*, partis_politiques.*)
    return a.localeCompare(b, 'fr');
  });

  // For each sous_cat, build clan → row map
  const clanIds = clans.map(c => c.id);

  return (
    <div className="inf-cat-view">
      {/* Category selector */}
      <div className="inf-cat-tabs">
        {ALL_CATS.map(cat => {
          const hasData = influences.some(r => r.categorie === cat);
          return (
            <button
              key={cat}
              className={`inf-cat-tab ${cat === selectedCat ? 'active' : ''} ${!hasData ? 'empty' : ''}`}
              onClick={() => setSelectedCat(cat)}
            >
              <span className="inf-cat-tab-icon">{CAT_ICONS[cat]}</span>
              <span className="inf-cat-tab-label">{CAT_LABELS[cat]}</span>
            </button>
          );
        })}
      </div>

      <div className="inf-matrix">
        <div className="inf-matrix-title">
          <span className="inf-matrix-icon">{CAT_ICONS[selectedCat]}</span>
          {CAT_LABELS[selectedCat]}
        </div>

        {/* Header row: clan logos */}
      <div className="inf-matrix-scroll-wrapper">
        <div className="inf-matrix-grid" style={{ '--clan-count': clans.length }}>
          <div className="inf-matrix-corner" />
          {clans.map(c => (
            <div key={c.id} className="inf-matrix-clan-head" style={{ '--clan-color': c.couleur }}>
              {c.icon_url
                ? <img src={c.icon_url} alt={c.nom} className="inf-matrix-clan-icon" />
                : <span style={{ color: c.couleur }}>{c.nom[0]}</span>
              }
              <span className="inf-matrix-clan-name">{c.nom}</span>
            </div>
          ))}

          {/* Data rows */}
          {sousCats.map(sc => {
            const rowMap = {};
            catData.filter(r => r.sous_cat === sc).forEach(r => { rowMap[r.clan_id] = r; });

            return [
              <div key={`label-${sc}`} className="inf-matrix-row-label">
                {labelSousCat(sc)}
              </div>,
              ...clans.map(c => {
                const r = rowMap[c.id];
                const cfg = r ? (NIVEAU_CONFIG[r.niveau] || NIVEAU_CONFIG.faible) : null;
                return (
                  <div
                    key={`${sc}-${c.id}`}
                    className={`inf-matrix-cell ${r ? 'has-data' : 'no-data'}`}
                    style={r ? { '--cell-color': cfg.color } : {}}
                    title={r ? `${c.nom} — ${labelSousCat(sc)}: ${r.detail?.replace(/_/g,' ')}` : undefined}
                  >
                    {r ? (
                      <>
                        <span className="inf-cell-dot" />
                        <span className="inf-cell-label">{cfg.label}</span>
                      </>
                    ) : (
                      <span className="inf-cell-absent">—</span>
                    )}
                  </div>
                );
              })
            ];
          })}
        </div>
      </div>{/* inf-matrix-scroll-wrapper */}
      </div>{/* inf-matrix */}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Influences({ playerMode = false, viewerClan = null }) {
  const [influences, setInfluences] = useState([]);
  const [clans, setClans]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState('clan'); // 'clan' | 'categorie'

  useEffect(() => {
    const EXCLUDED_CLANS = ['mortel', 'assamite', 'giovanni', 'tzimisce'];

    Promise.all([
      supabase.from('influences').select('*').not('clan_id', 'in', `(${EXCLUDED_CLANS.map(c => `"${c}"`).join(',')})`),
      supabase.from('clans').select('id, nom, couleur, icon_url').neq('id', 'mortel').not('id', 'in', '("assamite","giovanni","tzimisce")').order('nom'),
    ]).then(([{ data: inf }, { data: cl }]) => {
      setInfluences(inf ?? []);
      setClans(cl ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="inf-loading">
      <div className="inf-spinner" />
      <p>Chargement des influences…</p>
    </div>
  );

  return (
    <div className="inf-root">
      <header className="inf-header">
        <div className="inf-header-eyebrow">Paris by Night · Camarilla</div>
        <h1 className="inf-header-title">Influences</h1>
        <p className="inf-header-sub">Sphères de pouvoir dans la ville des morts</p>

        <div className="inf-view-toggle">
          <button
            className={`inf-toggle-btn ${view === 'clan' ? 'active' : ''}`}
            onClick={() => setView('clan')}
          >
            Par Clan
          </button>
          {!playerMode && (
            <button
              className={`inf-toggle-btn ${view === 'categorie' ? 'active' : ''}`}
              onClick={() => setView('categorie')}
            >
              Par Catégorie
            </button>
          )}
        </div>
      </header>

      {view === 'clan'
        ? <VueParClan influences={influences} clans={clans} playerMode={playerMode} viewerClan={viewerClan} />
        : <VueParCategorie influences={influences} clans={clans} />
      }
    </div>
  );
}
