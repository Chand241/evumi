const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');
const LegalStatus = require('../models/LegalStatus');
const { SHIBGANJ_MOUZAS } = require('../utils/geoData');

// Shibganj Upazila Center: 24.9961° N, 89.3323° E
const SHIBGANJ_CENTER = { lat: 24.9961, lng: 89.3323 };

// Pre-calculated GIS cadastral plot geometries for pilot mouzas in Shibganj
const PILOT_PLOTS_GEOJSON = [
  {
    dag_no: '101',
    mouza: 'গুজিয়া',
    jl_no: '1',
    coordinates: [
      [24.9982, 89.3285],
      [24.9995, 89.3312],
      [24.9980, 89.3325],
      [24.9968, 89.3298],
      [24.9982, 89.3285]
    ],
    centroid: [24.9981, 89.3305]
  },
  {
    dag_no: '102',
    mouza: 'গুজিয়া',
    jl_no: '1',
    coordinates: [
      [24.9995, 89.3312],
      [25.0008, 89.3338],
      [24.9992, 89.3350],
      [24.9980, 89.3325],
      [24.9995, 89.3312]
    ],
    centroid: [24.9994, 89.3331]
  },
  {
    dag_no: '205',
    mouza: 'অনন্তবালা',
    jl_no: '2',
    coordinates: [
      [24.9945, 89.3355],
      [24.9960, 89.3382],
      [24.9942, 89.3398],
      [24.9928, 89.3370],
      [24.9945, 89.3355]
    ],
    centroid: [24.9944, 89.3376]
  },
  {
    dag_no: '206',
    mouza: 'অনন্তবালা',
    jl_no: '2',
    coordinates: [
      [24.9960, 89.3382],
      [24.9975, 89.3410],
      [24.9958, 89.3425],
      [24.9942, 89.3398],
      [24.9960, 89.3382]
    ],
    centroid: [24.9959, 89.3404]
  },
  {
    dag_no: '310',
    mouza: 'চক অনন্তবালা',
    jl_no: '3',
    coordinates: [
      [24.9915, 89.3310],
      [24.9930, 89.3335],
      [24.9912, 89.3352],
      [24.9898, 89.3325],
      [24.9915, 89.3310]
    ],
    centroid: [24.9914, 89.3330]
  },
  {
    dag_no: '412',
    mouza: 'কিচক',
    jl_no: '4',
    coordinates: [
      [25.0030, 89.3240],
      [25.0048, 89.3270],
      [25.0032, 89.3288],
      [25.0015, 89.3258],
      [25.0030, 89.3240]
    ],
    centroid: [25.0031, 89.3264]
  },
  {
    dag_no: '501',
    mouza: 'বেলাই',
    jl_no: '5',
    coordinates: [
      [24.9880, 89.3265],
      [24.9898, 89.3292],
      [24.9882, 89.3310],
      [24.9865, 89.3282],
      [24.9880, 89.3265]
    ],
    centroid: [24.9881, 89.3287]
  },
  {
    dag_no: '602',
    mouza: 'হরিপুর',
    jl_no: '6',
    coordinates: [
      [25.0060, 89.3360],
      [25.0078, 89.3390],
      [25.0062, 89.3408],
      [25.0045, 89.3378],
      [25.0060, 89.3360]
    ],
    centroid: [25.0061, 89.3384]
  },
  {
    dag_no: '705',
    mouza: 'চক হরিপুর',
    jl_no: '7',
    coordinates: [
      [25.0080, 89.3415],
      [25.0098, 89.3445],
      [25.0082, 89.3462],
      [25.0065, 89.3432],
      [25.0080, 89.3415]
    ],
    centroid: [25.0081, 89.3438]
  },
  {
    dag_no: '801',
    mouza: 'বিশা',
    jl_no: '8',
    coordinates: [
      [24.9840, 89.3330],
      [24.9858, 89.3360],
      [24.9842, 89.3378],
      [24.9825, 89.3348],
      [24.9840, 89.3330]
    ],
    centroid: [24.9841, 89.3354]
  },
  {
    dag_no: '902',
    mouza: 'কানাইডাঙ্গা',
    jl_no: '9',
    coordinates: [
      [24.9810, 89.3390],
      [24.9828, 89.3420],
      [24.9812, 89.3438],
      [24.9795, 89.3408],
      [24.9810, 89.3390]
    ],
    centroid: [24.9811, 89.3414]
  }
];

// GET /api/gis/overview
// Returns Shibganj center, available pilot mouzas, and summary counts
router.get('/overview', async (req, res) => {
  try {
    const totalRecords = await LandRecord.countDocuments({});
    return res.status(200).json({
      success: true,
      data: {
        upazila: 'শিবগঞ্জ',
        district: 'বগুড়া',
        division: 'রাজশাহী',
        center: SHIBGANJ_CENTER,
        zoom: 14,
        mouzas: SHIBGANJ_MOUZAS.slice(0, 9),
        total_plots: PILOT_PLOTS_GEOJSON.length,
        total_records: totalRecords
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'GIS তথ্য লোড করা যায়নি।' });
  }
});

// GET /api/gis/plots
// Returns GeoJSON features enriched with real-time LandRecord and LegalStatus
router.get('/plots', async (req, res) => {
  try {
    const { mouza, dag_no } = req.query;

    let filteredPlots = PILOT_PLOTS_GEOJSON;
    if (mouza) {
      filteredPlots = filteredPlots.filter(p => p.mouza.toLowerCase().includes(mouza.toLowerCase()));
    }
    if (dag_no) {
      filteredPlots = filteredPlots.filter(p => p.dag_no === dag_no);
    }

    // Fetch live database records & legal statuses for these dags
    const dagNumbers = filteredPlots.map(p => p.dag_no);
    const [records, legalStatuses] = await Promise.all([
      LandRecord.find({ dag_no: { $in: dagNumbers } }),
      LegalStatus.find({ dag_no: { $in: dagNumbers } })
    ]);

    const recordsMap = new Map(records.map(r => [r.dag_no, r]));
    const legalMap = new Map(legalStatuses.map(l => [l.dag_no, l]));

    // Construct GeoJSON FeatureCollection
    const features = filteredPlots.map(plot => {
      const rec = recordsMap.get(plot.dag_no);
      const legal = legalMap.get(plot.dag_no);

      // Determine signal status: Safe (green), Pending Mutation (amber), Legal Issue/Khas (red)
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
        statusLabel = 'নামজারি চলমান (লক)';
      }

      return {
        type: 'Feature',
        properties: {
          dag_no: plot.dag_no,
          mouza: plot.mouza,
          jl_no: plot.jl_no,
          centroid: plot.centroid,
          signal,
          color,
          statusLabel,
          owner_name: rec ? rec.owner_name : 'তথ্য নেই',
          khatian_no: rec ? rec.khatian_no : 'N/A',
          area_decimal: rec ? rec.total_area_decimal : 0,
          status: rec ? rec.status : 'Active',
          deed_no: rec ? rec.deed_no : null,
          legal_details: legal ? (legal.case_details || legal.khas_reason || 'আদালতীয় নোটিশ') : null
        },
        geometry: {
          type: 'Polygon',
          coordinates: [plot.coordinates.map(([lat, lng]) => [lng, lat])] // GeoJSON requires [lng, lat]
        }
      };
    });

    return res.status(200).json({
      type: 'FeatureCollection',
      features,
      center: SHIBGANJ_CENTER
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মৌজা ম্যাপ লোড করা যায়নি।' });
  }
});

module.exports = router;
