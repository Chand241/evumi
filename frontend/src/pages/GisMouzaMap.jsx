import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Search, Layers, ShieldCheck, AlertTriangle,
  Info, ExternalLink, RefreshCw, ZoomIn, ZoomOut, CheckCircle,
  Sliders, Printer, Share2, Compass, Eye, Filter, FileText, ChevronRight
} from 'lucide-react';

export default function GisMouzaMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Filter States
  const [division, setDivision] = useState('রাজশাহী');
  const [district, setDistrict] = useState('বগুড়া');
  const [upazila, setUpazila] = useState('শিবগঞ্জ');
  const [mouzas, setMouzas] = useState([]);
  const [selectedMouza, setSelectedMouza] = useState(searchParams.get('mouza') || 'গুজিয়া');
  const [searchDag, setSearchDag] = useState(searchParams.get('dag_no') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availableDags, setAvailableDags] = useState([]);

  // Map Display States
  const [tileLayerType, setTileLayerType] = useState('satellite'); // 'satellite', 'cadastral', 'osm'
  const [plotOpacity, setPlotOpacity] = useState(0.45);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedGps, setCopiedGps] = useState(false);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map centered at Shibganj Upazila, Bogura
      const map = L.map(mapContainerRef.current, {
        center: [24.9982, 89.3320],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // Zoom Control Top-Right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Scale Bar (meters / km) for real cadastral survey feel
      L.control.scale({ position: 'bottomleft', imperial: false, metric: true }).addTo(map);

      // Initial Esri World Imagery (High-Res Satellite)
      const initialLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);

      tileLayerRef.current = initialLayer;
      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Basemap Layer Switcher
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (tileLayerType === 'satellite') {
      // High-Resolution Satellite Imagery with clear field ail & ponds
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);
    } else if (tileLayerType === 'cadastral') {
      // Cadastral Survey Blueprint style (Clean light topographic survey)
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(map);
    } else {
      // Standard OpenStreetMap
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      ).addTo(map);
    }
  }, [tileLayerType]);

  // Load Filter Options & Mouzas
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get('/api/gis/filter-options');
        if (res.data.success) {
          setMouzas(res.data.mouzas || []);
          setAvailableDags(res.data.dag_numbers || []);
        }
      } catch (err) {
        console.error('Filter options error:', err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch and Render Cadastral Plots
  const fetchAndRenderPlots = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedMouza) params.mouza = selectedMouza;
      if (searchDag) params.dag_no = searchDag;
      if (statusFilter !== 'all') params.signal_filter = statusFilter;

      const res = await axios.get('/api/gis/plots', { params });
      const geojsonData = res.data;

      if (mapInstanceRef.current && geojsonData && geojsonData.features) {
        const map = mapInstanceRef.current;

        // Clear existing plot polygons
        if (geojsonLayerRef.current) {
          map.removeLayer(geojsonLayerRef.current);
        }
        // Clear existing plot number markers
        if (markersGroupRef.current) {
          markersGroupRef.current.clearLayers();
        }

        // Add GeoJSON Cadastral Polygon Layer
        const layer = L.geoJSON(geojsonData, {
          style: (feature) => {
            const isSelected = selectedPlot && selectedPlot.dag_no === feature.properties.dag_no;
            return {
              color: isSelected ? '#3b82f6' : (feature.properties.color || '#16a34a'),
              weight: isSelected ? 4 : 2.5,
              opacity: 0.95,
              fillColor: isSelected ? '#60a5fa' : (feature.properties.color || '#16a34a'),
              fillOpacity: isSelected ? 0.75 : plotOpacity,
              dashArray: feature.properties.signal === 'danger' ? '4, 4' : null,
            };
          },
          onEachFeature: (feature, layerItem) => {
            const p = feature.properties;

            // Hover Tooltip with Land Details
            layerItem.bindTooltip(
              `<div style="font-family:'Inter','Hind Siliguri',sans-serif;padding:3px 6px;">
                <div style="font-weight:800;font-size:13px;color:#0f172a;">দাগ নং: ${p.dag_no}</div>
                <div style="font-size:11px;color:#16a34a;font-weight:600;">মৌজা: ${p.mouza} (জেএল ${p.jl_no})</div>
                <div style="font-size:10px;color:#64748b;">শ্রেণি: ${p.land_type} · ${p.area_decimal} শতাংশ</div>
              </div>`,
              { sticky: true, className: 'leaflet-custom-tooltip' }
            );

            // Click Event to Inspect
            layerItem.on('click', () => {
              setSelectedPlot(p);
              if (p.centroid) {
                map.flyTo(p.centroid, 17, { duration: 0.8 });
              }
            });

            // Hover micro-animations
            layerItem.on('mouseover', () => {
              layerItem.setStyle({ weight: 3.8, fillOpacity: 0.7 });
            });
            layerItem.on('mouseout', () => {
              const isSelected = selectedPlot && selectedPlot.dag_no === p.dag_no;
              layerItem.setStyle({
                weight: isSelected ? 4 : 2.5,
                fillOpacity: isSelected ? 0.75 : plotOpacity,
              });
            });

            // Add Permanent Plot Number Stamp on Map (CS/RS Cadastral Map Style)
            if (showLabels && p.centroid) {
              const labelIcon = L.divIcon({
                className: 'cadastral-plot-label',
                html: `<div style="
                  background: rgba(15, 23, 42, 0.85);
                  color: #ffffff;
                  border: 1.5px solid ${p.color};
                  font-size: 11px;
                  font-weight: 800;
                  padding: 2px 6px;
                  border-radius: 6px;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  white-space: nowrap;
                  pointer-events: none;
                  transform: translate(-50%, -50%);
                ">দাগ ${p.dag_no}</div>`,
                iconSize: [40, 20],
              });
              L.marker(p.centroid, { icon: labelIcon, interactive: false }).addTo(markersGroupRef.current);
            }
          },
        }).addTo(map);

        geojsonLayerRef.current = layer;

        // Auto fly to searched Dag or Mouza bounds
        if (searchDag && geojsonData.features.length > 0) {
          const matched = geojsonData.features.find(f => f.properties.dag_no === searchDag);
          if (matched) {
            setSelectedPlot(matched.properties);
            if (matched.properties.centroid) {
              map.flyTo(matched.properties.centroid, 17, { duration: 1 });
            }
          }
        } else if (geojsonData.features.length > 0 && selectedMouza) {
          map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1 });
        }
      }
    } catch (err) {
      console.error('Plots fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndRenderPlots();
  }, [selectedMouza, statusFilter, showLabels, plotOpacity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAndRenderPlots();
  };

  const handleResetFilters = () => {
    setSelectedMouza('গুজিয়া');
    setSearchDag('');
    setStatusFilter('all');
    setSelectedPlot(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([24.9982, 89.3320], 16, { duration: 1 });
    }
  };

  const handleCopyGps = (centroid) => {
    if (!centroid) return;
    const text = `${centroid[0].toFixed(5)}, ${centroid[1].toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2000);
  };

  return (
    <div style={{
      fontFamily: "'Inter','Hind Siliguri',sans-serif",
      minHeight: 'calc(100vh - 64px)',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* ══════════════════════════════════════════
          TOP CADASTRAL FILTER BAR (Real & Interactive)
      ══════════════════════════════════════════ */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1.5px solid #e2e8f0',
        padding: '12px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
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
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
              flexShrink: 0,
            }}>
              🗺️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                  ডিজিটাল মৌজা ক্যাডাস্ট্রাল ম্যাপ (GIS)
                </h1>
                <span style={{
                  background: '#ecfdf5', color: '#15803d', border: '1px solid #bbf7d0',
                  fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px',
                }}>
                  CS/RS নকশা লাইভ
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                রাজশাহী বিভাগ · বগুড়া জেলা · শিবগঞ্জ উপজেলা মডেল
              </div>
            </div>
          </div>

          {/* Filtering Controls Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Mouza Cascading Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>মৌজা:</span>
              <select
                value={selectedMouza}
                onChange={(e) => {
                  setSelectedMouza(e.target.value);
                  setSearchDag('');
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #16a34a',
                  background: '#f0fdf4',
                  fontSize: '13px',
                  color: '#15803d',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {mouzas.map((m, idx) => (
                  <option key={idx} value={m}>
                    মৌজা: {m} (জেএল {idx + 1})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Dag Search with Autocomplete */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="দাগ নং (উদা: ১০১)..."
                value={searchDag}
                onChange={(e) => setSearchDag(e.target.value)}
                style={{
                  padding: '7px 12px 7px 30px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  width: '140px',
                  background: '#ffffff',
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '9px', top: '10px', color: '#94a3b8' }} />
            </div>

            {/* Status Traffic Light Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                color: '#334155',
                fontWeight: '600',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <option value="all">সকল জমি (All Status)</option>
              <option value="safe">🟢 নির্ভেজাল সক্রিয় (Safe)</option>
              <option value="warning">🟡 নামজারি চলমান (Lock)</option>
              <option value="danger">🔴 খাস / মামলাভুক্ত (Disputed)</option>
            </select>

            {/* Action Buttons */}
            <button
              type="submit"
              style={{
                padding: '7px 14px',
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
                boxShadow: '0 2px 6px rgba(22,163,74,0.25)',
              }}
            >
              <Search size={14} /> খুঁজুন
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              title="রিসেট করুন"
              style={{
                padding: '7px 10px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              <RefreshCw size={13} />
            </button>
          </form>
        </div>
      </header>

      {/* ── Main Map Viewport ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} style={{ width: '100%', height: 'calc(100vh - 128px)', zIndex: 1 }} />

        {/* ── Realistic Cadastral Controls Panel (Top-Left) ── */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1.5px solid #cbd5e1',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          zIndex: 400,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '280px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Layers size={13} color="#16a34a" /> ম্যাপ টাইপ ও অপটিমাইজেশন
          </div>

          {/* Map Layer Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setTileLayerType('satellite')}
              style={{
                padding: '5px',
                borderRadius: '6px',
                border: tileLayerType === 'satellite' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                background: tileLayerType === 'satellite' ? '#ecfdf5' : '#ffffff',
                color: tileLayerType === 'satellite' ? '#15803d' : '#334155',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              🛰️ স্যাটেলাইট
            </button>
            <button
              type="button"
              onClick={() => setTileLayerType('cadastral')}
              style={{
                padding: '5px',
                borderRadius: '6px',
                border: tileLayerType === 'cadastral' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                background: tileLayerType === 'cadastral' ? '#ecfdf5' : '#ffffff',
                color: tileLayerType === 'cadastral' ? '#15803d' : '#334155',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              📜 নকশা শিট
            </button>
            <button
              type="button"
              onClick={() => setTileLayerType('osm')}
              style={{
                padding: '5px',
                borderRadius: '6px',
                border: tileLayerType === 'osm' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                background: tileLayerType === 'osm' ? '#ecfdf5' : '#ffffff',
                color: tileLayerType === 'osm' ? '#15803d' : '#334155',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              🗺️ রোড ম্যাপ
            </button>
          </div>

          {/* Opacity Slider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', color: '#475569', fontWeight: '600' }}>দাগ ট্রান্সপারেন্সি:</span>
            <input
              type="range"
              min="0.1"
              max="0.85"
              step="0.05"
              value={plotOpacity}
              onChange={(e) => setPlotOpacity(parseFloat(e.target.value))}
              style={{ width: '90px', cursor: 'pointer' }}
            />
          </div>

          {/* Toggle Labels */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            দাগ নম্বর স্ট্যাম্প প্রদর্শন করুন
          </label>
        </div>

        {/* ── Floating Legend Guide (Bottom-Left) ── */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1.5px solid #e2e8f0',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 400,
          backdropFilter: 'blur(8px)',
          fontSize: '11px',
          fontWeight: '600',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
            দাগ কালার কোড ও আইনি স্ট্যাটাস:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#16a34a', display: 'inline-block' }} />
            নিরাপদ নির্ভেজাল জমি (Verified Active)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#d97706', display: 'inline-block' }} />
            নামজারি প্রক্রিয়াধীন (Pending Lock)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#dc2626', display: 'inline-block' }} />
            সরকারি খাস / আদালতের মামলাভুক্ত (Disputed)
          </div>
        </div>

        {/* ── Selected Plot Cadastral Inspector (Right Floating Card) ── */}
        {selectedPlot && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            background: 'rgba(255, 255, 255, 0.98)',
            border: `2.5px solid ${selectedPlot.color || '#16a34a'}`,
            borderRadius: '18px',
            padding: '22px 20px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
            zIndex: 450,
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease',
            maxHeight: 'calc(100vh - 160px)',
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: selectedPlot.color,
                  background: `${selectedPlot.color}15`,
                  border: `1.5px solid ${selectedPlot.color}50`,
                  padding: '2px 9px',
                  borderRadius: '999px',
                }}>
                  {selectedPlot.statusLabel}
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '8px 0 0' }}>
                  দাগ নং: {selectedPlot.dag_no}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* Cadastral Land Attributes */}
            <div style={{ fontSize: '13px', display: 'grid', gap: '9px', marginBottom: '18px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>মৌজা ও জেএল:</span>
                <strong style={{ color: '#0f172a' }}>{selectedPlot.mouza} (জেএল {selectedPlot.jl_no})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>নকশা শিট নং:</span>
                <strong style={{ color: '#0f172a' }}>শিট নং {selectedPlot.sheet_no}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>খতিয়ান নং:</span>
                <strong style={{ color: '#0f172a' }}>{selectedPlot.khatian_no}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>জমির শ্রেণি:</span>
                <strong style={{ color: '#16a34a' }}>{selectedPlot.land_type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>জমির পরিমাণ:</span>
                <strong style={{ color: '#047857' }}>
                  {selectedPlot.area_decimal} শতাংশ ({selectedPlot.area_katha} কাঠা)
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>মালিকের নাম:</span>
                <strong style={{ color: '#0f172a' }}>{selectedPlot.owner_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: '500' }}>দলিল ও ভলিউম:</span>
                <span style={{ fontSize: '11px', color: '#334155', fontWeight: '700' }}>
                  {selectedPlot.deed_no} · {selectedPlot.volume_book}
                </span>
              </div>
            </div>

            {/* Legal Warning Notice (If Khas or Stay Order) */}
            {selectedPlot.signal === 'danger' && (
              <div style={{
                background: '#fee2e2',
                border: '1.5px solid #fca5a5',
                color: '#b91c1c',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '11px',
                fontWeight: '700',
                marginBottom: '14px',
                display: 'flex',
                gap: '8px',
                lineHeight: 1.5,
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{selectedPlot.legal_details || 'সতর্কতা: এই জমিটি ক্রয়-বিক্রয়ে আইনগত নিষেধাজ্ঞা রয়েছে!'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                onClick={() => navigate(`/verify?mouza=${encodeURIComponent(selectedPlot.mouza)}&dag_no=${selectedPlot.dag_no}&khatian_no=${selectedPlot.khatian_no}`)}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: 'linear-gradient(135deg, #1a6b3c, #16a34a)',
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
                  boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
                }}
              >
                <CheckCircle size={15} /> P5 পূর্ণাঙ্গ খতিয়ান ও দলিল যাচাই
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Printer size={13} /> নকশা প্রিন্ট
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyGps(selectedPlot.centroid)}
                  style={{
                    padding: '8px',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Share2 size={13} /> {copiedGps ? '✓ কপি হয়েছে' : 'GPS কপি'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
