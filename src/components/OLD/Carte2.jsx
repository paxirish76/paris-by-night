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
    // Fonction pour extraire le JSON d'un fichier JS
    const extractJSON = (text) => {
      const start = text.indexOf('{');
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = start; i < text.length; i++) {
        const char = text[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              return text.substring(start, i + 1);
            }
          }
        }
      }
      return '{}';
    };

    const loadGeoJSON = async () => {
      try {
        // Récupérer les URLs publiques des fichiers GeoJSON
        const { data: parisUrl } = supabase.storage
          .from('geojson')
          .getPublicUrl('paris_geojson.js');

        const { data: idfUrl } = supabase.storage
          .from('geojson')
          .getPublicUrl('idf_communes_v2.geojson');

        const { data: forestsUrl } = supabase.storage
          .from('geojson')
          .getPublicUrl('forests_paris.js');

        // Charger les fichiers
        const [parisResponse, idfResponse, forestsResponse] = await Promise.all([
          fetch(parisUrl.publicUrl),
          fetch(idfUrl.publicUrl),
          fetch(forestsUrl.publicUrl)
        ]);

        if (!parisResponse.ok || !idfResponse.ok || !forestsResponse.ok) {
          throw new Error('Erreur chargement GeoJSON');
        }

        // Parser les fichiers JavaScript
        const parisText = await parisResponse.text();
        const idfText = await idfResponse.text();
        const forestsText = await forestsResponse.text();

        // Extraire le JSON des fichiers JS
        const parisJson = JSON.parse(extractJSON(parisText));
        const idfJson = JSON.parse(extractJSON(idfText));
        const forestsJson = JSON.parse(extractJSON(forestsText));

        setParisGeoJSON(parisJson);
        setIdfCommunesGeoJSON(idfJson);
        setForestsGeoJSON(forestsJson);
      } catch (err) {
        console.error('Erreur chargement GeoJSON:', err);
        setError(`Erreur chargement carte: ${err.message}`);
      }
    };

    loadGeoJSON();
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
    if (!mapInstanceRef.current || !parisGeoJSON || !idfCommunesGeoJSON || !forestsGeoJSON) return;

    // Supprimer l'ancien layer de contours s'il existe
    if (baseContoursLayerRef.current) {
      mapInstanceRef.current.removeLayer(baseContoursLayerRef.current);
    }

    // Créer un groupe de layers pour tous les contours
    const contoursGroup = L.layerGroup();

    // Style des contours : lignes fines grises
    const contourStyle = {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: '#666666',
      weight: 1,
      opacity: 0.5
    };

    // Ajouter les contours des arrondissements de Paris
    if (parisGeoJSON && parisGeoJSON.features) {
      parisGeoJSON.features.forEach(feature => {
        L.geoJSON(feature, {
          style: contourStyle,
          interactive: false, // Pas d'interaction (hover/click)
          pane: 'contoursPane' // Utiliser le pane pour mettre au-dessus
        }).addTo(contoursGroup);
      });
    }

    // Ajouter les contours des communes
    if (idfCommunesGeoJSON && idfCommunesGeoJSON.features) {
      idfCommunesGeoJSON.features.forEach(feature => {
        L.geoJSON(feature, {
          style: contourStyle,
          interactive: false,
          pane: 'contoursPane'
        }).addTo(contoursGroup);
      });
    }

    // Ajouter les contours des forêts
    if (forestsGeoJSON && forestsGeoJSON.features) {
      forestsGeoJSON.features.forEach(feature => {
        L.geoJSON(feature, {
          style: contourStyle,
          interactive: false,
          pane: 'contoursPane'
        }).addTo(contoursGroup);
      });
    }

    // Ajouter le groupe à la carte
    contoursGroup.addTo(mapInstanceRef.current);
    baseContoursLayerRef.current = contoursGroup;

  }, [parisGeoJSON, idfCommunesGeoJSON, forestsGeoJSON]);

  // Création des polygones et markers
  useEffect(() => {
    if (!mapInstanceRef.current || bourgs.length === 0 || !parisGeoJSON || !idfCommunesGeoJSON || !forestsGeoJSON) return;

    // Nettoyer les anciens layers
    bourgLayersRef.current.forEach(layer => {
      mapInstanceRef.current.removeLayer(layer);
    });
    bourgLayersRef.current = [];

    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Mapper arrondissement → bourg
    const arrToBourg = {};
    bourgs.forEach(bourg => {
      if (bourg.territoire_codes?.arrondissements) {
        bourg.territoire_codes.arrondissements.forEach(arr => {
          arrToBourg[arr] = bourg;
        });
      }
    });

    // Mapper code commune → bourg
    const communeToBourg = {};
    bourgs.forEach(bourg => {
      if (bourg.territoire_codes?.communes) {
        bourg.territoire_codes.communes.forEach(com => {
          communeToBourg[com] = bourg;
        });
      }
    });

   // GROUPER les features par bourg avant de les créer
const featuresByBourg = {};

// Grouper arrondissements de Paris
if (parisGeoJSON && parisGeoJSON.features) {
  parisGeoJSON.features.forEach(feature => {
    const arr = feature.properties.c_ar;
    const bourg = arrToBourg[arr];

    if (bourg && (!selectedClan || bourg.clan_dominant_id === selectedClan)) {
      if (!featuresByBourg[bourg.id]) {
        featuresByBourg[bourg.id] = {
          bourg: bourg,
          features: []
        };
      }
      featuresByBourg[bourg.id].features.push(feature);
    }
  });
}

// Grouper communes
if (idfCommunesGeoJSON && idfCommunesGeoJSON.features) {
  idfCommunesGeoJSON.features.forEach(feature => {
    const comCode = feature.properties.com_code?.[0] || feature.properties.com_code;
    const bourg = communeToBourg[comCode];

    if (bourg && (!selectedClan || bourg.clan_dominant_id === selectedClan)) {
      if (!featuresByBourg[bourg.id]) {
        featuresByBourg[bourg.id] = {
          bourg: bourg,
          features: []
        };
      }
      featuresByBourg[bourg.id].features.push(feature);
    }
  });
}

// Grouper forêts
if (forestsGeoJSON && forestsGeoJSON.features) {
  const forestBourg = bourgs.find(b => b.id === 'forets-peripheriques');
  
  if (forestBourg && (!selectedClan || forestBourg.clan_dominant_id === selectedClan)) {
    if (!featuresByBourg[forestBourg.id]) {
      featuresByBourg[forestBourg.id] = {
        bourg: forestBourg,
        features: []
      };
    }
    featuresByBourg[forestBourg.id].features.push(...forestsGeoJSON.features);
  }
}

// CRÉER les polygones fusionnés par bourg
Object.values(featuresByBourg).forEach(({ bourg, features }) => {
  const couleur = bourg.clan?.couleur || '#8b0000';
  
  // Fusionner les features
  const merged = fusionnerFeatures(features);
  
  if (merged) {
    // Utiliser le polygone fusionné
    const layer = L.geoJSON(merged, {
      style: {
        fillColor: couleur,
        fillOpacity: 0.35,
        color: couleur,
        weight: 3,
        opacity: 1
      },
      pane: 'bourgsPane',
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({
              fillOpacity: 0.6,
              weight: 4
            });
          },
          mouseout: (e) => {
            e.target.setStyle({
              fillOpacity: 0.35,
              weight: 3
            });
          },
          click: () => {
            setSelectedBourg(bourg);
          }
        });

        const ambiance = bourg.description?.ambiance || 'Non spécifié';
        const richesse = bourg.description?.richesse || 0;
        const etoiles = '★'.repeat(richesse) + '☆'.repeat(5 - richesse);

        layer.bindPopup(`
          <div style="font-family: 'Cormorant Garamond', serif; color: #0d0a0b;">
            <h3 style="color: ${couleur}; margin: 0 0 8px 0; font-family: 'Cinzel', serif;">
              ${bourg.nom}
            </h3>
            <p style="margin: 4px 0; color: #333;">
              <strong>Clan:</strong> ${bourg.clan?.nom || 'Indépendant'}
            </p>
            <p style="margin: 4px 0; color: #333;">
              <strong>Richesse:</strong> ${etoiles}
            </p>
            <p style="margin: 4px 0; font-style: italic; color: #555;">
              ${ambiance}
            </p>
          </div>
        `);
      }
    }).addTo(mapInstanceRef.current);

    bourgLayersRef.current.push(layer);
  } else {
    // Fallback : afficher les features individuelles si fusion échoue
    console.warn(`Fusion échouée pour ${bourg.nom}, affichage des polygones individuels`);
    features.forEach(feature => {
      const layer = L.geoJSON(feature, {
        style: {
          fillColor: couleur,
          fillOpacity: 0.35,
          color: couleur,
          weight: 3,
          opacity: 1
        },
        pane: 'bourgsPane'
      }).addTo(mapInstanceRef.current);
      bourgLayersRef.current.push(layer);
    });
  }
});

    // Créer les markers pour les lieux
    lieux.forEach(lieu => {
      if (!lieu.coordinates?.lat || !lieu.coordinates?.lng) return;

      let markerColor = '#8b0000';
      if (lieu.statut === 'Elysium Souverain') {
        markerColor = '#dc143c';
      } else if (lieu.statut === 'Elysium Prestige') {
        markerColor = '#d4af37';
      }

      const lieuBourg = bourgs.find(b => b.id === lieu.bourg_id);
      if (selectedClan && lieuBourg && lieuBourg.clan_dominant_id !== selectedClan) {
        return;
      }

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 12px;
            height: 12px;
            background: ${markerColor};
            border: 2px solid #fff;
            border-radius: 50%;
            box-shadow: 0 0 8px ${markerColor}, 0 0 16px ${markerColor}40;
          "></div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const marker = L.marker([lieu.coordinates.lat, lieu.coordinates.lng], {
        icon: customIcon
      });

      marker.bindPopup(`
        <div style="font-family: 'Cormorant Garamond', serif; color: #0d0a0b;">
          <h4 style="color: ${markerColor}; margin: 0 0 6px 0; font-family: 'Cinzel', serif;">
            ${lieu.nom}
          </h4>
          <p style="margin: 4px 0; color: #333;">
            <strong>Type:</strong> ${lieu.statut || 'Lieu'}
          </p>
          ${lieu.bourg?.nom ? `<p style="margin: 4px 0; color: #333;"><strong>Bourg:</strong> ${lieu.bourg.nom}</p>` : ''}
          ${lieu.description?.ambiance ? `<p style="margin: 4px 0; font-style: italic; color: #555;">${lieu.description.ambiance}</p>` : ''}
        </div>
      `);

      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    });

  }, [bourgs, lieux, selectedClan, parisGeoJSON, idfCommunesGeoJSON, forestsGeoJSON]);

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
