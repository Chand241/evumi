import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Search, Layers, ShieldCheck, AlertTriangle,
  Info, ExternalLink, RefreshCw, ZoomIn, ZoomOut, CheckCircle
} from 'lucide-react';

export default function GisMouzaMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geojsonLayerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [mouzas, setMouzas] = useState([]);
  const [selectedMouza, setSelectedMouza] = useState(searchParams.get('mouza') || '');
  const [searchDag, setSearchDag] = useState(searchParams.get('dag_no') || '');
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [tileLayerType, setTileLayerType] = useState('osm'); // 'osm' or 'satellite'
  const tileLayerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Shibganj Upazila Coordinates
      const map = L.map(mapContainerRef.current, {
        center: [24.9961, 89.3323],
        zoom: 14,
        zoomControl: false,
      });

      // Add zoom control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add default tile layer
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | e-ভূমি GIS',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = osmLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Tile Layer switch (Road vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (tileLayerType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics | e-ভূমি স্যাটেলাইট',
          maxZoom: 18,
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | e-ভূমি GIS',
        maxZoom: 19,
      }).addTo(map);
    }
  }, [tileLayerType]);

  // Fetch Mouza list & Plots
  const fetchMapData = async () => {
    setLoading(true);
    try {
      // Fetch overview
      const overviewRes = await axios.get('/api/gis/overview');
      if (overviewRes.data.success) {
        setMouzas(overviewRes.data.data.mouzas || []);
      }

      // Fetch Plots with active filters
      const params = {};
      if (selectedMouza) params.mouza = selectedMouza;
      if (searchDag) params.dag_no = searchDag;

      const plotsRes = await axios.get('/api/gis/plots', { params });
      const geojsonData = plotsRes.data;

      if (mapInstanceRef.current && geojsonData && geojsonData.features) {
        const map = mapInstanceRef.current;

        // Remove existing GeoJSON layer
        if (geojsonLayerRef.current) {
          map.removeLayer(geojsonLayerRef.current);
        }

        // Create new GeoJSON Layer with styles and interactions
        const layer = L.geoJSON(geojsonData, {
          style: (feature) => {
            const isSelected = selectedPlot && selectedPlot.dag_no === feature.properties.dag_no;
            return {
              color: isSelected ? '#2563eb' : (feature.properties.color || '#16a34a'),
              weight: isSelected ? 3.5 : 2,
              opacity: 0.9,
              fillColor: feature.properties.color || '#16a34a',
              fillOpacity: isSelected ? 0.65 : 0.35,
            };
          },
          onEachFeature: (feature, layerItem) => {
            const p = feature.properties;

            // Bind tooltip
            layerItem.bindTooltip(
              `<div style="font-weight:700;font-size:12px;">দাগ নং: ${p.dag_no}</div><div style="font-size:11px;color:#475569;">মৌজা: ${p.mouza} (${p.statusLabel})</div>`,
              { sticky: true, className: 'leaflet-custom-tooltip' }
            );

            // Bind click event
            layerItem.on('click', () => {
              setSelectedPlot(p);
              if (p.centroid) {
                map.flyTo(p.centroid, 16, { duration: 1 });
              }
            });

            // Hover effects
            layerItem.on('mouseover', () => {
              layerItem.setStyle({
                fillOpacity: 0.65,
                weight: 3,
              });
            });
            layerItem.on('mouseout', () => {
              const isSelected = selectedPlot && selectedPlot.dag_no === p.dag_no;
              layerItem.setStyle({
                fillOpacity: isSelected ? 0.65 : 0.35,
                weight: isSelected ? 3.5 : 2,
              });
            });
          },
        }).addTo(map);

        geojsonLayerRef.current = layer;

        // If specific search, auto select and fly
        if (searchDag && geojsonData.features.length > 0) {
          const matched = geojsonData.features.find(f => f.properties.dag_no === searchDag);
          if (matched) {
            setSelectedPlot(matched.properties);
            if (matched.properties.centroid) {
              map.flyTo(matched.properties.centroid, 16, { duration: 1.2 });
            }
          }
        }
      }
    } catch (err) {
      console.error('GIS Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [selectedMouza]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMapData();
  };

  const handleReset = () => {
    setSelectedMouza('');
    setSearchDag('');
    setSelectedPlot(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([24.9961, 89.3323], 14, { duration: 1 });
    }
    setTimeout(fetchMapData, 50);
  };

  return (
    <div style={{
      fontFamily: "'Inter','Hind Siliguri',sans-serif",
      minHeight: 'calc(100vh - 64px)',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Top Header & Filter Toolbar ── */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        zIndex: 500,
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          {/* Title Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#15803d',
            }}>
              🗺️
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                ডিজিটাল মৌজা ও ক্যাডাস্ট্রাল ম্যাপ ভিউয়ার (GIS)
              </h1>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                শিবগঞ্জ উপজেলা, বগুড়া জেলা · প্লট বাউন্ডারি ও রিয়েল-টাইম খতিয়ান ইন্টিগ্রেশন
              </div>
            </div>
          </div>

          {/* Controls Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Mouza Select */}
            <select
              value={selectedMouza}
              onChange={(e) => setSelectedMouza(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '13px',
                color: '#334155',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <option value="">সকল সিড মৌজা (All Mouzas)</option>
              {mouzas.map((m) => (
                <option key={m.jl_no} value={m.mouza}>
                  জেএল {m.jl_no}: {m.mouza}
                </option>
              ))}
            </select>

            {/* Dag Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="দাগ নং (উদা: ১০১)..."
                value={searchDag}
                onChange={(e) => setSearchDag(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  width: '150px',
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
            </div>

            <button
              type="submit"
              style={{
                padding: '8px 14px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              অনুসন্ধান
            </button>

            <button
              type="button"
              onClick={handleReset}
              title="রিসেট"
              style={{
                padding: '8px 10px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              <RefreshCw size={14} />
            </button>

            {/* Layer Switcher Button */}
            <button
              type="button"
              onClick={() => setTileLayerType(t => t === 'osm' ? 'satellite' : 'osm')}
              style={{
                padding: '8px 12px',
                background: tileLayerType === 'satellite' ? '#0f172a' : '#ffffff',
                color: tileLayerType === 'satellite' ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Layers size={14} /> {tileLayerType === 'satellite' ? '🛰️ স্যাটেলাইট সক্রিয়' : '🗺️ রোড ম্যাপ'}
            </button>
          </form>
        </div>
      </header>

      {/* ── Main Map View Area ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} style={{ width: '100%', height: 'calc(100vh - 130px)', zIndex: 1 }} />

        {/* Floating Legend Badge */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '20px',
          background: 'rgba(255, 255, 255, 0.94)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          zIndex: 400,
          backdropFilter: 'blur(8px)',
          fontSize: '11px',
          fontWeight: '600',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
            দাগ নির্দেশিকা (Legend):
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            নিরাপদ সক্রিয় জমি (Verified Active)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
            নামজারি প্রক্রিয়াধীন (Pending Lock)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
            সরকারি খাস / মামলাভুক্ত জমি (Disputed)
          </div>
        </div>

        {/* Selected Plot Details Drawer / Inspector Card */}
        {selectedPlot && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '340px',
            maxWidth: 'calc(100vw - 40px)',
            background: 'rgba(255, 255, 255, 0.96)',
            border: `2px solid ${selectedPlot.color || '#16a34a'}`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
            zIndex: 450,
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  color: selectedPlot.color,
                  background: `${selectedPlot.color}15`,
                  border: `1px solid ${selectedPlot.color}40`,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                }}>
                  {selectedPlot.statusLabel}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '6px 0 0' }}>
                  দাগ নং: {selectedPlot.dag_no}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#475569', display: 'grid', gap: '8px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>মৌজা ও জেএল:</span>
                <strong style={{ color: '#0f172a' }}>{selectedPlot.mouza} (জেএল: {selectedPlot.jl_no})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>খতিয়ান নং:</span>
                <strong style={{ color: '#0f172a' }}>{selectedPlot.khatian_no}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>বর্তমান মালিক:</span>
                <strong style={{ color: '#0f172a' }}>{selectedPlot.owner_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>জমির পরিমাণ:</span>
                <strong style={{ color: '#16a34a' }}>{selectedPlot.area_decimal} শতাংশ</strong>
              </div>
              {selectedPlot.deed_no && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>দলিল নম্বর:</span>
                  <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: '600' }}>{selectedPlot.deed_no}</span>
                </div>
              )}
            </div>

            {/* Warning note if legal issue */}
            {selectedPlot.signal === 'danger' && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11px',
                fontWeight: '600',
                marginBottom: '14px',
                display: 'flex',
                gap: '6px',
              }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{selectedPlot.legal_details || 'সতর্কতা: জমিতে আইনগত বাধা রয়েছে!'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                onClick={() => navigate(`/verify?mouza=${encodeURIComponent(selectedPlot.mouza)}&dag_no=${selectedPlot.dag_no}`)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle size={15} /> P5 পূর্ণাঙ্গ ভেরিফিকেশন দেখুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
