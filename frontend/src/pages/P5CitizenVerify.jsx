import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, AlertTriangle, CheckCircle, XCircle, Shield, MapPin, RotateCcw, ChevronRight } from 'lucide-react';
import {
  BANGLADESH_DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  getMouzasForUpazila,
  getJlNoForMouza
} from '../utils/geoData';

const SignalLight = ({ signal }) => {
  const configs = {
    safe: {
      emoji: '🟢',
      label: 'নিরাপদ',
      sublabel: 'SAFE TO BUY',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.15)',
      border: 'rgba(34,197,94,0.4)',
      pulse: 'animate-pulse-green',
      icon: <CheckCircle size={48} color="#22c55e" />
    },
    warning: {
      emoji: '🟡',
      label: 'সতর্কতা',
      sublabel: 'CAUTION',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.15)',
      border: 'rgba(245,158,11,0.4)',
      pulse: '',
      icon: <AlertTriangle size={48} color="#f59e0b" />
    },
    danger: {
      emoji: '🔴',
      label: 'বিপদজনক',
      sublabel: 'DO NOT BUY',
      color: '#dc2626',
      bg: 'rgba(220,38,38,0.15)',
      border: 'rgba(220,38,38,0.4)',
      pulse: 'animate-pulse-red',
      icon: <XCircle size={48} color="#dc2626" />
    },
  };
  const c = configs[signal] || configs.warning;

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      padding: '24px 36px',
      background: c.bg,
      border: `2px solid ${c.border}`,
      borderRadius: '20px',
      textAlign: 'center',
    }} className={c.pulse}>
      <div style={{ fontSize: '64px', lineHeight: 1 }}>{c.emoji}</div>
      {c.icon}
      <div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: c.color }}>{c.label}</div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: c.color, opacity: 0.7, letterSpacing: '0.1em' }}>{c.sublabel}</div>
      </div>
    </div>
  );
};

export default function P5CitizenVerify() {
  // Cascading dropdown filters - all empty initially
  const [filter, setFilter] = useState({
    division: '',
    district: '',
    upazila: '',
    mouza: '',
    jl_no: '',
    dag_no: '',
    khatian_no: ''
  });

  const [districtsList, setDistrictsList] = useState([]);
  const [upazilasList, setUpazilasList] = useState([]);
  const [mouzasList, setMouzasList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDivisionChange = (div) => {
    if (!div) {
      setDistrictsList([]);
      setUpazilasList([]);
      setMouzasList([]);
      setFilter(prev => ({ ...prev, division: '', district: '', upazila: '', mouza: '', jl_no: '' }));
      return;
    }
    const districts = getDistrictsForDivision(div);
    setDistrictsList(districts);
    setUpazilasList([]);
    setMouzasList([]);
    setFilter(prev => ({
      ...prev,
      division: div,
      district: '',
      upazila: '',
      mouza: '',
      jl_no: ''
    }));
  };

  const handleDistrictChange = (dist) => {
    if (!dist) {
      setUpazilasList([]);
      setMouzasList([]);
      setFilter(prev => ({ ...prev, district: '', upazila: '', mouza: '', jl_no: '' }));
      return;
    }
    const upazilas = getUpazilasForDistrict(dist);
    setUpazilasList(upazilas);
    setMouzasList([]);
    setFilter(prev => ({
      ...prev,
      district: dist,
      upazila: '',
      mouza: '',
      jl_no: ''
    }));
  };

  const handleUpazilaChange = (upz) => {
    if (!upz) {
      setMouzasList([]);
      setFilter(prev => ({ ...prev, upazila: '', mouza: '', jl_no: '' }));
      return;
    }
    const mouzas = getMouzasForUpazila(upz);
    setMouzasList(mouzas);
    setFilter(prev => ({
      ...prev,
      upazila: upz,
      mouza: '',
      jl_no: ''
    }));
  };

  const handleMouzaChange = (mouzaName) => {
    const jl = getJlNoForMouza(mouzaName);
    setFilter(prev => ({
      ...prev,
      mouza: mouzaName,
      jl_no: jl
    }));
  };

  const executeSearch = async (params) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.get('/api/verify-land', { params });
      setResult(res.data);
    } catch (err) {
      let message = 'সার্ভার সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।';
      if (err.response) {
        // Server responded with error status
        message = err.response?.data?.message || `সার্ভার সমস্যা (${err.response.status})। অনুগ্রহ করে পুনরায় চেষ্টা করুন।`;
      } else if (err.request) {
        // Request made but no response (network issue / backend offline)
        message = '⚠️ সার্ভারের সাথে সংযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ পরীক্ষা করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।';
      }
      setResult({
        success: false,
        signal: 'unknown',
        message
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(filter);
  };

  const handleReset = () => {
    setDistrictsList([]);
    setUpazilasList([]);
    setMouzasList([]);
    setFilter({
      division: '',
      district: '',
      upazila: '',
      mouza: '',
      jl_no: '',
      dag_no: '',
      khatian_no: ''
    });
    setResult(null);
  };


  return (
    <div className="dashboard-dark" style={{ paddingTop: '1px', paddingBottom: '40px' }}>
    <div style={{ maxWidth: '1080px', margin: '30px auto', padding: '0 24px' }}>
      {/* Hero header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 18px',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: '999px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#86efac',
          fontWeight: '600',
        }}>
          <Shield size={13} /> সাধারণ নাগরিকের জন্য উন্মুক্ত জমি যাচাই পোর্টাল (P5)
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '12px' }}>
          <span className="gradient-text-green">জমি কেনার আগে</span>
          <br />
          <span style={{ color: '#f1f5f9' }}>ধাপে ধাপে যাচাই করুন</span>
        </h1>
        <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>
          বিভাগ ➔ জেলা ➔ উপজেলা ➔ মৌজা ➔ জে.এল নম্বর ➔ দাগ নম্বর ড্রপডাউন ফিল্টার করে জেনে নিন জমিটি কেনা নিরাপদ কি না।
        </p>
      </div>

      {/* Cascading Filter Box */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#22c55e" />
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              ক্রমবিন্যাস ফিল্টার (Cascade Land Filter)
            </h2>
          </div>

          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={13} /> ফিল্টার রিসেট
          </button>
        </div>

        {/* Visual Breadcrumb Tracker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '24px',
          fontSize: '12px',
          color: '#cbd5e1'
        }}>
          <span style={{ color: '#64748b', fontWeight: '600' }}>নির্বাচন ক্রম:</span>
          {filter.division ? <span style={{ color: '#22c55e', fontWeight: '700' }}>{filter.division}</span> : <span style={{ color: '#475569' }}>বিভাগ বাছাই করুন</span>}
          <ChevronRight size={13} color="#64748b" />
          {filter.district ? <span style={{ color: '#3b82f6', fontWeight: '700' }}>{filter.district}</span> : <span style={{ color: '#475569' }}>জেলা</span>}
          <ChevronRight size={13} color="#64748b" />
          {filter.upazila ? <span style={{ color: '#f59e0b', fontWeight: '700' }}>{filter.upazila}</span> : <span style={{ color: '#475569' }}>উপজেলা</span>}
          <ChevronRight size={13} color="#64748b" />
          {filter.mouza ? <span style={{ color: '#ec4899', fontWeight: '700' }}>{filter.mouza}{filter.jl_no ? ` (জে.এল ${filter.jl_no})` : ''}</span> : <span style={{ color: '#475569' }}>মৌজা</span>}
          {filter.dag_no && (
            <>
              <ChevronRight size={13} color="#64748b" />
              <span style={{ color: '#a855f7', fontWeight: '700' }}>দাগ: {filter.dag_no}</span>
            </>
          )}
        </div>

        <form onSubmit={handleSearch}>
          {/* Row 1: Division, District, Upazila */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                ১. বিভাগ (Division)
              </label>
              <select
                className="input-field"
                value={filter.division}
                onChange={e => handleDivisionChange(e.target.value)}
              >
                <option value="">— বিভাগ নির্বাচন করুন —</option>
                {BANGLADESH_DIVISIONS.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                ২. জেলা (District)
              </label>
              <select
                className="input-field"
                value={filter.district}
                onChange={e => handleDistrictChange(e.target.value)}
                disabled={!filter.division}
              >
                <option value="">— জেলা নির্বাচন করুন —</option>
                {districtsList.map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                ৩. উপজেলা / সার্কেল (Upazila)
              </label>
              <select
                className="input-field"
                value={filter.upazila}
                onChange={e => handleUpazilaChange(e.target.value)}
                disabled={!filter.district}
              >
                <option value="">— উপজেলা নির্বাচন করুন —</option>
                {upazilasList.map(upz => (
                  <option key={upz} value={upz}>{upz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Mouza, J.L No, Khatian No, Dag No */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                ৪. মৌজা (Mouza)
              </label>
              <select
                className="input-field"
                value={filter.mouza}
                onChange={e => handleMouzaChange(e.target.value)}
                disabled={!filter.upazila}
              >
                <option value="">— মৌজা নির্বাচন করুন —</option>
                {mouzasList.map(m => (
                  <option key={m.mouza} value={m.mouza}>
                    {m.mouza} (জে.এল {m.jl_no})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                ৫. জে.এল নম্বর (J.L No.)
              </label>
              <input
                className="input-field"
                value={filter.jl_no}
                onChange={e => setFilter({ ...filter, jl_no: e.target.value })}
                placeholder="মৌজা অনুযায়ী স্বয়ংক্রিয়"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                ৬. খতিয়ান নম্বর (Khatian No.)
              </label>
              <input
                className="input-field"
                value={filter.khatian_no}
                onChange={e => setFilter({ ...filter, khatian_no: e.target.value })}
                placeholder="যেমন: ২৫"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#22c55e', display: 'block', marginBottom: '6px' }}>
                ৭. দাগ নম্বর / প্লট (Dag No.) ★
              </label>
              <input
                className="input-field"
                style={{ borderColor: 'rgba(34, 197, 94, 0.4)' }}
                value={filter.dag_no}
                onChange={e => setFilter({ ...filter, dag_no: e.target.value })}
                placeholder="যেমন: ১০১"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px',
              fontSize: '16px'
            }}
          >
            {loading ? (
              <><div className="loader" /> যাচাই হচ্ছে...</>
            ) : (
              <><Search size={18} /> নির্বাচিত ফিল্টারে জমি যাচাই করুন</>
            )}
          </button>
        </form>

      </div>

      {/* Result Display */}
      {result && (
        <div className="animate-fade-in-up">
          <div style={{
            display: 'grid',
            gridTemplateColumns: result.data ? '220px 1fr' : '1fr',
            gap: '24px',
            alignItems: 'start',
          }}>
            {/* Signal Light */}
            {result.signal && result.signal !== 'unknown' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <SignalLight signal={result.signal} />

                {/* Traffic light visual */}
                <div style={{
                  width: '60px',
                  background: '#1e293b',
                  borderRadius: '30px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '2px solid #334155'
                }}>
                  {['#dc2626', '#f59e0b', '#22c55e'].map((color, i) => {
                    const isActive =
                      (i === 0 && result.signal === 'danger') ||
                      (i === 1 && result.signal === 'warning') ||
                      (i === 2 && result.signal === 'safe');
                    return (
                      <div key={i} style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: isActive ? color : `${color}20`,
                        boxShadow: isActive ? `0 0 20px ${color}80` : 'none',
                        transition: 'all 0.3s',
                      }} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details */}
            <div>
              {/* Alert message */}
              <div style={{
                padding: '20px',
                background: result.signal === 'safe'
                  ? 'rgba(34,197,94,0.08)'
                  : result.signal === 'warning'
                    ? 'rgba(245,158,11,0.08)'
                    : 'rgba(220,38,38,0.08)',
                border: `1px solid ${
                  result.signal === 'safe'
                    ? 'rgba(34,197,94,0.25)'
                    : result.signal === 'warning'
                      ? 'rgba(245,158,11,0.25)'
                      : 'rgba(220,38,38,0.25)'
                }`,
                borderRadius: '16px',
                marginBottom: '16px',
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  lineHeight: 1.5,
                  color: result.signal === 'safe'
                    ? '#86efac'
                    : result.signal === 'warning'
                      ? '#fcd34d'
                      : '#fca5a5',
                }}>
                  {result.message}
                </div>
              </div>

              {/* Land info */}
              {result.data && (
                <div className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#f1f5f9',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <MapPin size={14} color="#94a3b8" /> বিস্তারিত ভূমির বিবরণ (মাস্ক করা)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    {[
                      ['বিভাগ', result.data.division || 'রাজশাহী'],
                      ['জেলা', result.data.district || 'বগুড়া'],
                      ['উপজেলা', result.data.upazila || 'শিবগঞ্জ'],
                      ['মৌজা', result.data.mouza],
                      ['জে.এল নম্বর', result.data.jl_no],
                      ['খতিয়ান নং', result.data.khatian_no],
                      ['দাগ নম্বর', result.data.dag_no],
                      ['জমির পরিমাণ', `${result.data.total_area_decimal} শতাংশ`],
                      ['মালিকের নাম', result.data.owner_name + ' (মাস্ক করা)'],
                      ['মালিকের NID', result.data.owner_nid],
                      ['বর্তমান অবস্থা', result.data.status],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>{k}</div>
                        <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '600' }}>
                          {k === 'বর্তমান অবস্থা' ? (
                            <span className={result.data.status === 'Active' ? 'badge-active' : result.data.status === 'Pending_Mutation' ? 'badge-pending' : 'badge-sold'}>
                              {result.data.status}
                            </span>
                          ) : v}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legal status */}
                  {result.data.legal && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        background: result.data.legal.is_khas ? 'rgba(220,38,38,0.12)' : 'rgba(34,197,94,0.08)',
                        border: `1px solid ${result.data.legal.is_khas ? 'rgba(220,38,38,0.3)' : 'rgba(34,197,94,0.2)'}`,
                        borderRadius: '8px',
                        color: result.data.legal.is_khas ? '#fca5a5' : '#86efac'
                      }}>
                        {result.data.legal.is_khas ? '⛔ খাস জমি' : '✅ খাস নয়'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        background: result.data.legal.has_court_case ? 'rgba(220,38,38,0.12)' : 'rgba(34,197,94,0.08)',
                        border: `1px solid ${result.data.legal.has_court_case ? 'rgba(220,38,38,0.3)' : 'rgba(34,197,94,0.2)'}`,
                        borderRadius: '8px',
                        color: result.data.legal.has_court_case ? '#fca5a5' : '#86efac'
                      }}>
                        {result.data.legal.has_court_case ? '⚖️ মামলা আছে' : '✅ মামলা নেই'}
                      </div>
                      {result.data.legal.stay_order && (
                        <div style={{
                          fontSize: '12px',
                          padding: '6px 12px',
                          background: 'rgba(220,38,38,0.12)',
                          border: '1px solid rgba(220,38,38,0.3)',
                          borderRadius: '8px',
                          color: '#fca5a5'
                        }}>
                          ⛔ Stay Order আছে
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      {!result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '40px' }}>
          {[
            { icon: '🟢', title: 'সবুজ সিগন্যাল', desc: 'জমি Active, কোনো মামলা বা খাস নেই। জমি কেনা সম্পূর্ণ নিরাপদ।', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            { icon: '🟡', title: 'হলুদ সিগন্যাল', desc: 'জমির হস্তান্তর প্রক্রিয়া চলমান (Pending Mutation)। এই মুহূর্তে ক্রয় করা ঝুঁকিপূর্ণ।', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { icon: '🔴', title: 'লাল সিগন্যাল', desc: 'জমিতে মামলা, Stay Order বা এটি সরকারি খাস জমি। কিনলে আইনি জটিলতা হবে।', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
          ].map(item => (
            <div key={item.title} style={{ padding: '20px', background: item.bg, border: `1px solid ${item.color}25`, borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{item.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: item.color, marginBottom: '8px' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Privacy note */}
      <div style={{ marginTop: '32px', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Shield size={16} color="#64748b" />
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
          <strong style={{ color: '#94a3b8' }}>গোপনীয়তা নিশ্চিত:</strong> এই পোর্টালে মালিকের NID এবং ব্যক্তিগত তথ্য আংশিকভাবে মাস্ক করা থাকে (যেমন: 1998567****) তথ্য সুরক্ষা আইন অনুযায়ী। এটি একটি Read-Only উন্মুক্ত নাগরিক সেবা।
        </div>
      </div>
    </div>
    </div>
  );
}
