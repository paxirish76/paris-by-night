import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Carte.css';
import { supabase } from '../lib/supabase';
import * as turf from '@turf/turf'; // Pour fusionner les polygones
// Fonction pour fusionner les features d'un bourg
const fusionnerFeatures = (features) => {
  if (features.length === 0) return null;
  if (features.length === 1) return features[0];
  
  try {
    // Fusionner directement les features GeoJSON brutes
    let merged = features[0];
    for (let i = 1; i < features.length; i++) {
      merged = turf.union(merged, features[i]);
    }
    return merged;
  } catch (err) {
    console.error('Erreur fusion:', err);
    return null;
  }
};
// Helper : génère l'icône SVG d'un lieu selon la couleur du clan et le statut
const createLieuIcon = (color, statut) => {
  const s = (statut || '').toLowerCase();

  if (s.includes('elysium')) {
    // Losange pour les Elysiums
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
        <ellipse cx="15" cy="36" rx="5" ry="2" fill="rgba(0,0,0,0.5)"/>
        <line x1="15" y1="24" x2="15" y2="34" stroke="${color}" stroke-width="2"/>
        <polygon points="15,2 28,15 15,24 2,15" fill="${color}" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" opacity="0.95"/>
        <circle cx="15" cy="13" r="2.5" fill="rgba(255,255,255,0.45)"/>
      </svg>`;
  }

  // Épingle gothique par défaut (Havre, etc.)
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 24 34">
      <ellipse cx="12" cy="33" rx="4" ry="1.5" fill="rgba(0,0,0,0.5)"/>
      <line x1="12" y1="22" x2="12" y2="31" stroke="${color}" stroke-width="2"/>
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="#1a1215" stroke-width="1.5" opacity="0.95"/>
      <circle cx="12" cy="12" r="6" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <circle cx="9.5" cy="9.5" r="2" fill="rgba(255,255,255,0.4)"/>
    </svg>`;
};

const Carte = () => {
  // États
  const [bourgs, setBourgs] = useState([]);
  const [lieux, setLieux] = useState([]);
  const [clans, setClans] = useState([]);
  const [selectedBourg, setSelectedBourg] = useState(null);
  const [selectedClan, setSelectedClan] = useState(null);
  const [loading, setLoading] = useState(false);  // false au départ pour init la carte immédiatement
  const [error, setError] = useState(null);
  const [contoursGeoJSON, setContoursGeoJSON] = useState(null);  // 193 polygones
  const [bourgsFusionnesGeoJSON, setBourgsFusionnesGeoJSON] = useState(null);  // 19 bourgs
  const [mapReady, setMapReady] = useState(false);  // Indique si la carte est initialisée

  // Références
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseContoursLayerRef = useRef(null); // Layer de contours (toujours visible)
  const bourgLayersRef = useRef([]);
  const markersRef = useRef([]);

  // Chargement des GeoJSON depuis Supabase Storage
  useEffect(() => {
  const fetchGeoJSON = async () => {
    try {
      console.log('🔄 Chargement des GeoJSON...');
      
      // Charger les contours détaillés (193 polygones)
      const contoursResponse = await fetch(
        'https://jjmiaoodkuwmbrplskif.supabase.co/storage/v1/object/public/geojson/idf_complet_avec_bourg_id.geojson'
      );
      console.log('📦 Contours response status:', contoursResponse.status);
      
      const contoursData = await contoursResponse.json();
      console.log('✅ Contours chargés:', contoursData.features?.length, 'features');
      setContoursGeoJSON(contoursData);

      // Charger les bourgs fusionnés (19 polygones)
      const bourgsResponse = await fetch(
        'https://jjmiaoodkuwmbrplskif.supabase.co/storage/v1/object/public/geojson/idf_complet_bourgs.json'
      );
      console.log('📦 Bourgs response status:', bourgsResponse.status);
      
      const bourgsData = await bourgsResponse.json();
      console.log('✅ Bourgs fusionnés chargés:', bourgsData.features?.length, 'features');
      setBourgsFusionnesGeoJSON(bourgsData);

      // Ne pas mettre loading à false ici - on attend que Supabase soit chargé
    } catch (error) {
      console.error('❌ Erreur chargement GeoJSON:', error);
    }
  };

  fetchGeoJSON();
}, []);

  // Chargement des données Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Charger les clans
        const { data: clansData, error: clansError } = await supabase
          .from('clans')
          .select('*')
          .order('nom');
        if (clansError) throw clansError;
        setClans(clansData || []);

        // Charger les bourgs avec leurs clans
        const { data: bourgsData, error: bourgsError } = await supabase
          .from('bourgs')
          .select(`
            *,
            clan:clans!bourgs_clan_dominant_id_fkey(*)
          `)
          .order('nom');
        if (bourgsError) throw bourgsError;
        setBourgs(bourgsData || []);

        // Charger les lieux
        const { data: lieuxData, error: lieuxError } = await supabase
          .from('lieux')
          .select(`
            *,
            bourg:bourgs!lieux_bourg_id_fkey(nom)
          `)
          .order('nom');
        if (lieuxError) throw lieuxError;
        setLieux(lieuxData || []);

        setError(null);
      } catch (err) {
        console.error('Erreur chargement données:', err);
        setError(`Erreur de chargement: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Initialisation de la carte
  useEffect(() => {
    // Attendre que mapRef soit attaché
    const initMap = () => {
      if (mapInstanceRef.current) {
        console.log('⏭️ Carte déjà créée, skip');
        return;  // Déjà créée
      }

      if (!mapRef.current) {
        console.log('⏳ mapRef pas encore prêt, retry dans 50ms...');
        setTimeout(initMap, 50);
        return;
      }

      console.log('🗺️ Initialisation de la carte...');
      console.log('📦 mapRef.current:', mapRef.current);

      try {
        // Créer la carte centrée sur Paris
        const map = L.map(mapRef.current, {
          center: [48.8566, 2.3522],
          zoom: 11,
          zoomControl: true,
          minZoom: 10,
          maxZoom: 16
        });

        // Fond de carte sombre
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        // Créer des panes personnalisés pour contrôler l'ordre des layers
        // zIndex par défaut: tilePane=200, overlayPane=400, markerPane=600, tooltipPane=650, popupPane=700
        map.createPane('contoursPane');
        map.getPane('contoursPane').style.zIndex = 450; // Au-dessus des polygones colorés (overlayPane=400)
        
        map.createPane('bourgsPane');
        map.getPane('bourgsPane').style.zIndex = 400; // Au niveau standard des overlays

        map.createPane('lieuxPane');
        map.getPane('lieuxPane').style.zIndex = 600; // Au-dessus des contours et bourgs

        mapInstanceRef.current = map;
        
        console.log('✅ Carte initialisée');
        setMapReady(true);  // Signaler que la carte est prête
      } catch (error) {
        console.error('❌ Erreur création carte:', error);
      }
    };

    // Démarrer l'init avec un petit délai
    const timer = setTimeout(initMap, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);  // Tableau vide = s'exécute une seule fois au mount

  // Création du layer de contours (toujours visible)
  useEffect(() => {
  console.log('🎨 useEffect contours - contoursGeoJSON:', !!contoursGeoJSON, 'mapReady:', mapReady);
  
  if (!mapReady || !contoursGeoJSON) return;

  const map = mapInstanceRef.current;

  // Nettoyer l'ancien layer de contours si existe
  if (baseContoursLayerRef.current) {
    map.removeLayer(baseContoursLayerRef.current);
    console.log('🗑️ Ancien layer de contours supprimé');
  }

  console.log('🔧 Création du layer de contours...');
  
  // Créer le layer de contours fins
  const contoursLayer = L.geoJSON(contoursGeoJSON, {
    pane: 'contoursPane',
    style: {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: '#666666',  // Gris
      weight: 1,
      opacity: 0.5
    },
    interactive: false  // Pas d'interactions sur les contours
  });

  contoursLayer.addTo(map);
  baseContoursLayerRef.current = contoursLayer;

  console.log('✅ Layer de contours créé : 193 polygones');
  console.log('📊 Pane contoursPane zIndex:', map.getPane('contoursPane').style.zIndex);

}, [contoursGeoJSON, mapReady]);  // Redéclencher quand la carte est prête

  // Création des polygones et markers
useEffect(() => {
  if (!mapReady || !bourgs.length || !bourgsFusionnesGeoJSON || !clans.length) return;

  const map = mapInstanceRef.current;

  // Nettoyer les anciens layers de bourgs
  bourgLayersRef.current.forEach(layer => map.removeLayer(layer));
  bourgLayersRef.current = [];

  // Créer un objet bourgs pour lookup rapide
  const bourgsMap = {};
  bourgs.forEach(bourg => {
    bourgsMap[bourg.id] = bourg;
  });

  // Créer un objet clans pour lookup
  const clansMap = {};
  clans.forEach(clan => {
    clansMap[clan.id] = clan;
  });

  // Filtrer et afficher les bourgs fusionnés
  bourgsFusionnesGeoJSON.features.forEach(feature => {
    const bourgId = feature.properties.bourg_id;
    const bourg = bourgsMap[bourgId];

    if (!bourg) return;

    // Appliquer le filtre de clan
    if (selectedClan && bourg.clan_dominant_id !== selectedClan) {
      return;  // Skip ce bourg
    }

    // Récupérer la couleur du clan
    const clan = clansMap[bourg.clan_dominant_id];
    const couleur = clan?.couleur || '#cccccc';

    // Créer le layer pour ce bourg fusionné
    const bourgLayer = L.geoJSON(feature, {
      pane: 'bourgsPane',
      style: {
        fillColor: couleur,
        fillOpacity: 0.35,
        color: couleur,
        weight: 3,
        opacity: 1
      },
      onEachFeature: (feature, layer) => {
        // Hover
        layer.on('mouseover', () => {
          layer.setStyle({
            fillOpacity: 0.6,
            weight: 4
          });
        });

        layer.on('mouseout', () => {
          layer.setStyle({
            fillOpacity: 0.35,
            weight: 3
          });
        });

        // Click
        layer.on('click', () => {
          setSelectedBourg(bourg);
        });

        // Popup
        const richesse = '★'.repeat(bourg.description?.richesse || 0);
        const ambiance = bourg.description?.ambiance || 'Non défini';
        
        layer.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: ${couleur};">${bourg.nom}</h3>
            <p style="margin: 4px 0;"><strong>Clan :</strong> ${clan?.nom || 'Inconnu'}</p>
            <p style="margin: 4px 0;"><strong>Richesse :</strong> ${richesse}</p>
            <p style="margin: 4px 0;"><strong>Ambiance :</strong> ${ambiance}</p>
          </div>
        `, {
          maxWidth: 300
        });
      }
    });

    bourgLayer.addTo(map);
    bourgLayersRef.current.push(bourgLayer);
  });

  console.log(`✅ ${bourgLayersRef.current.length} bourgs fusionnés affichés`);

}, [bourgs, bourgsFusionnesGeoJSON, clans, selectedClan, mapReady]);  // Attendre que la carte soit prête

  // Création des markers lieux
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !lieux.length || !clans.length) return;

    const map = mapInstanceRef.current;

    // Nettoyer les anciens markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Lookup rapide clan_id → couleur
    const clansMap = {};
    clans.forEach(clan => { clansMap[clan.id] = clan.couleur || '#d4af37'; });

    // Filtrer selon le clan sélectionné
    const lieuxFiltres = selectedClan
      ? lieux.filter(lieu => lieu.clan_id === selectedClan)
      : lieux;

    lieuxFiltres.forEach(lieu => {
      if (!lieu.latitude || !lieu.longitude) return;

      const clanColor = clansMap[lieu.clan_id] || '#d4af37';
      const iconSvg = createLieuIcon(clanColor, lieu.statut);

      const isElysium = (lieu.statut || '').toLowerCase().includes('elysium');
      const icon = L.divIcon({
        className: 'lieu-marker-icon',
        html: iconSvg,
        iconSize: isElysium ? [30, 38] : [24, 34],
        iconAnchor: isElysium ? [15, 36] : [12, 32],
        popupAnchor: [0, -38],
      });

      // Parser la description JSON
      let desc = {};
      try {
        desc = typeof lieu.description === 'string'
          ? JSON.parse(lieu.description)
          : (lieu.description || {});
      } catch (e) { desc = {}; }

      const popupContent = `
        <div class="lieu-popup">
          <div class="lieu-popup-header" style="border-left: 4px solid ${clanColor}; padding-left: 10px;">
            <h3 class="lieu-popup-nom" style="color: ${clanColor}; margin: 0 0 4px 0;">${lieu.nom}</h3>
            ${lieu.adresse ? `<p class="lieu-popup-adresse">📍 ${lieu.adresse}</p>` : ''}
          </div>
          ${desc.utilite ? `
            <div class="lieu-popup-section">
              <span class="lieu-popup-label">Utilité</span>
              <p>${desc.utilite}</p>
            </div>` : ''}
          ${desc.ambiance ? `
            <div class="lieu-popup-section">
              <span class="lieu-popup-label">Ambiance</span>
              <p>${desc.ambiance}</p>
            </div>` : ''}
          ${desc.securite_occulte ? `
            <div class="lieu-popup-section lieu-popup-securite">
              <span class="lieu-popup-label">🔒 Sécurité occulte</span>
              <p>${desc.securite_occulte}</p>
            </div>` : ''}
          ${desc.gardien_special ? `
            <div class="lieu-popup-section lieu-popup-securite">
              <span class="lieu-popup-label">⚔️ Gardien spécial</span>
              <p>${desc.gardien_special}</p>
            </div>` : ''}
        </div>
      `;

      const marker = L.marker([lieu.latitude, lieu.longitude], {
        icon,
        pane: 'lieuxPane',
      });

      marker.bindPopup(popupContent, {
        maxWidth: 480,
        minWidth: 380,
        className: 'lieu-popup-wrapper',
      });

      marker.bindTooltip(lieu.nom, {
        className: 'lieu-tooltip',
        direction: 'top',
        offset: [0, -34],
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    console.log(`✅ ${markersRef.current.length} markers lieux affichés`);

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [lieux, clans, selectedClan, mapReady]);

  // Gestion du filtre par clan
  const handleClanFilter = (clanId) => {
    setSelectedClan(clanId === selectedClan ? null : clanId);
  };

  // Calcul des statistiques
  const bourgsVisibles = selectedClan 
    ? bourgs.filter(b => b.clan_dominant_id === selectedClan)
    : bourgs;
  
  const lieuxVisibles = selectedClan
    ? lieux.filter(l => {
        const lieuBourg = bourgs.find(b => b.id === l.bourg_id);
        return lieuBourg && lieuBourg.clan_dominant_id === selectedClan;
      })
    : lieux;

  return (
    <div className="carte-container">
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement de la carte...</p>
        </div>
      ) : error ? (
        <div className="error">
          <h2>Erreur</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="carte-content">
          <div className="carte-map-wrapper">
            <div 
              ref={mapRef} 
              className="carte-map"
              style={{ width: '100%', height: '100%', minHeight: '600px' }}
            ></div>
          </div>

          <div className="carte-sidebar">
            <h2>Les Bourgs de Paris</h2>
            <p style={{ fontStyle: 'italic', color: '#d4af37', marginBottom: '1.5rem' }}>
              Territoires Vampiriques
            </p>

            <div className="carte-filters">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Filtrer par Clan</h3>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${!selectedClan ? 'active' : ''}`}
                  onClick={() => setSelectedClan(null)}
                >
                  <span className="clan-dot" style={{ background: '#c0c0c0' }}></span>
                  Tous
                </button>
                {clans.map(clan => (
                  <button
                    key={clan.id}
                    className={`filter-btn ${selectedClan === clan.id ? 'active' : ''}`}
                    onClick={() => handleClanFilter(clan.id)}
                  >
                    <span className="clan-dot" style={{ background: clan.couleur }}></span>
                    {clan.nom}
                  </button>
                ))}
              </div>
            </div>

            <div className="carte-stats">
              <div className="stat-item">
                <span className="stat-label">Bourgs</span>
                <span className="stat-value">{bourgsVisibles.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Lieux</span>
                <span className="stat-value">{lieuxVisibles.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Clans</span>
                <span className="stat-value">{clans.length}</span>
              </div>
            </div>

            {selectedBourg && (
              <div className="carte-detail">
                <h2>{selectedBourg.nom}</h2>
                <div className="detail-content">
                  <p>
                    <strong>Clan Dominant:</strong>{' '}
                    <span style={{ color: selectedBourg.clan?.couleur }}>
                      {selectedBourg.clan?.nom || 'Indépendant'}
                    </span>
                  </p>
                  {selectedBourg.territoire_codes?.arrondissements && (
                    <p>
                      <strong>Arrondissements:</strong>{' '}
                      {selectedBourg.territoire_codes.arrondissements.join(', ')}
                    </p>
                  )}
                  {selectedBourg.territoire_codes?.communes && (
                    <p>
                      <strong>Communes:</strong>{' '}
                      {selectedBourg.territoire_codes.communes.length} commune(s)
                    </p>
                  )}
                  {selectedBourg.territoire_codes?.forests && (
                    <p>
                      <strong>Forêts:</strong>{' '}
                      Bois de Boulogne, Bois de Vincennes
                    </p>
                  )}
                  {selectedBourg.description?.ambiance && (
                    <p>
                      <strong>Ambiance:</strong> {selectedBourg.description.ambiance}
                    </p>
                  )}
                  {selectedBourg.description?.richesse && (
                    <p>
                      <strong>Richesse:</strong>{' '}
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
    </div>
  );
};

export default Carte;
