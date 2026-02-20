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
const Carte = () => {
  // États
  const [bourgs, setBourgs] = useState([]);
  const [lieux, setLieux] = useState([]);
  const [clans, setClans] = useState([]);
  const [selectedBourg, setSelectedBourg] = useState(null);
  const [selectedClan, setSelectedClan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contoursGeoJSON, setContoursGeoJSON] = useState(null);  // 193 polygones
  const [bourgsFusionnesGeoJSON, setBourgsFusionnesGeoJSON] = useState(null);  // 19 bourgs

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
      // Charger les contours détaillés (193 polygones)
      const contoursResponse = await fetch(
        'https://jjmiaoodkuwmbrplskif.supabase.co/storage/v1/object/public/geojson/idf_complet_avec_bourg_id.geojson'
      );
      const contoursData = await contoursResponse.json();
      setContoursGeoJSON(contoursData);

      // Charger les bourgs fusionnés (19 polygones)
      const bourgsResponse = await fetch(
        'https://jjmiaoodkuwmbrplskif.supabase.co/storage/v1/object/public/geojson/idf_complet_bourgs.json'
      );
      const bourgsData = await bourgsResponse.json();
      setBourgsFusionnesGeoJSON(bourgsData);

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement GeoJSON:', error);
      setLoading(false);
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
    if (loading || !mapRef.current || mapInstanceRef.current) return;

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

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading]);

  // Création du layer de contours (toujours visible)
  useEffect(() => {
  if (!mapInstanceRef.current || !contoursGeoJSON) return;

  const map = mapInstanceRef.current;

  // Nettoyer l'ancien layer de contours si existe
  if (baseContoursLayerRef.current) {
    map.removeLayer(baseContoursLayerRef.current);
  }

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

}, [contoursGeoJSON]);

  // Création des polygones et markers
useEffect(() => {
  if (!mapInstanceRef.current || !bourgs.length || !bourgsFusionnesGeoJSON || !clans.length) return;

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

}, [bourgs, bourgsFusionnesGeoJSON, clans, selectedClan]);


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
            <div ref={mapRef} className="carte-map"></div>
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
