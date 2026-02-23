import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Carte.css';
import { supabase } from '../lib/supabase';

// ─── Supabase storage bucket URL ──────────────────────────────────────────────
const BUCKET_URL = 'https://jjmiaoodkuwmbrplskif.supabase.co/storage/v1/object/public/lieux';

const getLieuImageUrl = (lieuId, index) =>
  `${BUCKET_URL}/${lieuId}${index}.jpg`;

// ─── SVG marker icon ──────────────────────────────────────────────────────────
const createLieuIcon = (color, statut) => {
  const s = (statut || '').toLowerCase();
  if (s.includes('elysium')) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
        <ellipse cx="15" cy="36" rx="5" ry="2" fill="rgba(0,0,0,0.5)"/>
        <line x1="15" y1="24" x2="15" y2="34" stroke="${color}" stroke-width="2"/>
        <polygon points="15,2 28,15 15,24 2,15" fill="${color}" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" opacity="0.95"/>
        <circle cx="15" cy="13" r="2.5" fill="rgba(255,255,255,0.45)"/>
      </svg>`;
  }
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 24 34">
      <ellipse cx="12" cy="33" rx="4" ry="1.5" fill="rgba(0,0,0,0.5)"/>
      <line x1="12" y1="22" x2="12" y2="31" stroke="${color}" stroke-width="2"/>
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="#1a1215" stroke-width="1.5" opacity="0.95"/>
      <circle cx="12" cy="12" r="6" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <circle cx="9.5" cy="9.5" r="2" fill="rgba(255,255,255,0.4)"/>
    </svg>`;
};

// ─── LieuImage: single image with fallback ────────────────────────────────────
const LieuImage = ({ src, alt, clanColor }) => {
  const [status, setStatus] = useState('loading'); // loading | loaded | error

  return (
    <div className="ld-img-wrapper">
      {status === 'loading' && (
        <div className="ld-img-placeholder">
          <div className="ld-img-shimmer" />
        </div>
      )}
      {status === 'error' && (
        <div className="ld-img-fallback" style={{ '--clan-color': clanColor }}>
          <span className="ld-img-fallback-icon">🏛️</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`ld-img ${status === 'loaded' ? 'ld-img--visible' : ''}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  );
};

// ─── Fullscreen LieuDrawer ────────────────────────────────────────────────────
const LieuDrawer = ({ lieu, clans, lieux, onClose, onLieuClick }) => {
  const [secretsRevealed, setSecretsRevealed] = useState(false);
  const [openSections, setOpenSections] = useState({ ambiance: true, utilite: true });

  useEffect(() => {
    setSecretsRevealed(false);
    setOpenSections({ ambiance: true, utilite: true });
  }, [lieu?.id]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!lieu) return null;

  const clanObj   = clans.find(c => c.id === lieu.clan_id);
  const clanColor = clanObj?.couleur || '#d4af37';
  const clanNom   = clanObj?.nom || lieu.clan_id;

  let desc = {};
  try {
    desc = typeof lieu.description === 'string'
      ? JSON.parse(lieu.description)
      : (lieu.description || {});
  } catch (e) { desc = {}; }

  const lieuxDuBourg = lieux.filter(l => l.bourg_id === lieu.bourg_id && l.id !== lieu.id);

  const toggleSection = (key) =>
    setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const Section = ({ id, icon, label, children, className = '' }) => (
    <div className={`ld-section ${openSections[id] ? 'open' : ''} ${className}`}>
      <div className="ld-section-header" onClick={() => toggleSection(id)}>
        <div className="ld-section-title"><span>{icon}</span> {label}</div>
        <span className="ld-chevron">▼</span>
      </div>
      <div className="ld-section-body">
        <div className="ld-section-content">{children}</div>
      </div>
    </div>
  );

  const protection = lieu.protection || 0;
  const isElysium  = (lieu.statut || '').toLowerCase().includes('elysium');

  return (
    <div className="ld-fullscreen" style={{ '--clan-color': clanColor }}>
      {/* ── Backdrop ── */}
      <div className="ld-backdrop" onClick={onClose} />

      {/* ── Panel ── */}
      <div className="ld-panel">

        {/* ── Close button ── */}
        <button className="ld-close-btn" onClick={onClose} aria-label="Fermer">
          <span>✕</span>
        </button>

        {/* ── Hero: 2 images ── */}
        <div className="ld-hero">
          <LieuImage
            src={getLieuImageUrl(lieu.id, 1)}
            alt={`${lieu.nom} — vue 1`}
            clanColor={clanColor}
          />
          <LieuImage
            src={getLieuImageUrl(lieu.id, 2)}
            alt={`${lieu.nom} — vue 2`}
            clanColor={clanColor}
          />

          {/* Gradient overlay on hero */}
          <div className="ld-hero-gradient" />

          {/* Title overlay on hero */}
          <div className="ld-hero-title">
            <div className="ld-hero-statut">
              <span className="ld-statut-dot" />
              {lieu.statut || 'Lieu'}
              {isElysium && <span className="ld-elysium-badge">◆ Elysium</span>}
            </div>
            <h1 className="ld-hero-nom">{lieu.nom}</h1>
            <div className="ld-hero-meta">
              <span className="ld-clan-badge" style={{ background: `${clanColor}22`, borderColor: `${clanColor}66`, color: clanColor }}>
                {clanNom}
              </span>
              {lieu.bourg?.nom && (
                <span className="ld-bourg-badge">🗺️ {lieu.bourg.nom}</span>
              )}
              {lieu.adresse && (
                <span className="ld-adresse-badge">📍 {lieu.adresse}</span>
              )}
            </div>
            {protection > 0 && (
              <div className="ld-protection">
                {[1,2,3,4,5,6].map(i => (
                  <span key={i} className={`ld-prot-star${i <= protection ? ' filled' : ''}`}>◆</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="ld-body">

          {/* Secrets toggle */}
          <div
            className={`ld-secrets-toggle ${secretsRevealed ? 'revealed' : ''}`}
            onClick={() => setSecretsRevealed(v => !v)}
          >
            <div className="ld-toggle-switch"><div className="ld-toggle-knob" /></div>
            <span>Secrets MJ</span>
          </div>

          {/* Ambiance */}
          {desc.ambiance && (
            <Section id="ambiance" icon="🌑" label="Ambiance">
              <p className="ld-text">{desc.ambiance}</p>
            </Section>
          )}

          {/* Utilité */}
          {desc.utilite && (
            <Section id="utilite" icon="⚜️" label="Utilité">
              <p className="ld-text">{desc.utilite}</p>
            </Section>
          )}

          {/* Sécurité occulte */}
          {(desc.securite_occulte || desc.gardien_special) && (
            <Section id="securite" icon="🔒" label="Sécurité Occulte">
              {desc.securite_occulte && <p className="ld-text">{desc.securite_occulte}</p>}
              {desc.gardien_special && (
                <p className="ld-text ld-gardien">
                  <strong>⚔️ Gardien :</strong> {desc.gardien_special}
                </p>
              )}
            </Section>
          )}

          {/* Autres lieux du bourg */}
          {lieuxDuBourg.length > 0 && (
            <Section id="bourg_lieux" icon="🏛️" label={`Autres lieux du bourg (${lieuxDuBourg.length})`}>
              <div className="ld-lieux-list">
                {lieuxDuBourg.map(l => {
                  const lClan  = clans.find(c => c.id === l.clan_id);
                  const lColor = lClan?.couleur || '#d4af37';
                  const isElys = (l.statut || '').toLowerCase().includes('elysium');
                  return (
                    <button key={l.id} className="ld-lieu-link" onClick={() => onLieuClick(l)}>
                      <span
                        className={`ld-lieu-shape ${isElys ? 'diamond' : 'circle'}`}
                        style={{ background: lColor, boxShadow: `0 0 5px ${lColor}55` }}
                      />
                      <div className="ld-lieu-link-text">
                        <span className="ld-lieu-link-nom" style={{ color: lColor }}>{l.nom}</span>
                        {l.statut && <span className="ld-lieu-link-statut">{l.statut}</span>}
                      </div>
                      <span className="ld-lieu-arrow">→</span>
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Secrets MJ */}
          {secretsRevealed && desc.secrets_mj && Object.keys(desc.secrets_mj).length > 0 && (
            <Section id="secrets" icon="🔴" label="Secrets MJ" className="ld-secrets-section">
              <div className="ld-secret-lock">🔒 Réservé au Maître du Jeu</div>
              <div className="ld-secret-items">
                {Object.entries(desc.secrets_mj).map(([k, v]) => (
                  <div key={k} className="ld-secret-item">
                    <div className="ld-secret-key">{k}</div>
                    <div className="ld-secret-value">{v}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
};

// ─── Main Carte ───────────────────────────────────────────────────────────────
const Carte = ({
  targetLieuId       = null,
  onTargetConsumed   = () => {},
  targetBourgId      = null,
  onTargetBourgConsumed = () => {},
  onTargetLieuConsumed  = null,
  onNavigateToBourg  = null,
  playerMode         = false,
  viewerClan         = null,
}) => {
  const [bourgs, setBourgs]                         = useState([]);
  const [lieux, setLieux]                           = useState([]);
  const [clans, setClans]                           = useState([]);
  const [selectedBourg, setSelectedBourg]           = useState(null);
  const [selectedClan, setSelectedClan]             = useState(null);
  const [selectedLieu, setSelectedLieu]             = useState(null);
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState(null);
  const [contoursGeoJSON, setContoursGeoJSON]       = useState(null);
  const [bourgsFusionnesGeoJSON, setBourgsFusionnesGeoJSON] = useState(null);
  const [mapReady, setMapReady]                     = useState(false);

  const mapRef              = useRef(null);
  const mapInstanceRef      = useRef(null);
  const baseContoursLayerRef = useRef(null);
  const bourgLayersRef      = useRef([]);
  const markersMapRef       = useRef(new Map());

  const clearLieu = onTargetLieuConsumed || onTargetConsumed;

  // ── GeoJSON ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [cRes, bRes] = await Promise.all([
          fetch('https://jjmiaoodkuwmbrplskif.supabase.co/storage/v1/object/public/geojson/idf_complet_avec_bourg_id.geojson'),
          fetch('https://jjmiaoodkuwmbrplskif.supabase.co/storage/v1/object/public/geojson/idf_complet_bourgs.json'),
        ]);
        setContoursGeoJSON(await cRes.json());
        setBourgsFusionnesGeoJSON(await bRes.json());
      } catch (err) { console.error('❌ GeoJSON:', err); }
    })();
  }, []);

  // ── Supabase ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [{ data: clansData }, { data: bourgsData }, { data: lieuxData }] = await Promise.all([
          supabase.from('clans').select('*').order('nom'),
          supabase.from('bourgs').select('*, clan:clans!bourgs_clan_dominant_id_fkey(*)').order('nom'),
          supabase.from('lieux').select('*, bourg:bourgs!lieux_bourg_id_fkey(nom)').order('nom'),
        ]);
        setClans(clansData || []);
        setBourgs(bourgsData || []);
        setLieux(lieuxData || []);
      } catch (err) {
        setError(`Erreur de chargement: ${err.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Init carte ────────────────────────────────────────────────────────────
  useEffect(() => {
    const initMap = () => {
      if (mapInstanceRef.current) return;
      if (!mapRef.current) { setTimeout(initMap, 50); return; }
      const map = L.map(mapRef.current, {
        center: [48.8566, 2.3522], zoom: 11, zoomControl: true, minZoom: 10, maxZoom: 16,
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 20,
      }).addTo(map);
      map.createPane('contoursPane'); map.getPane('contoursPane').style.zIndex = 450;
      map.createPane('bourgsPane');   map.getPane('bourgsPane').style.zIndex = 400;
      map.createPane('lieuxPane');    map.getPane('lieuxPane').style.zIndex = 600;
      mapInstanceRef.current = map;
      setMapReady(true);
    };
    const timer = setTimeout(initMap, 100);
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  // ── Contours ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !contoursGeoJSON) return;
    const map = mapInstanceRef.current;
    if (baseContoursLayerRef.current) map.removeLayer(baseContoursLayerRef.current);
    baseContoursLayerRef.current = L.geoJSON(contoursGeoJSON, {
      pane: 'contoursPane',
      style: { fillColor: 'transparent', fillOpacity: 0, color: '#666', weight: 1, opacity: 0.5 },
      interactive: false,
    }).addTo(map);
  }, [contoursGeoJSON, mapReady]);

  // ── Bourgs polygons ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !bourgs.length || !bourgsFusionnesGeoJSON || !clans.length) return;
    const map = mapInstanceRef.current;
    bourgLayersRef.current.forEach(l => map.removeLayer(l));
    bourgLayersRef.current = [];

    const bourgsMap = Object.fromEntries(bourgs.map(b => [b.id, b]));
    const clansMap  = Object.fromEntries(clans.map(c => [c.id, c]));

    bourgsFusionnesGeoJSON.features.forEach(feature => {
      const bourg = bourgsMap[feature.properties.bourg_id];
      if (!bourg) return;
      if (selectedClan && bourg.clan_dominant_id !== selectedClan) return;
      const clan    = clansMap[bourg.clan_dominant_id];
      const couleur = clan?.couleur || '#cccccc';
      const layer   = L.geoJSON(feature, {
        pane: 'bourgsPane',
        style: { fillColor: couleur, fillOpacity: 0.35, color: couleur, weight: 3, opacity: 1 },
        onEachFeature: (feat, l) => {
          l.on('mouseover', () => l.setStyle({ fillOpacity: 0.6, weight: 4 }));
          l.on('mouseout',  () => l.setStyle({ fillOpacity: 0.35, weight: 3 }));
          l.on('click', () => setSelectedBourg(bourg));
          l.bindPopup(`
            <div class="lmp-root" style="--pc:${couleur}">
              <div class="lmp-header" style="border-left:3px solid ${couleur};padding-left:10px">
                <div class="lmp-nom" style="color:${couleur}">${bourg.nom}</div>
                <div class="lmp-sub">
                  <span class="lmp-clan">${clan?.nom || 'Inconnu'}</span>
                  ${bourg.bourgmestre ? `<span class="lmp-dot">·</span><span class="lmp-statut">${bourg.bourgmestre}</span>` : ''}
                </div>
              </div>
              ${bourg.description?.ambiance ? `<p style="margin:8px 0 4px;font-style:italic;font-size:0.85rem;color:#c8b89a">${bourg.description.ambiance}</p>` : ''}
              ${bourg.description?.richesse ? `<p style="margin:4px 0 8px;font-size:0.8rem;color:#b09030">${'★'.repeat(bourg.description.richesse)}${'☆'.repeat(5 - bourg.description.richesse)}</p>` : ''}
              <button class="lmp-cta" style="border-color:${couleur};color:${couleur}"
                onclick="window.__openBourgDetail('${bourg.id}')">
                Voir la fiche →
              </button>
            </div>`, { maxWidth: 300, className: 'lmp-wrapper' });
        },
      });
      layer.addTo(map);
      bourgLayersRef.current.push(layer);
    });
  }, [bourgs, bourgsFusionnesGeoJSON, clans, selectedClan, mapReady]);

  // ── Consume targetLieuId ──────────────────────────────────────────────────
  useEffect(() => {
    if (!targetLieuId || !mapReady || !lieux.length || !clans.length) return;
    const lieu = lieux.find(l => l.id === targetLieuId);
    if (!lieu) return;

    setSelectedLieu(lieu);

    if (mapInstanceRef.current && lieu.latitude && lieu.longitude) {
      mapInstanceRef.current.flyTo([lieu.latitude, lieu.longitude], 15, { duration: 0.8 });
      setTimeout(() => {
        const marker = markersMapRef.current.get(lieu.id);
        if (marker) marker.openPopup();
      }, 900);
    }

    clearLieu();
  }, [targetLieuId, mapReady, lieux, clans]);

  // ── Consume targetBourgId ─────────────────────────────────────────────────
  useEffect(() => {
    if (!targetBourgId || !mapReady || !bourgsFusionnesGeoJSON) return;

    const feature = bourgsFusionnesGeoJSON.features.find(
      f => f.properties.bourg_id === targetBourgId
    );
    if (!feature) { onTargetBourgConsumed(); return; }

    const map = mapInstanceRef.current;

    try {
      const layer = L.geoJSON(feature);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [60, 60], duration: 0.9 });
      }
    } catch (e) { console.warn('flyToBounds failed:', e); }

    const clansMap = Object.fromEntries(clans.map(c => [c.id, c]));
    const bourg    = bourgs.find(b => b.id === targetBourgId);
    if (bourg) {
      bourgLayersRef.current.forEach(l => {
        l.eachLayer(sub => {
          if (sub.feature?.properties?.bourg_id === targetBourgId) {
            sub.setStyle({ fillOpacity: 0.75, weight: 5 });
            setTimeout(() => sub.setStyle({ fillOpacity: 0.35, weight: 3 }), 1800);
          }
        });
      });
      setSelectedBourg(bourg);
    }

    onTargetBourgConsumed();
  }, [targetBourgId, mapReady, bourgsFusionnesGeoJSON, bourgs, clans]);

  // ── Expose helpers to window for Leaflet popup buttons ────────────────────
  useEffect(() => {
    window.__lieuById       = (id) => lieux.find(l => l.id === id);
    window.__openLieuDrawer = (lieu) => { if (lieu) setSelectedLieu(lieu); };
    window.__openBourgDetail = (id) => { if (onNavigateToBourg) onNavigateToBourg(id); };
  }, [lieux, onNavigateToBourg]);

  // ── Lieux markers ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !lieux.length || !clans.length) return;
    const map = mapInstanceRef.current;

    markersMapRef.current.forEach(m => m.remove());
    markersMapRef.current.clear();

    const clansMap    = Object.fromEntries(clans.map(c => [c.id, c]));
    const lieuxVisiblesParMode = playerMode ? lieux.filter(l => l.connu || (viewerClan && Array.isArray(l.clan_overrides) && l.clan_overrides.includes(viewerClan))) : lieux;
    const lieuxFiltres = selectedClan ? lieuxVisiblesParMode.filter(l => l.clan_id === selectedClan) : lieuxVisiblesParMode;

    lieuxFiltres.forEach(lieu => {
      if (!lieu.latitude || !lieu.longitude) return;

      const clanColor = clansMap[lieu.clan_id]?.couleur || '#d4af37';
      const clanNom   = clansMap[lieu.clan_id]?.nom || '';
      const isElysium = (lieu.statut || '').toLowerCase().includes('elysium');

      const icon = L.divIcon({
        className: 'lieu-marker-icon',
        html: createLieuIcon(clanColor, lieu.statut),
        iconSize:    isElysium ? [30, 38] : [24, 34],
        iconAnchor:  isElysium ? [15, 36] : [12, 32],
        popupAnchor: [0, -38],
      });

      const popupHtml = `
        <div class="lmp-root" style="--pc:${clanColor}">
          <div class="lmp-header" style="border-left:3px solid ${clanColor}; padding-left:10px">
            <div class="lmp-nom" style="color:${clanColor}">${lieu.nom}</div>
            <div class="lmp-sub">
              <span class="lmp-clan">${clanNom}</span>
              ${lieu.statut ? `<span class="lmp-dot">·</span><span class="lmp-statut">${lieu.statut}</span>` : ''}
            </div>
          </div>
          <button class="lmp-cta" style="border-color:${clanColor};color:${clanColor}"
            onclick="window.__openLieuDrawer(window.__lieuById('${lieu.id}'))">
            Voir la fiche →
          </button>
        </div>`;

      const marker = L.marker([lieu.latitude, lieu.longitude], { icon, pane: 'lieuxPane' });
      marker.bindPopup(popupHtml, { maxWidth: 280, minWidth: 220, className: 'lmp-wrapper' });
      marker.bindTooltip(lieu.nom, { className: 'lieu-tooltip', direction: 'top', offset: [0, -34] });
      marker.addTo(map);
      markersMapRef.current.set(lieu.id, marker);
    });

    return () => { markersMapRef.current.forEach(m => m.remove()); markersMapRef.current.clear(); };
  }, [lieux, clans, selectedClan, mapReady]);

  // ── Navigate to lieu (from drawer list) ──────────────────────────────────
  const handleLieuClick = (lieu) => {
    setSelectedLieu(lieu);
    if (!mapInstanceRef.current || !lieu.latitude) return;
    mapInstanceRef.current.flyTo([lieu.latitude, lieu.longitude], 15, { duration: 0.8 });
    setTimeout(() => {
      markersMapRef.current.forEach(m => m.closePopup());
    }, 100);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const handleClanFilter  = (id) => setSelectedClan(id === selectedClan ? null : id);
  const bourgsVisibles    = selectedClan ? bourgs.filter(b => b.clan_dominant_id === selectedClan) : bourgs;
  const lieuxVisibles     = selectedClan ? lieux.filter(l => l.clan_id === selectedClan) : lieux;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="carte-container">
      {loading ? (
        <div className="loading"><div className="spinner" /><p>Chargement de la carte...</p></div>
      ) : error ? (
        <div className="error"><h2>Erreur</h2><p>{error}</p></div>
      ) : (
        <div className="carte-content">

          <div className="carte-map-wrapper">
            <div ref={mapRef} className="carte-map" style={{ width: '100%', height: '100%', minHeight: '600px' }} />
          </div>

          <div className="carte-sidebar">
            <h2>Les Bourgs de Paris</h2>
            <p style={{ fontStyle: 'italic', color: '#d4af37', marginBottom: '1.5rem' }}>Territoires Vampiriques</p>

            <div className="carte-filters">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Filtrer par Clan</h3>
              <div className="filter-buttons">
                <button className={`filter-btn ${!selectedClan ? 'active' : ''}`} onClick={() => setSelectedClan(null)}>
                  <span className="clan-dot" style={{ background: '#c0c0c0' }} /> Tous
                </button>
                {clans.map(clan => (
                  <button key={clan.id}
                    className={`filter-btn ${selectedClan === clan.id ? 'active' : ''}`}
                    onClick={() => handleClanFilter(clan.id)}>
                    <span className="clan-dot" style={{ background: clan.couleur }} /> {clan.nom}
                  </button>
                ))}
              </div>
            </div>

            <div className="carte-stats">
              <div className="stat-item"><span className="stat-label">Bourgs</span><span className="stat-value">{bourgsVisibles.length}</span></div>
              <div className="stat-item"><span className="stat-label">Lieux</span><span className="stat-value">{lieuxVisibles.length}</span></div>
              <div className="stat-item"><span className="stat-label">Clans</span><span className="stat-value">{clans.length}</span></div>
            </div>

            {selectedBourg && (
              <div className="carte-detail">
                <h2>{selectedBourg.nom}</h2>
                <div className="detail-content">
                  <p><strong>Clan Dominant:</strong>{' '}
                    <span style={{ color: selectedBourg.clan?.couleur }}>{selectedBourg.clan?.nom || 'Indépendant'}</span>
                  </p>
                  {selectedBourg.description?.ambiance && (
                    <p><strong>Ambiance:</strong> {selectedBourg.description.ambiance}</p>
                  )}
                  {selectedBourg.description?.richesse && (
                    <p><strong>Richesse:</strong>{' '}
                      {'★'.repeat(selectedBourg.description.richesse)}
                      {'☆'.repeat(5 - selectedBourg.description.richesse)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Fullscreen Lieu Detail — overlays everything ── */}
      {selectedLieu && (
        <LieuDrawer
          lieu={selectedLieu}
          clans={clans}
          lieux={lieux}
          onClose={() => setSelectedLieu(null)}
          onLieuClick={handleLieuClick}
        />
      )}
    </div>
  );
};

export default Carte;
