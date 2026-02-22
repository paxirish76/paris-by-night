import React, { useState } from 'react';
import humainData    from '../data/chronologie_humaine_fr.json';
import vampireData   from '../data/chronologie_vampirique_fr.json';
import './Chronologie.css';

// ── Parse JSON into flat event list ──────────────────────────────────────────

function parseYear(yearStr) {
  // Handles "508", "-52", "1337-1453", "1250-1400"
  const s = String(yearStr).trim();
  const first = s.split(/[-–]/)[0];
  // Negative years like "-52": split gives ["", "52"], so check original
  if (s.startsWith('-')) return -parseInt(s.slice(1), 10);
  return parseInt(first, 10);
}

function flattenTimeline(data, type) {
  const events = [];
  for (const period of data.timeline) {
    for (const ev of period.events) {
      const yearStr = String(ev.year);
      events.push({
        year:      parseYear(yearStr),
        yearLabel: yearStr.replace('-', ' — ').replace(/(\d{4})–(\d{4})/, '$1–$2'),
        type,
        event:       ev.event,
        description: ev.description,
      });
    }
  }
  return events;
}

const ALL_EVENTS = [
  ...flattenTimeline(humainData,  'human'),
  ...flattenTimeline(vampireData, 'vampire'),
];

const YEARS = [...new Set(ALL_EVENTS.map(e => e.year))].sort((a, b) => a - b);

// ── Component ─────────────────────────────────────────────────────────────────

export default function Chronologie() {
  const [activeEvent, setActiveEvent] = useState(null);

  const getEvents = (year, type) => ALL_EVENTS.filter(e => e.year === year && e.type === type);

  const handleClick = (ev) => {
    setActiveEvent(prev =>
      prev && prev.year === ev.year && prev.event === ev.event ? null : ev
    );
  };

  // Find a display label for a year (prefer range label if exists)
  const getYearLabel = (year) => {
    const ev = ALL_EVENTS.find(e => e.year === year);
    return ev?.yearLabel ?? String(year < 0 ? `${Math.abs(year)} av. J.-C.` : year);
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
          const label    = getYearLabel(year);
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
