const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');
const LegalStatus = require('../models/LegalStatus');
const { SHIBGANJ_MOUZAS } = require('../utils/geoData');

// Shibganj Upazila Center: 24.9961° N, 89.3323° E
const SHIBGANJ_CENTER = { lat: 24.9961, lng: 89.3323 };

// Comprehensive Cadastral Plot Geometries for Pilot Mouzas in Shibganj, Bogura
// Styled as authentic land parcels with irregular survey bounds
const PILOT_PLOTS_GEOJSON = [
  // ── গুজিয়া মৌজা (JL No: 1) ───────────────────────────────────
  {
    dag_no: '101',
    mouza: 'গুজিয়া',
    jl_no: '1',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [24.9972, 89.3275],
      [24.9988, 89.3302],
      [24.9976, 89.3318],
      [24.9960, 89.3290],
      [24.9972, 89.3275]
    ],
    centroid: [24.9974, 89.3296]
  },
  {
    dag_no: '102',
    mouza: 'গুজিয়া',
    jl_no: '1',
    sheet_no: '১',
    land_type: 'ভিটা (বসতবাড়ি)',
    coordinates: [
      [24.9988, 89.3302],
      [25.0004, 89.3328],
      [24.9990, 89.3342],
      [24.9976, 89.3318],
      [24.9988, 89.3302]
    ],
    centroid: [24.9990, 89.3322]
  },
  {
    dag_no: '103',
    mouza: 'গুজিয়া',
    jl_no: '1',
    sheet_no: '১',
    land_type: 'পুকুর (জলাশয়)',
    coordinates: [
      [24.9960, 89.3290],
      [24.9976, 89.3318],
      [24.9965, 89.3332],
      [24.9950, 89.3305],
      [24.9960, 89.3290]
    ],
    centroid: [24.9963, 89.3311]
  },
  {
    dag_no: '104',
    mouza: 'গুজিয়া',
    jl_no: '1',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [25.0004, 89.3328],
      [25.0020, 89.3355],
      [25.0006, 89.3370],
      [24.9990, 89.3342],
      [25.0004, 89.3328]
    ],
    centroid: [25.0005, 89.3349]
  },
  {
    dag_no: '105',
    mouza: 'গুজিয়া',
    jl_no: '1',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [24.9976, 89.3318],
      [24.9990, 89.3342],
      [24.9978, 89.3358],
      [24.9965, 89.3332],
      [24.9976, 89.3318]
    ],
    centroid: [24.9977, 89.3337]
  },

  // ── অনন্তবালা মৌজা (JL No: 2) ──────────────────────────────
  {
    dag_no: '205',
    mouza: 'অনন্তবালা',
    jl_no: '2',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [24.9940, 89.3350],
      [24.9958, 89.3378],
      [24.9942, 89.3396],
      [24.9925, 89.3368],
      [24.9940, 89.3350]
    ],
    centroid: [24.9941, 89.3373]
  },
  {
    dag_no: '206',
    mouza: 'অনন্তবালা',
    jl_no: '2',
    sheet_no: '১',
    land_type: 'ভিটা (বসতবাড়ি)',
    coordinates: [
      [24.9958, 89.3378],
      [24.9975, 89.3408],
      [24.9958, 89.3425],
      [24.9942, 89.3396],
      [24.9958, 89.3378]
    ],
    centroid: [24.9958, 89.3402]
  },
  {
    dag_no: '207',
    mouza: 'অনন্তবালা',
    jl_no: '2',
    sheet_no: '১',
    land_type: 'পুকুর (জলাশয়)',
    coordinates: [
      [24.9925, 89.3368],
      [24.9942, 89.3396],
      [24.9928, 89.3412],
      [24.9912, 89.3384],
      [24.9925, 89.3368]
    ],
    centroid: [24.9927, 89.3390]
  },

  // ── চক অনন্তবালা মৌজা (JL No: 3) ───────────────────────────
  {
    dag_no: '310',
    mouza: 'চক অনন্তবালা',
    jl_no: '3',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [24.9910, 89.3305],
      [24.9928, 89.3332],
      [24.9912, 89.3350],
      [24.9895, 89.3322],
      [24.9910, 89.3305]
    ],
    centroid: [24.9911, 89.3327]
  },
  {
    dag_no: '311',
    mouza: 'চক অনন্তবালা',
    jl_no: '3',
    sheet_no: '১',
    land_type: 'ভিটা (বসতবাড়ি)',
    coordinates: [
      [24.9928, 89.3332],
      [24.9945, 89.3360],
      [24.9930, 89.3375],
      [24.9912, 89.3350],
      [24.9928, 89.3332]
    ],
    centroid: [24.9929, 89.3354]
  },

  // ── কিচক মৌজা (JL No: 4) ───────────────────────────────────
  {
    dag_no: '412',
    mouza: 'কিচক',
    jl_no: '4',
    sheet_no: '১',
    land_type: 'বাণিজ্যিক (বাজার সংলগ্ন)',
    coordinates: [
      [25.0025, 89.3235],
      [25.0045, 89.3268],
      [25.0030, 89.3285],
      [25.0010, 89.3252],
      [25.0025, 89.3235]
    ],
    centroid: [25.0028, 89.3260]
  },
  {
    dag_no: '413',
    mouza: 'কিচক',
    jl_no: '4',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [25.0045, 89.3268],
      [25.0065, 89.3300],
      [25.0050, 89.3316],
      [25.0030, 89.3285],
      [25.0045, 89.3268]
    ],
    centroid: [25.0048, 89.3292]
  },

  // ── বেলাই মৌজা (JL No: 5) ──────────────────────────────────
  {
    dag_no: '501',
    mouza: 'বেলাই',
    jl_no: '5',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [24.9875, 89.3260],
      [24.9895, 89.3290],
      [24.9880, 89.3308],
      [24.9860, 89.3278],
      [24.9875, 89.3260]
    ],
    centroid: [24.9878, 89.3284]
  },

  // ── হরিপুর মৌজা (JL No: 6) ─────────────────────────────────
  {
    dag_no: '602',
    mouza: 'হরিপুর',
    jl_no: '6',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [25.0055, 89.3355],
      [25.0075, 89.3388],
      [25.0060, 89.3405],
      [25.0040, 89.3372],
      [25.0055, 89.3355]
    ],
    centroid: [25.0058, 89.3380]
  },

  // ── চক হরিপুর মৌজা (JL No: 7) ──────────────────────────────
  {
    dag_no: '705',
    mouza: 'চক হরিপুর',
    jl_no: '7',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [25.0075, 89.3410],
      [25.0095, 89.3442],
      [25.0080, 89.3460],
      [25.0060, 89.3428],
      [25.0075, 89.3410]
    ],
    centroid: [25.0078, 89.3435]
  },

  // ── বিশা মৌজা (JL No: 8) ───────────────────────────────────
  {
    dag_no: '801',
    mouza: 'বিশা',
    jl_no: '8',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [24.9835, 89.3325],
      [24.9855, 89.3358],
      [24.9840, 89.3375],
      [24.9820, 89.3342],
      [24.9835, 89.3325]
    ],
    centroid: [24.9838, 89.3350]
  },

  // ── কানাইডাঙ্গা মৌজা (JL No: 9) ─────────────────────────────
  {
    dag_no: '902',
    mouza: 'কানাইডাঙ্গা',
    jl_no: '9',
    sheet_no: '১',
    land_type: 'নাল (ফসলি জমি)',
    coordinates: [
      [24.9805, 89.3385],
      [24.9825, 89.3418],
      [24.9810, 89.3435],
      [24.9790, 89.3402],
      [24.9805, 89.3385]
    ],
    centroid: [24.9808, 89.3410]
  }
];

// Mouza Centers for instant smooth camera flight
const MOUZA_CENTERS = {
  'গুজিয়া': { lat: 24.9982, lng: 89.3320, zoom: 16 },
  'অনন্তবালা': { lat: 24.9945, lng: 89.3385, zoom: 16 },
  'চক অনন্তবালা': { lat: 24.9920, lng: 89.3340, zoom: 16 },
  'কিচক': { lat: 25.0038, lng: 89.3275, zoom: 16 },
  'বেলাই': { lat: 24.9878, lng: 89.3284, zoom: 16 },
  'হরিপুর': { lat: 25.0058, lng: 89.3380, zoom: 16 },
  'চক হরিপুর': { lat: 25.0078, lng: 89.3435, zoom: 16 },
  'বিশা': { lat: 24.9838, lng: 89.3350, zoom: 16 },
  'কানাইডাঙ্গা': { lat: 24.9808, lng: 89.3410, zoom: 16 }
};

// GET /api/gis/overview
// Returns hierarchy, centers, and statistics
router.get('/overview', async (req, res) => {
  try {
    const totalRecords = await LandRecord.countDocuments({});
    return res.status(200).json({
      success: true,
      data: {
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        center: SHIBGANJ_CENTER,
        zoom: 14,
        mouza_centers: MOUZA_CENTERS,
        mouzas: SHIBGANJ_MOUZAS.slice(0, 9),
        total_plots: PILOT_PLOTS_GEOJSON.length,
        total_records: totalRecords
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'GIS তথ্য লোড করা যায়নি।' });
  }
});

// GET /api/gis/filter-options
// Provides active dropdown options for cascading filters
router.get('/filter-options', async (req, res) => {
  try {
    const mouzaList = SHIBGANJ_MOUZAS.slice(0, 9).map(m => m.mouza);
    const dags = [...new Set(PILOT_PLOTS_GEOJSON.map(p => p.dag_no))];
    const landTypes = [...new Set(PILOT_PLOTS_GEOJSON.map(p => p.land_type))];

    return res.status(200).json({
      success: true,
      divisions: ['রাজশাহী', 'ঢাকা', 'চট্টগ্রাম', 'খুলনা'],
      districts: ['বগুড়া', 'রাজশাহী', 'পাবনা'],
      upazilas: ['শিবগঞ্জ', 'বগুড়া সদর', 'শেরপুর'],
      mouzas: mouzaList,
      dag_numbers: dags,
      land_types: landTypes
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'ফিল্টার অপশন লোড করা যায়নি।' });
  }
});

// GET /api/gis/plots
// Returns GeoJSON enriched with LandRecord & LegalStatus
router.get('/plots', async (req, res) => {
  try {
    const { mouza, dag_no, land_type, signal_filter } = req.query;

    let filteredPlots = PILOT_PLOTS_GEOJSON;

    if (mouza && mouza.trim()) {
      filteredPlots = filteredPlots.filter(p => p.mouza.trim().toLowerCase() === mouza.trim().toLowerCase());
    }
    if (dag_no && dag_no.trim()) {
      filteredPlots = filteredPlots.filter(p => p.dag_no.trim() === dag_no.trim());
    }
    if (land_type && land_type.trim()) {
      filteredPlots = filteredPlots.filter(p => p.land_type.includes(land_type.trim()));
    }

    // Fetch database records & legal statuses for these plots
    const dagNumbers = filteredPlots.map(p => p.dag_no);
    const [records, legalStatuses] = await Promise.all([
      LandRecord.find({ dag_no: { $in: dagNumbers } }),
      LegalStatus.find({ dag_no: { $in: dagNumbers } })
    ]);

    const recordsMap = new Map(records.map(r => [r.dag_no, r]));
    const legalMap = new Map(legalStatuses.map(l => [l.dag_no, l]));

    // Construct GeoJSON FeatureCollection
    const features = [];

    for (const plot of filteredPlots) {
      const rec = recordsMap.get(plot.dag_no);
      const legal = legalMap.get(plot.dag_no);

      // Determine signal status & color
      let signal = 'safe';
      let statusLabel = 'নিরাপদ ও সক্রিয়';
      let color = '#16a34a'; // Green

      if (legal && (legal.is_khas || legal.has_court_case || legal.stay_order)) {
        signal = 'danger';
        color = '#dc2626'; // Red
        statusLabel = legal.is_khas ? 'সরকারি খাস জমি' : 'মামলা / স্থগিতাদেশ';
      } else if (rec && rec.status === 'Pending_Mutation') {
        signal = 'warning';
        color = '#d97706'; // Amber
        statusLabel = 'নামজারি প্রক্রিয়াধীন (লক)';
      }

      // Filter by signal if requested
      if (signal_filter && signal_filter !== 'all' && signal !== signal_filter) {
        continue;
      }

      const areaDecimal = rec ? rec.total_area_decimal : 18;
      // 1 Decimal (শতাংশ) = 0.605 Katha (কাঠা) approx
      const areaKatha = (areaDecimal * 0.605).toFixed(2);

      features.push({
        type: 'Feature',
        properties: {
          dag_no: plot.dag_no,
          mouza: plot.mouza,
          jl_no: plot.jl_no,
          sheet_no: plot.sheet_no || '১',
          land_type: plot.land_type,
          centroid: plot.centroid,
          signal,
          color,
          statusLabel,
          owner_name: rec ? rec.owner_name : 'মো. সরকারি রেকর্ডভুক্ত',
          owner_nid: rec ? (rec.owner_nid ? rec.owner_nid.substring(0, 6) + '*****' : 'N/A') : 'N/A',
          khatian_no: rec ? rec.khatian_no : (Number(plot.dag_no) % 50 + 10).toString(),
          area_decimal: areaDecimal,
          area_katha: areaKatha,
          status: rec ? rec.status : 'Active',
          volume_book: rec ? rec.volume_book : 'VOL-SHIB-2026',
          deed_no: rec ? rec.deed_no : `DEED-SG-${plot.dag_no}`,
          deed_hash: rec ? rec.deed_hash : 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          legal_details: legal ? (legal.case_details || legal.khas_reason || 'আদালতের নোটিশ জারি') : null
        },
        geometry: {
          type: 'Polygon',
          coordinates: [plot.coordinates.map(([lat, lng]) => [lng, lat])] // GeoJSON requires [lng, lat]
        }
      });
    }

    return res.status(200).json({
      type: 'FeatureCollection',
      features,
      count: features.length,
      center: MOUZA_CENTERS[mouza] ? [MOUZA_CENTERS[mouza].lat, MOUZA_CENTERS[mouza].lng] : [SHIBGANJ_CENTER.lat, SHIBGANJ_CENTER.lng]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'ক্যাডাস্ট্রাল ম্যাপ লোড করা যায়নি।' });
  }
});

module.exports = router;
