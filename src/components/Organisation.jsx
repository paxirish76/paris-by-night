import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './Organisation.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Couleurs des clans (cohérentes avec le reste de l'app)
const CLAN_COLORS = {
  brujah:   '#e05c2a',
  gangrel:  '#7ab648',
  lasombra: '#7c5cbf',
  malkavian:'#c47ed4',
  nosferatu:'#7d9e7d',
  toreador: '#d4537a',
  tremere:  '#c0392b',
  ventrue:  '#3a6fb5',
};

const CLAN_LABELS = {
  brujah:   'Brujah',
  gangrel:  'Gangrel',
  lasombra: 'Lasombra',
  malkavian:'Malkavian',
  nosferatu:'Nosferatu',
  toreador: 'Toreador',
  tremere:  'Tremere',
  ventrue:  'Ventrue',
};

// Données statiques de l'organisation
const ADJOINTS = [
  { nom: "Gustave 'Le Marteau' Lemaire",      clan: 'brujah',   id: 'gustave-lemaire' },
  { nom: 'Marc-André Ferrand',                clan: 'gangrel',  id: 'marc-andre-ferrand' },
  { nom: 'Luciano Bacigalupo dit Le Loup',    clan: 'lasombra', id: 'luciano-Bacigalupo' },
  { nom: 'Frère Malachie',                    clan: 'malkavian',id: 'frere_malachie' },
  { nom: 'Marc-Antoine Bréguet',              clan: 'nosferatu',id: 'marc-antoine-le-compilateur' },
  { nom: 'Alessandro di Cavalcanti',          clan: 'toreador', id: 'cavalcanti' },
  { nom: 'La Voisin',                         clan: 'tremere',  id: 'la_voisin' },
  { nom: 'Marc-Antoine de Varennes',          clan: 'ventrue',  id: 'de_varennes' },
];

const SECTIONS = [
  { id: 'prince',      label: 'Le Prince',                   icon: '👑' },
  { id: 'senechal',    label: 'Le Sénéchal',                 icon: '⚖️' },
  { id: 'sheriff',     label: 'Le Shériff',                  icon: '⚔️' },
  { id: 'gardienne',   label: "La Gardienne de l'Elysium",   icon: '🌹' },
  { id: 'bourgmestres',label: 'Les Bourgmestres',            icon: '🗺️' },
  { id: 'conseils',    label: 'Les Conseils',                icon: '📜' },
];

function Organisation({ onNavigateToPersonnage, onNavigateToBourg }) {
  const [openSection, setOpenSection] = useState('prince');
  const [bourgs, setBourgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBourgs = async () => {
      const { data, error } = await supabase
        .from('bourgs')
        .select('id, nom, clan_dominant_id, bourgmestre, bourgmestre_id')
        .order('nom');
      if (!error && data) setBourgs(data);
      setLoading(false);
    };
    fetchBourgs();
  }, []);

  const toggle = (id) => setOpenSection(prev => prev === id ? null : id);

  return (
    <div className="organisation">
      {/* En-tête */}
      <div className="org-hero">
        <div className="org-hero-ornament">✦</div>
        <h1 className="org-title">Organisation</h1>
        <p className="org-subtitle">Du Paris Vampirique</p>
        <div className="org-divider" />
        <p className="org-intro">
          Paris est gouvernée selon une hiérarchie millénaire, établie et maintenue
          par la volonté absolue de son Prince. Chaque fonction obéit à un protocole
          précis, chaque autorité se justifie par l'équilibre fragile de la Mascarade.
        </p>
      </div>

      {/* Accordion */}
      <div className="org-accordion">
        {SECTIONS.map(section => (
          <div
            key={section.id}
            className={`org-section ${openSection === section.id ? 'open' : ''}`}
          >
            <button
              className="org-section-header"
              onClick={() => toggle(section.id)}
            >
              <span className="org-section-icon">{section.icon}</span>
              <span className="org-section-label">{section.label}</span>
              <span className="org-section-chevron">
                {openSection === section.id ? '▲' : '▼'}
              </span>
            </button>

            <div className="org-section-body">
              <div className="org-section-content">
                {section.id === 'prince' && <SectionPrince onNavigate={onNavigateToPersonnage} />}
                {section.id === 'senechal' && <SectionSenechal onNavigate={onNavigateToPersonnage} />}
                {section.id === 'sheriff' && <SectionSheriff onNavigate={onNavigateToPersonnage} />}
                {section.id === 'gardienne' && <SectionGardienne onNavigate={onNavigateToPersonnage} />}
                {section.id === 'bourgmestres' && (
                  <SectionBourgmestres
                    bourgs={bourgs}
                    loading={loading}
                    onNavigateToPersonnage={onNavigateToPersonnage}
                    onNavigateToBourg={onNavigateToBourg}
                  />
                )}
                {section.id === 'conseils' && <SectionConseils />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sections individuelles ───────────────────────────────── */

function PersonnageLink({ id, nom, onNavigate }) {
  if (!id || !onNavigate) return <strong>{nom}</strong>;
  return (
    <button className="org-person-link" onClick={() => onNavigate(id)}>
      {nom}
    </button>
  );
}

function SectionPrince({ onNavigate }) {
  return (
    <div className="org-figure">
      <div className="org-figure-header">
        <span className="org-figure-title">
          <PersonnageLink id="villon" nom="François Villon" onNavigate={onNavigate} />
        </span>
        <span className="org-figure-role">Prince de Paris</span>
      </div>
      <p className="org-figure-desc">
        François Villon règne de façon absolue sur Paris. Toute décision d'importance
        passe par lui, et sa force réside autant dans le nombre de vampires de son clan
        présents dans la ville que dans la puissance qui est la sienne — et celle de ses
        trois infants résidents. Les conseils ne sont que consultatifs : ils éclairent,
        ils conseillent, mais ils ne décident pas.
      </p>
    </div>
  );
}

function SectionSenechal({ onNavigate }) {
  return (
    <div className="org-figure">
      <div className="org-figure-header">
        <span className="org-figure-title">
          <PersonnageLink id="alienor" nom="Aliénor de Valois" onNavigate={onNavigate} />
        </span>
        <span className="org-figure-role">Sénéchal</span>
      </div>
      <p className="org-figure-desc">
        Aliénor de Valois assume les fonctions du Prince en son absence, notamment lors
        des conseils. Sa parole y est aussi finale que celle de Villon — elle en est
        pleinement consciente, et c'est précisément pour cela qu'elle en use avec
        parcimonie. Elle n'intervient que lorsque Villon est hors de la ville, ou
        lorsqu'elle est certaine de connaître la décision qu'il aurait prise.
      </p>
    </div>
  );
}

function SectionSheriff({ onNavigate }) {
  return (
    <div className="org-figure">
      <div className="org-figure-header">
        <span className="org-figure-title">
          <PersonnageLink id="godefroy_sheriff" nom="Godefroy de Montmirail-Vexin" onNavigate={onNavigate} />
        </span>
        <span className="org-figure-role">Shériff de Paris</span>
      </div>
      <p className="org-figure-desc">
        Le Shériff de Paris est le garant de l'ordre dans la ville. Il exécute les
        décisions de Villon lorsque celles-ci requièrent l'usage de la force, et dispose
        pour cela de l'autorité nécessaire pour agir sans délai.
      </p>

      <div className="org-subsection">
        <h4 className="org-subsection-title">Shériffs Adjoints</h4>
        <p className="org-subsection-note">
          Les adjoints épaulent le Shériff dans le maintien de l'ordre et lors des
          investigations. Il les mobilise selon les besoins, mais leur accorde une
          confiance mesurée — chacun reste avant tout le représentant de son clan.
        </p>
        <div className="org-adjoints-grid">
          {ADJOINTS.map(adj => (
            <div key={adj.id} className="org-adjoint-card">
              <span
                className="org-adjoint-clan-dot"
                style={{ background: CLAN_COLORS[adj.clan] }}
              />
              <div className="org-adjoint-info">
                <button
                  className="org-person-link"
                  onClick={() => onNavigate && onNavigate(adj.id)}
                >
                  {adj.nom}
                </button>
                <span
                  className="org-adjoint-clan-label"
                  style={{ color: CLAN_COLORS[adj.clan] }}
                >
                  {CLAN_LABELS[adj.clan]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionGardienne({ onNavigate }) {
  return (
    <div className="org-figure">
      <div className="org-figure-header">
        <span className="org-figure-title">
          <PersonnageLink id="agnes_sorel" nom="Agnès Sorel" onNavigate={onNavigate} />
        </span>
        <span className="org-figure-role">Gardienne de l'Elysium</span>
      </div>
      <p className="org-figure-desc">
        Agnès Sorel est la gardienne des deux principaux Elysiums de Paris : le Louvre
        et le domaine de Versailles. Elle a seule la faculté de déclarer un lieu Elysium —
        de façon temporaire ou permanente. Les Elysiums propres à chaque bourg demeurent
        sous la responsabilité du bourgmestre concerné, mais Agnès y conserve un droit
        de regard.
      </p>
      <div className="org-elysiums">
        <div className="org-elysium-badge">🏛️ Le Louvre</div>
        <div className="org-elysium-badge">🏰 Domaine de Versailles</div>
      </div>
    </div>
  );
}

function SectionBourgmestres({ bourgs, loading, onNavigateToPersonnage, onNavigateToBourg }) {
  // Grouper par clan dominant
  const grouped = bourgs.reduce((acc, b) => {
    const clan = b.clan_dominant_id || 'inconnu';
    if (!acc[clan]) acc[clan] = [];
    acc[clan].push(b);
    return acc;
  }, {});

  const clanOrder = ['ventrue', 'toreador', 'brujah', 'nosferatu', 'malkavian', 'tremere', 'gangrel', 'lasombra'];

  if (loading) {
    return <div className="org-loading">Chargement des bourgmestres…</div>;
  }

  return (
    <div className="org-bourgmestres">
      <p className="org-figure-desc">
        Les bourgmestres exercent sur leur bourg une autorité comparable à celle d'un
        Prince — mais sans en détenir les pouvoirs. Ils expédient les affaires courantes,
        supervisent la vie mortelle et vampirique de leur territoire, et ont l'obligation
        d'en référer au Prince ou au Sénéchal pour toute situation sortant de l'ordinaire.
      </p>

      {clanOrder.map(clanId => {
        const list = grouped[clanId];
        if (!list || list.length === 0) return null;
        return (
          <div key={clanId} className="org-bourg-group">
            <div
              className="org-bourg-group-header"
              style={{ borderColor: CLAN_COLORS[clanId] }}
            >
              <span
                className="org-bourg-group-dot"
                style={{ background: CLAN_COLORS[clanId] }}
              />
              <span
                className="org-bourg-group-clan"
                style={{ color: CLAN_COLORS[clanId] }}
              >
                {CLAN_LABELS[clanId] || clanId}
              </span>
            </div>
            <div className="org-bourg-list">
              {list.map(b => (
                <div key={b.id} className="org-bourg-row">
                  <button
                    className="org-bourg-name"
                    onClick={() => onNavigateToBourg && onNavigateToBourg(b.id)}
                  >
                    {b.nom}
                  </button>
                  <span className="org-bourg-arrow">→</span>
                  <button
                    className="org-person-link"
                    onClick={() => onNavigateToPersonnage && onNavigateToPersonnage(b.bourgmestre_id)}
                  >
                    {b.bourgmestre}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionConseils() {
  return (
    <div className="org-conseils">
      <div className="org-conseil-block">
        <h4 className="org-conseil-title">⚜️ Conseil des Primogènes</h4>
        <p className="org-figure-desc">
          Réunissant les anciens de chaque clan, ce conseil fait office d'organe
          consultatif auprès de Villon. Ses membres sont influents, écoutés, respectés —
          mais ne disposent d'aucun pouvoir effectif.
        </p>
      </div>
      <div className="org-conseil-block">
        <h4 className="org-conseil-title">🗺️ Conseil des Bourgmestres</h4>
        <p className="org-figure-desc">
          Présidé par le Prince ou le Sénéchal, ce conseil se réunit quatre fois par an,
          aux équinoxes et aux solstices. Les bourgmestres y présentent leurs rapports et
          font remonter les besoins de leurs territoires. Pour les affaires courantes
          impliquant plusieurs bourgs, il dispose d'un pouvoir décisionnel — toujours
          soumis au veto du Prince ou d'Agnès Sorel.
        </p>
        <p className="org-figure-desc">
          Les Tremere y siègent avec deux représentants, en reconnaissance de leur
          influence et de leur choix délibéré de ne pas étendre leur mainmise au-delà
          du Quartier Latin.
        </p>
        <div className="org-conseil-sessions">
          <span className="org-session-badge">🌱 Équinoxe de printemps</span>
          <span className="org-session-badge">☀️ Solstice d'été</span>
          <span className="org-session-badge">🍂 Équinoxe d'automne</span>
          <span className="org-session-badge">❄️ Solstice d'hiver</span>
        </div>
      </div>
    </div>
  );
}

export default Organisation;
