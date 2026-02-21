import React, { useState } from 'react';
import './Chronologie.css';

const ALL_EVENTS = [
  { year: -52,  yearLabel: "52 av. J.-C.", type: "human",   event: "Bataille de Lutèce",          description: "Conquête romaine des Parisii par Jules César." },
  { year: 508,  yearLabel: "508",          type: "human",   event: "Statut de capitale",          description: "Clovis Ier établit Paris comme capitale du royaume franc." },
  { year: 508,  yearLabel: "508",          type: "vampire", event: "Prise de pouvoir d'Alexander", description: "Alexander, Ventrue de 4e génération, devient le premier Prince de Paris, imposant une autorité quasi absolue et jetant les bases d'une Mascarade primitive." },
  { year: 1190, yearLabel: "1190",         type: "human",   event: "Fortification de Paris",      description: "Philippe Auguste commence la grande muraille et le Louvre pour défendre Paris." },
  { year: 1250, yearLabel: "1250–1400",    type: "vampire", event: "Pression inquisitoriale",     description: "L'Inquisition force les vampires parisiens à adopter une discrétion extrême, bien avant la fondation officielle de la Camarilla." },
  { year: 1337, yearLabel: "1337",         type: "human",   event: "Guerre de Cent Ans",          description: "Début du conflit franco-anglais qui ravage le royaume et déstabilise Paris pendant plus d'un siècle." },
  { year: 1337, yearLabel: "1337–1453",    type: "vampire", event: "Guerre vampirique",            description: "Conflit parallèle entre lignées vampiriques françaises et anglaises, se superposant au conflit mortel." },
  { year: 1348, yearLabel: "1348",         type: "human",   event: "Peste Noire",                 description: "La grande épidémie tue un tiers de la population parisienne en quelques mois seulement." },
  { year: 1358, yearLabel: "1358",         type: "human",   event: "Triple crise",                description: "Révolte d'Étienne Marcel, Jacquerie paysanne et instabilité royale plongent Paris dans le chaos." },
  { year: 1358, yearLabel: "1358",         type: "vampire", event: "Révolte anarch",              description: "Les Anarchs tentent de renverser Alexander — ils sont brutalement écrasés, sans pitié." },
  { year: 1370, yearLabel: "1370",         type: "human",   event: "La Bastille",                 description: "Construction de la forteresse pour contrôler l'entrée est de Paris." },
  { year: 1438, yearLabel: "1438",         type: "human",   event: "Loups de Paris",              description: "Des meutes de loups affamés envahissent la ville, terrorisant la population hivernale." },
  { year: 1438, yearLabel: "1438",         type: "vampire", event: "Attaque de garous",           description: "Une meute de loups-garous profite du chaos pour attaquer les vampires parisiens — repoussée de justesse." },
  { year: 1450, yearLabel: "1450",         type: "human",   event: "Cour des Miracles",           description: "Apogée de la contre-société criminelle organisée dans les marges de Paris." },
  { year: 1667, yearLabel: "1667",         type: "human",   event: "Réforme de La Reynie",        description: "Invention de la police moderne et de l'éclairage public, transformant radicalement les nuits parisiennes." },
  { year: 1667, yearLabel: "1667",         type: "vampire", event: "Descente sous terre",         description: "L'éclairage et la nouvelle police chassent Nosferatu et Malkaviens des rues vers les catacombes." },
  { year: 1677, yearLabel: "1677",         type: "human",   event: "Affaire des Poisons",         description: "Scandale d'empoisonnements impliquant la haute société et la cour de Louis XIV." },
  { year: 1789, yearLabel: "1789",         type: "human",   event: "Révolution française",        description: "Renversement de l'Ancien Régime. La Bastille tombe, le roi est renversé, Paris s'embrase." },
  { year: 1789, yearLabel: "1789",         type: "vampire", event: "Chute d'Alexander",           description: "Un assaut conjoint des Anarchs et du Sabbat profite du chaos révolutionnaire. Alexander disparaît dans l'ombre." },
  { year: 1799, yearLabel: "1799",         type: "human",   event: "Napoléon Premier Consul",     description: "Napoléon prend le pouvoir, rétablit l'ordre et réorganise l'État français." },
  { year: 1799, yearLabel: "1799",         type: "vampire", event: "Ascension de Villon",         description: "François Villon reprend Paris avec l'aide de plusieurs clans et devient Prince, instaurant la Pax Toreador." },
  { year: 1830, yearLabel: "1830",         type: "vampire", event: "Agitation anarch",            description: "Profitant des Trois Glorieuses, une nouvelle tentative anarch échoue face à Villon." },
  { year: 1848, yearLabel: "1848",         type: "vampire", event: "Seconde révolte anarch",      description: "Les Anarchs se soulèvent à nouveau dans le sillage des révolutions européennes — nouvel échec." },
  { year: 1852, yearLabel: "1852",         type: "human",   event: "Haussmannisation",            description: "Transformation radicale du tissu urbain parisien sous Napoléon III et le baron Haussmann." },
  { year: 1871, yearLabel: "1871",         type: "human",   event: "Commune de Paris",            description: "Insurrection populaire et sanglante répression par les Versaillais." },
  { year: 1871, yearLabel: "1871",         type: "vampire", event: "Commune anarch",              description: "Le plus grand soulèvement anarchique vampirique, instrumentalisé depuis la Commune — écrasé par Villon." },
  { year: 1889, yearLabel: "1889",         type: "vampire", event: "Conseil de la Camarilla",     description: "L'Exposition universelle sert de couverture à un conseil majeur des anciens de la Camarilla." },
  { year: 1914, yearLabel: "1914–1945",    type: "human",   event: "Guerres mondiales",           description: "Paris survit à deux conflits mondiaux, dont l'Occupation nazie de 1940 à 1944." },
  { year: 1914, yearLabel: "1914–1945",    type: "vampire", event: "Perturbations mineures",      description: "Les guerres n'apportent que quelques incursions Sabbat. Les maîtres de la nuit maintiennent leur emprise sur Paris." },
  { year: 1947, yearLabel: "1947",         type: "human",   event: "New Look",                    description: "Christian Dior redonne au prestige de la mode parisienne son rayonnement mondial." },
];

const YEARS = [...new Set(ALL_EVENTS.map(e => e.year))].sort((a, b) => a - b);

export default function Chronologie() {
  const [activeEvent, setActiveEvent] = useState(null);

  const getEvents = (year, type) => ALL_EVENTS.filter(e => e.year === year && e.type === type);

  const handleClick = (ev) => {
    setActiveEvent(prev =>
      prev && prev.year === ev.year && prev.event === ev.event ? null : ev
    );
  };

  return (
    <div className="chron-page">
      <header className="chron-header">
        <h1 className="chron-title">Chronologie de Paris</h1>
        <div className="chron-legend">
          <span className="legend-dot human" />
          <span className="legend-label">Histoire humaine</span>
          <span className="legend-dot vampire" />
          <span className="legend-label">Histoire vampirique</span>
        </div>
      </header>

      {/* Sticky detail panel */}
      <div className={`chron-detail ${activeEvent ? 'visible' : ''}`}>
        {activeEvent && (
          <>
            <span className={`chron-detail-badge ${activeEvent.type}`}>
              {activeEvent.type === 'vampire' ? '🩸' : '📜'} {activeEvent.yearLabel}
            </span>
            <span className="chron-detail-name">{activeEvent.event}</span>
            <span className="chron-detail-desc">{activeEvent.description}</span>
            <button className="chron-detail-close" onClick={() => setActiveEvent(null)}>✕</button>
          </>
        )}
      </div>

      <div className="chron-grid">
        {/* Header row */}
        <div className="chron-col-label human-label">Mortels</div>
        <div className="chron-spine-top" />
        <div className="chron-col-label vampire-label">Vampires</div>

        {YEARS.map(year => {
          const humanEvs = getEvents(year, 'human');
          const vampEvs  = getEvents(year, 'vampire');
          const label    = ALL_EVENTS.find(e => e.year === year)?.yearLabel ?? String(year);
          const nodeType = humanEvs.length && vampEvs.length ? 'dual' : humanEvs.length ? 'human' : 'vampire';

          return (
            <React.Fragment key={year}>
              {/* Human cell */}
              <div className="chron-cell human-cell">
                {humanEvs.map((ev, i) => (
                  <button
                    key={i}
                    className={`pill human ${activeEvent?.event === ev.event && activeEvent?.year === ev.year ? 'active' : ''}`}
                    onClick={() => handleClick(ev)}
                  >
                    {ev.event}
                  </button>
                ))}
              </div>

              {/* Spine */}
              <div className="chron-spine-cell">
                <div className="spine-line" />
                <div className={`spine-node ${nodeType}`}>
                  <span className="spine-year">{label}</span>
                </div>
              </div>

              {/* Vampire cell */}
              <div className="chron-cell vampire-cell">
                {vampEvs.map((ev, i) => (
                  <button
                    key={i}
                    className={`pill vampire ${activeEvent?.event === ev.event && activeEvent?.year === ev.year ? 'active' : ''}`}
                    onClick={() => handleClick(ev)}
                  >
                    {ev.event}
                  </button>
                ))}
              </div>
            </React.Fragment>
          );
        })}

        {/* Bottom cap */}
        <div />
        <div className="chron-spine-cell cap"><div className="spine-line" /></div>
        <div />
      </div>
    </div>
  );
}
