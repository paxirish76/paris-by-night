import React, { useState, useRef, useEffect, useCallback } from 'react';
import humainData    from '../data/chronologie_humaine_fr.json';
import vampireData   from '../data/chronologie_vampirique_fr.json';
import './Chronologie.css';

// ── Parse JSON into flat event list ──────────────────────────────────────────

function parseYear(yearStr) {
  const s = String(yearStr).trim();
  const first = s.split(/[-–]/)[0];
  if (s.startsWith('-')) return -parseInt(s.slice(1), 10);
  return parseInt(first, 10);
}

function flattenTimeline(data, type) {
  const events = [];
  for (const period of data.timeline) {
    for (const ev of period.events) {
      const yearStr = String(ev.year);
      events.push({
        year:        parseYear(yearStr),
        yearLabel:   yearStr.replace('-', ' — ').replace(/(\d{4})–(\d{4})/, '$1–$2'),
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

const POPOVER_HEIGHT = 110; // hauteur estimée du popover en px
const POPOVER_MARGIN = 8;   // espace entre la pill et le popover

// ── Component ─────────────────────────────────────────────────────────────────

export default function Chronologie() {
  const [popover, setPopover] = useState(null); // { event, top, left, above }
  const pageRef = useRef(null);

  const getEvents = (year, type) => ALL_EVENTS.filter(e => e.year === year && e.type === type);

  const getYearLabel = (year) => {
    const ev = ALL_EVENTS.find(e => e.year === year);
    return ev?.yearLabel ?? String(year < 0 ? `${Math.abs(year)} av. J.-C.` : year);
  };

  const handleClick = useCallback((ev, btnEl) => {
    // Toggle off if same event
    if (popover && popover.event.year === ev.year && popover.event.event === ev.event) {
      setPopover(null);
      return;
    }

    const btnRect  = btnEl.getBoundingClientRect();
    const pageRect = pageRef.current.getBoundingClientRect();

    // Space available above and below the button (relative to viewport)
    const spaceBelow = window.innerHeight - btnRect.bottom;
    const spaceAbove = btnRect.top;
    const above = spaceAbove > spaceBelow && spaceBelow < POPOVER_HEIGHT + POPOVER_MARGIN;

    // Position relative to .chron-page (which is position:relative)
    const relTop = above
      ? btnRect.top  - pageRect.top - POPOVER_HEIGHT - POPOVER_MARGIN
      : btnRect.bottom - pageRect.top + POPOVER_MARGIN;

    // Center horizontally on the button, clamped within page
    const pageWidth   = pageRect.width;
    const popoverWidth = Math.min(480, pageWidth - 32);
    const btnCenterX  = btnRect.left - pageRect.left + btnRect.width / 2;
    const rawLeft     = btnCenterX - popoverWidth / 2;
    const clampedLeft = Math.max(16, Math.min(rawLeft, pageWidth - popoverWidth - 16));

    setPopover({ event: ev, top: relTop, left: clampedLeft, width: popoverWidth, above });
  }, [popover]);

  // Close on click outside
  useEffect(() => {
    if (!popover) return;
    const handler = (e) => {
      if (!e.target.closest('.chron-popover') && !e.target.closest('.pill')) {
        setPopover(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popover]);

  // Close on scroll (popover would drift otherwise)
  useEffect(() => {
    if (!popover) return;
    const handler = () => setPopover(null);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [popover]);

  return (
    <div className="chron-page" ref={pageRef}>
      <header className="chron-header">
        <h1 className="chron-title">Chronologie de Paris</h1>
        <div className="chron-legend">
          <span className="legend-dot human" />
          <span className="legend-label">Histoire humaine</span>
          <span className="legend-dot vampire" />
          <span className="legend-label">Histoire vampirique</span>
        </div>
      </header>

      {/* Popover positionné dynamiquement */}
      {popover && (
        <div
          className={`chron-popover chron-popover--${popover.above ? 'above' : 'below'} ${popover.event.type}`}
          style={{ top: popover.top, left: popover.left, width: popover.width }}
        >
          <div className="chron-popover-header">
            <span className={`chron-detail-badge ${popover.event.type}`}>
              {popover.event.type === 'vampire' ? '🩸' : '📜'} {popover.event.yearLabel}
            </span>
            <span className="chron-detail-name">{popover.event.event}</span>
            <button className="chron-detail-close" onClick={() => setPopover(null)}>✕</button>
          </div>
          <p className="chron-detail-desc">{popover.event.description}</p>
          <div className={`chron-popover-arrow chron-popover-arrow--${popover.above ? 'bottom' : 'top'}`} />
        </div>
      )}

      <div className="chron-grid">
        {/* Header row */}
        <div className="chron-col-label human-label">Mortels</div>
        <div className="chron-spine-top" />
        <div className="chron-col-label vampire-label">Vampires</div>

        {YEARS.map(year => {
          const humanEvs = getEvents(year, 'human');
          const vampEvs  = getEvents(year, 'vampire');
          const label    = getYearLabel(year);
          const nodeType = humanEvs.length && vampEvs.length ? 'dual'
                         : humanEvs.length ? 'human' : 'vampire';

          return (
            <React.Fragment key={year}>
              {/* Human cell */}
              <div className="chron-cell human-cell">
                {humanEvs.map((ev, i) => (
                  <button
                    key={i}
                    className={`pill human ${popover?.event.event === ev.event && popover?.event.year === ev.year ? 'active' : ''}`}
                    onClick={(e) => handleClick(ev, e.currentTarget)}
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
                    className={`pill vampire ${popover?.event.event === ev.event && popover?.event.year === ev.year ? 'active' : ''}`}
                    onClick={(e) => handleClick(ev, e.currentTarget)}
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
