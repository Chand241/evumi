import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Building2, Search, UserCheck, Send, CheckCircle, Clock, AlertTriangle, FileText, Layers, Hash, MapPin, Sparkles, ChevronRight, ChevronLeft, Mail, KeyRound, ShieldCheck } from 'lucide-react';
import P4RegistryPanel from './P4RegistryPanel';
import {
  BANGLADESH_DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  getMouzasForUpazila,
  getJlNoForMouza
} from '../utils/geoData';

export default function RegisterOfficeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assign'); // 'assign' | 'deed_registry'

  // Cascade Filter State (Defaulted to Rajshahi > Bogura > Shibganj > গুজিয়া)
  const [filter, setFilter] = useState({
    division: 'রাজশাহী',
    district: 'বগুড়া',
    upazila: 'শিবগঞ্জ',
    mouza: 'গুজিয়া',
    jl_no: '1',
    khatian_no: '25',
    dag_no: '101'
  });

  // Dynamic Options
  const [divisionsList] = useState(BANGLADESH_DIVISIONS);
  const [districtsList, setDistrictsList] = useState(getDistrictsForDivision('রাজশাহী'));
  const [upazilasList, setUpazilasList] = useState(getUpazilasForDistrict('বগুড়া'));
  const [mouzasList, setMouzasList] = useState(getMouzasForUpazila('শিবগঞ্জ'));

  // Cascade change handlers
  const handleDivisionChange = (div) => {
    const districts = getDistrictsForDivision(div);
    const defaultDist = districts[0] || 'বগুড়া';
    const upazilas = getUpazilasForDistrict(defaultDist);
    const defaultUpazila = upazilas[0] || 'শিবগঞ্জ';
    const mouzas = getMouzasForUpazila(defaultUpazila);
    const defaultMouza = mouzas[0]?.mouza || 'গুজিয়া';
    const jl = mouzas[0]?.jl_no || '1';

    setDistrictsList(districts);
    setUpazilasList(upazilas);
    setMouzasList(mouzas);
    setFilter(prev => ({
      ...prev,
      division: div,
      district: defaultDist,
      upazila: defaultUpazila,
      mouza: defaultMouza,
      jl_no: jl
    }));
  };

  const handleDistrictChange = (dist) => {
    const upazilas = getUpazilasForDistrict(dist);
    const defaultUpazila = upazilas[0] || 'শিবগঞ্জ';
    const mouzas = getMouzasForUpazila(defaultUpazila);
    const defaultMouza = mouzas[0]?.mouza || 'গুজিয়া';
    const jl = mouzas[0]?.jl_no || '1';

    setUpazilasList(upazilas);
    setMouzasList(mouzas);
    setFilter(prev => ({
      ...prev,
      district: dist,
      upazila: defaultUpazila,
      mouza: defaultMouza,
      jl_no: jl
    }));
  };

  const handleUpazilaChange = (upz) => {
    const mouzas = getMouzasForUpazila(upz);
    const defaultMouza = mouzas[0]?.mouza || 'গুজিয়া';
    const jl = mouzas[0]?.jl_no || '1';

    setMouzasList(mouzas);
    setFilter(prev => ({
      ...prev,
      upazila: upz,
      mouza: defaultMouza,
      jl_no: jl
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

  // Selected land & found user
  const [selectedLand, setSelectedLand] = useState(null);
  const [searchingLand, setSearchingLand] = useState(false);

  const [userQuery, setUserQuery] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  // Wizard step: 1=citizen search, 2=land confirm, 3=document entry, 4=otp send, 5=otp verify & submit
  const [wizardStep, setWizardStep] = useState(1);

  // Volume & Page fields
  const [volumeBook, setVolumeBook] = useState('');
  const [pageNo, setPageNo] = useState('');
  const [deedNo, setDeedNo] = useState('');
  const [remarks, setRemarks] = useState('');

  // Submitting
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(null);
  const [assignError, setAssignError] = useState(null);

  // Citizen Email OTP verification states
  const [citizenOtp, setCitizenOtp] = useState('');
  const [sendingCitizenOtp, setSendingCitizenOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState(null);
  const [otpPreview, setOtpPreview] = useState(null);
  const [otpError, setOtpError] = useState(null);

  // Sent Requests List
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    fetchSentRequests();
    handleSearchLand();
    handleSearchUser();
  }, []);

  const fetchSentRequests = async () => {
    try {
      const res = await axios.get('/api/assign/requests');
      if (res.data.success) {
        setSentRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  };

  const handleSearchLand = async () => {
    setSearchingLand(true);
    setAssignSuccess(null);
    try {
      const res = await axios.get('/api/assign/search-land', {
        params: {
          mouza: filter.mouza,
          dag_no: filter.dag_no
        }
      });
      if (res.data.success && res.data.data.length > 0) {
        setSelectedLand(res.data.data[0]);
      } else {
        setSelectedLand(null);
      }
    } catch (err) {
      console.error('Land search error:', err);
    } finally {
      setSearchingLand(false);
    }
  };

  const handleSearchUser = async () => {
    if (!userQuery) return;
    setSearchingUser(true);
    setUserError(null);
    try {
      const res = await axios.get('/api/assign/search-user', {
        params: { query: userQuery }
      });
      if (res.data.success) {
        setFoundUser(res.data.data);
      }
    } catch (err) {
      setUserError(err.response?.data?.message || 'নাগরিক খুঁজে পাওয়া যায়নি');
      setFoundUser(null);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleSendCitizenOtp = async () => {
    if (!foundUser) {
      alert('অনুগ্রহ করে প্রথমে লক্ষ্য নাগরিক খুঁজে বের করুন!');
      return;
    }
    if (!selectedLand) {
      alert('অনুগ্রহ করে জমি নির্বাচন করুন!');
      return;
    }
    setSendingCitizenOtp(true);
    setOtpSentMessage(null);
    setOtpPreview(null);
    setOtpError(null);
    try {
      const res = await axios.post('/api/otp/send-land-assign-otp', {
        citizen_nid: foundUser.nid,
        citizen_email: foundUser.email,
        dag_no: selectedLand.dag_no,
        mouza: selectedLand.mouza,
        land_record_id: selectedLand._id
      });
      if (res.data.success) {
        setOtpSentMessage(res.data.message);
        if (res.data.previewOtp) {
          setOtpPreview(res.data.previewOtp);
        }
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'নাগরিকের ইমেইলে ওটিপি পাঠানো যায়নি।');
    } finally {
      setSendingCitizenOtp(false);
    }
  };

  const handleAssignLand = async () => {
    if (!selectedLand || !foundUser || !volumeBook || !pageNo) return;
    if (!citizenOtp || citizenOtp.trim().length !== 6) {
      setAssignError('🔒 নাগরিকের ইমেইল ওটিপি (৬ ডিজিট) প্রদান আবশ্যক!');
      return;
    }
    setAssigning(true);
    setAssignSuccess(null);
    setAssignError(null);
    try {
      const res = await axios.post('/api/assign/create-request', {
        land_record_id: selectedLand._id,
        user_nid: foundUser.nid,
        volume_book: volumeBook,
        page_no: pageNo,
        deed_no: deedNo,
        remarks: remarks,
        otp: citizenOtp.trim()
      });
      if (res.data.success) {
        setAssignSuccess(res.data.message);
        setCitizenOtp('');
        setOtpSentMessage(null);
        setOtpPreview(null);
        setWizardStep(1);
        setFoundUser(null);
        setUserQuery('');
        setVolumeBook('');
        setPageNo('');
        setDeedNo('');
        setRemarks('');
        fetchSentRequests();
        handleSearchLand();
      }
    } catch (err) {
      setAssignError(err.response?.data?.message || 'বরাদ্দ অনুরোধ পাঠানো ব্যর্থ হয়েছে');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="dashboard-dark" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 20px' }}>
        <div className="dashboard-layout">
          {/* Left Sidebar */}
          <aside className="dashboard-sidebar">
            {/* Officer Profile Summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '22px',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)'
              }}>
                <Building2 size={24} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'সাব-রেজিস্ট্রার'}
                </div>
                <div style={{ display: 'inline-block', fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: '#eff6ff', color: '#1d4ed8', fontWeight: '700', marginTop: '2px' }}>
                  সাব-রেজিস্ট্রি অফিস
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 6px' }}>
                ড্যাশবোর্ড মেনু
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('assign')}
                className={`sidebar-nav-item ${activeTab === 'assign' ? 'active-blue' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={18} color={activeTab === 'assign' ? '#1d4ed8' : '#64748b'} />
                  <span>নাগরিককে জমি বরাদ্দ</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('deed_registry')}
                className={`sidebar-nav-item ${activeTab === 'deed_registry' ? 'active-blue' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} color={activeTab === 'deed_registry' ? '#1d4ed8' : '#64748b'} />
                  <span>দলিল নিবন্ধন ও যাচাই</span>
                </div>
              </button>
            </nav>

            {/* Sidebar Officer & Security Widget */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>অফিস বিবরণী</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {user?.office_details?.office_name || 'ঢাকা সদর সাব-রেজিস্ট্রি অফিস'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  এখতিয়ার: {filter.district} · {filter.upazila}
                </div>
              </div>

              <div style={{ background: '#eff6ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '11px', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} color="#2563eb" />
                <span>P3 অ্যান্টি-ডাবল সেলিং সক্রিয়</span>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="dashboard-main">
            {/* Top Stat Banner (Compact) */}
            <div className="glass-card" style={{
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {activeTab === 'assign' ? 'নাগরিককে জমি বরাদ্দ ও প্রেরণ (Assign Land)' : 'দলিল নিবন্ধন ও অ্যান্টি-ডাবল সেলিং প্যানেল'}
                </h1>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '3px 0 0' }}>
                  সাব-রেজিস্ট্রি অফিস · {user?.office_details?.office_name || 'ঢাকা সদর সাব-রেজিস্ট্রি অফিস'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { fetchSentRequests(); handleSearchLand(); }}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '12px' }}
                >
                  ডাটা রিফ্রেশ
                </button>
              </div>
            </div>

{activeTab === 'assign' && (
        <div>
          {/* Instructions bar */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Building2 size={20} color="#60a5fa" />
            <div>
              <strong>ওয়ার্কফ্লো নির্দেশিকা:</strong> ১. ক্যাসকেড ফিল্টার দিয়ে জমি খুঁজুন ➔ ২. নাগরিকের NID দিয়ে ইউজার বের করুন ➔ ৩. ভলিউম বই ও পৃষ্ঠা নম্বর লিখুন ➔ ৪. 'এসি ল্যান্ডে পাঠান' বাটনে ক্লিক করুন। এসি ল্যান্ড রিভিউ করে অনুমোদন দিলে স্বয়ংক্রিয়ভাবে নাগরিকের নামে বরাদ্দ সম্পন্ন হবে।
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(320px, 1fr)', gap: '24px', marginBottom: '32px' }}>
            {/* Left: Cascade Land Filter & Citizen Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Cascade Filter Box */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#60a5fa" /> ক্যাসকেড ফিল্টার (জমি অনুসন্ধান)
                </h3>

                {/* Flow indicators */}
                <div style={{
                  fontSize: '11px',
                  color: '#93c5fd',
                  marginBottom: '16px',
                  background: 'rgba(59,130,246,0.1)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: '600'
                }}>
                  বিভাগ ➔ জেলা ➔ উপজেলা/সার্কেল ➔ মৌজা ➔ জেল নম্বর ➔ খতিয়ান ➔ দাগ নম্বর
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>১. বিভাগ (Division)</label>
                    <select
                      className="input-field"
                      value={filter.division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      {divisionsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>২. জেলা (District)</label>
                    <select
                      className="input-field"
                      value={filter.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>৩. উপজেলা (Upazila)</label>
                    <select
                      className="input-field"
                      value={filter.upazila}
                      onChange={(e) => handleUpazilaChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      {upazilasList.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>৪. মৌজা (মৌজা ও জে.এল)</label>
                    <select
                      className="input-field"
                      value={filter.mouza}
                      onChange={(e) => handleMouzaChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      {mouzasList.map(m => (
                        <option key={m.jl_no + m.mouza} value={m.mouza}>
                          {m.mouza} (জে.এল {m.jl_no})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>৫. জে.এল নং (স্বয়ংক্রিয়)</label>
                    <input
                      type="text"
                      readOnly
                      className="input-field"
                      value={filter.jl_no}
                      style={{ width: '100%', fontSize: '12px', background: 'rgba(255,255,255,0.03)', color: '#86efac' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>৬. খতিয়ান নং</label>
                    <input
                      type="text"
                      className="input-field"
                      value={filter.khatian_no}
                      onChange={(e) => setFilter(prev => ({ ...prev, khatian_no: e.target.value }))}
                      style={{ width: '100%', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>৭. দাগ নং (প্লট)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={filter.dag_no}
                      onChange={(e) => setFilter(prev => ({ ...prev, dag_no: e.target.value }))}
                      style={{ width: '100%', fontSize: '12px' }}
                    />
                  </div>
                </div>


                <button
                  type="button"
                  onClick={handleSearchLand}
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Search size={15} /> জমি ফিল্টার ও নির্বাচন করুন
                </button>
              </div>

              {/* Selected Land Preview */}
              {selectedLand && (
                <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                      নির্বাচিত জমি: দাগ {selectedLand.dag_no} (মৌজা: {selectedLand.mouza})
                    </h4>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: selectedLand.status === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: selectedLand.status === 'Active' ? '#86efac' : '#fde047',
                      fontWeight: '700'
                    }}>
                      স্ট্যাটাস: {selectedLand.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                    <div>খতিয়ান: <strong>{selectedLand.khatian_no}</strong></div>
                    <div>জে.এল নং: <strong>{selectedLand.jl_no}</strong></div>
                    <div>মোট পরিমাণ: <strong style={{ color: '#22c55e' }}>{selectedLand.total_area_decimal} শতক</strong></div>
                    <div>বর্তমান মালিক: <strong>{selectedLand.owner_name}</strong></div>
                    <div>মালিকের NID: <strong style={{ fontFamily: 'monospace' }}>{selectedLand.owner_nid}</strong></div>
                    <div>উপজেলা: <strong>{selectedLand.upazila || 'ধানমন্ডি'}</strong></div>
                  </div>
                </div>
              )}
            </div>

            {/* =========================================
                STEP-BY-STEP WIZARD: লক্ষ্য নাগরিক ও বরাদ্দ ফরম
                ========================================= */}
            <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>

              {/* Wizard Header */}
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} color="#60a5fa" /> লক্ষ্য নাগরিক নির্বাচন ও বরাদ্দ ফরম
              </h3>

              {/* Step Progress Bar */}
              {(() => {
                const steps = [
                  { label: 'নাগরিক খোঁজা', icon: <Search size={14} /> },
                  { label: 'জমি নিশ্চিত', icon: <MapPin size={14} /> },
                  { label: 'দলিল তথ্য', icon: <FileText size={14} /> },
                  { label: 'OTP প্রেরণ', icon: <Mail size={14} /> },
                  { label: 'যাচাই ও জমা', icon: <ShieldCheck size={14} /> },
                ];
                return (
                  <div style={{ marginBottom: '28px' }}>
                    {/* Track */}
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: '8px' }}>
                      {/* Progress line behind */}
                      <div style={{
                        position: 'absolute',
                        top: '18px',
                        left: '18px',
                        right: '18px',
                        height: '3px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '99px',
                        zIndex: 0
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '18px',
                        left: '18px',
                        width: `calc(${((wizardStep - 1) / 4) * 100}% - 36px * ${(wizardStep - 1) / 4})`,
                        height: '3px',
                        background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                        borderRadius: '99px',
                        zIndex: 1,
                        transition: 'width 0.4s ease'
                      }} />
                      {steps.map((s, i) => {
                        const n = i + 1;
                        const done = wizardStep > n;
                        const active = wizardStep === n;
                        return (
                          <div key={n} style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative',
                            zIndex: 2
                          }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: '800',
                              transition: 'all 0.3s ease',
                              background: done
                                ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                                : active
                                  ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
                                  : 'rgba(255,255,255,0.07)',
                              color: done || active ? '#fff' : '#64748b',
                              boxShadow: active ? '0 0 0 4px rgba(59,130,246,0.2)' : 'none',
                              border: done ? '2px solid #22c55e' : active ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.1)'
                            }}>
                              {done ? <CheckCircle size={16} /> : s.icon}
                            </div>
                            <div style={{
                              fontSize: '10px',
                              fontWeight: active ? '700' : '500',
                              color: done ? '#4ade80' : active ? '#93c5fd' : '#64748b',
                              marginTop: '6px',
                              whiteSpace: 'nowrap',
                              transition: 'color 0.3s'
                            }}>{s.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── STEP 1: নাগরিক অনুসন্ধান ── */}
              {wizardStep === 1 && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                  <div style={{
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#93c5fd', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Search size={15} /> ধাপ ১: নাগরিক অনুসন্ধান
                    </div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      নাগরিক অনুসন্ধান (NID / ফোন / ইমেইল)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="citizen-search-input"
                        type="text"
                        className="input-field"
                        placeholder="নাগরিকের NID / মোবাইল / ইমেইল দিন"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                        style={{ flex: 1, fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={handleSearchUser}
                        disabled={searchingUser || !userQuery.trim()}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {searchingUser ? '...' : <><Search size={14} /> খুঁজুন</>}
                      </button>
                    </div>
                  </div>

                  {userError && (
                    <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderRadius: '8px', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={14} /> {userError}
                    </div>
                  )}

                  {foundUser && (
                    <div style={{
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '20px',
                      animation: 'fadeInUp 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ fontWeight: '800', color: '#4ade80', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
                          {foundUser.name}
                        </div>
                        <span style={{ fontSize: '11px', background: 'rgba(34,197,94,0.2)', padding: '3px 10px', borderRadius: '999px', color: '#bbf7d0', fontWeight: '700' }}>নিবন্ধিত নাগরিক</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: '#a1a1aa' }}>
                        <div>NID: <strong style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{foundUser.nid}</strong></div>
                        <div>মোবাইল: <strong style={{ color: '#e2e8f0' }}>{foundUser.phone}</strong></div>
                        <div>পিতা: <strong style={{ color: '#e2e8f0' }}>{foundUser.father_name}</strong></div>
                        <div>ঠিকানা: <strong style={{ color: '#e2e8f0' }}>{foundUser.upazila}, {foundUser.district}</strong></div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!foundUser) { setUserError('আগে নাগরিক খুঁজুন এবং নিশ্চিত করুন।'); return; }
                        setUserError(null);
                        setWizardStep(2);
                      }}
                      className="btn-primary"
                      style={{ padding: '10px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      পরবর্তী ধাপ <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: জমি নিশ্চিতকরণ ── */}
              {wizardStep === 2 && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#93c5fd', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} /> ধাপ ২: নির্বাচিত জমির তথ্য নিশ্চিত করুন
                  </div>

                  {!selectedLand ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '16px' }}>
                      ⚠️ বাম পাশের ফিল্টার দিয়ে আগে জমি নির্বাচন করুন।
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(16,185,129,0.07)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: '12px',
                      padding: '18px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ fontWeight: '800', color: '#34d399', fontSize: '15px' }}>দাগ নং: {selectedLand.dag_no} — মৌজা: {selectedLand.mouza}</div>
                        <span style={{
                          fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '700',
                          background: selectedLand.status === 'Active' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                          color: selectedLand.status === 'Active' ? '#86efac' : '#fde047'
                        }}>{selectedLand.status}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px', color: '#94a3b8' }}>
                        <div>খতিয়ান: <strong style={{ color: '#e2e8f0' }}>{selectedLand.khatian_no}</strong></div>
                        <div>জে.এল নং: <strong style={{ color: '#e2e8f0' }}>{selectedLand.jl_no}</strong></div>
                        <div>পরিমাণ: <strong style={{ color: '#4ade80' }}>{selectedLand.total_area_decimal} শতক</strong></div>
                        <div>বর্তমান মালিক: <strong style={{ color: '#e2e8f0' }}>{selectedLand.owner_name}</strong></div>
                        <div>মালিকের NID: <strong style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{selectedLand.owner_nid}</strong></div>
                        <div>উপজেলা: <strong style={{ color: '#e2e8f0' }}>{selectedLand.upazila || 'শিবগঞ্জ'}</strong></div>
                      </div>
                    </div>
                  )}

                  {/* নাগরিক summary */}
                  {foundUser && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>👤</div>
                      <div>
                        <span style={{ color: '#e2e8f0', fontWeight: '700' }}>{foundUser.name}</span> — NID: {foundUser.nid} — ইমেইল: <span style={{ color: '#93c5fd' }}>{foundUser.email}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => setWizardStep(1)} className="btn-secondary" style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ChevronLeft size={16} /> পূর্ববর্তী
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedLand) return;
                        setWizardStep(3);
                      }}
                      disabled={!selectedLand}
                      className="btn-primary"
                      style={{ padding: '10px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      নিশ্চিত করুন <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: দলিল তথ্য ── */}
              {wizardStep === 3 && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#93c5fd', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={15} /> ধাপ ৩: সাব-রেজিস্ট্রি বালাম ও ভলিউম বই তথ্য
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '18px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                          ভলিউম বই নম্বর <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          id="volume-book-input"
                          type="text"
                          required
                          className="input-field"
                          placeholder="যেমন: VOL-2026-A"
                          value={volumeBook}
                          onChange={(e) => setVolumeBook(e.target.value)}
                          style={{ width: '100%', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                          পৃষ্ঠা নম্বর <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          id="page-no-input"
                          type="text"
                          required
                          className="input-field"
                          placeholder="যেমন: ১২৮"
                          value={pageNo}
                          onChange={(e) => setPageNo(e.target.value)}
                          style={{ width: '100%', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>দলিল নম্বর (Deed No)</label>
                      <input
                        id="deed-no-input"
                        type="text"
                        className="input-field"
                        placeholder="DEED-2026-088"
                        value={deedNo}
                        onChange={(e) => setDeedNo(e.target.value)}
                        style={{ width: '100%', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>রেজিস্ট্রার মন্তব্য</label>
                      <input
                        id="remarks-input"
                        type="text"
                        className="input-field"
                        placeholder="স্বত্ব পর্যালোচনা মন্তব্য"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        style={{ width: '100%', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => setWizardStep(2)} className="btn-secondary" style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ChevronLeft size={16} /> পূর্ববর্তী
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!volumeBook.trim() || !pageNo.trim()) {
                          alert('ভলিউম বই নম্বর এবং পৃষ্ঠা নম্বর প্রদান আবশ্যক!');
                          return;
                        }
                        setWizardStep(4);
                      }}
                      className="btn-primary"
                      style={{ padding: '10px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      পরবর্তী ধাপ <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: OTP প্রেরণ ── */}
              {wizardStep === 4 && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#93c5fd', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} /> ধাপ ৪: নাগরিকের ইমেইলে OTP প্রেরণ
                  </div>

                  <div style={{
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
                    <div style={{ fontWeight: '700', color: '#e2e8f0', marginBottom: '6px' }}>
                      {foundUser?.name}-এর ইমেইলে OTP পাঠানো হবে
                    </div>
                    <div style={{ fontSize: '13px', color: '#93c5fd', marginBottom: '16px', fontFamily: 'monospace' }}>
                      {foundUser?.email}
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '18px' }}>
                      এসি ল্যান্ড অফিসে প্রস্তাব পাঠানোর পূর্বে নাগরিকের ব্যক্তিগত ইমেইলে ওটিপি প্রেরণ ও যাচাই করা বাধ্যতামূলক।
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSendCitizenOtp();
                        if (!otpError) setWizardStep(5);
                      }}
                      disabled={sendingCitizenOtp || !foundUser || !selectedLand}
                      className="btn-primary"
                      style={{
                        padding: '12px 28px',
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
                      }}
                    >
                      <Send size={16} />
                      {sendingCitizenOtp ? 'ওটিপি পাঠানো হচ্ছে...' : '✉️ এখনই OTP পাঠান'}
                    </button>

                    {otpSentMessage && (
                      <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.1)', color: '#86efac', borderRadius: '8px', fontSize: '12px', marginTop: '14px' }}>
                        ✅ {otpSentMessage}
                      </div>
                    )}
                    {otpError && (
                      <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderRadius: '8px', fontSize: '12px', marginTop: '14px' }}>
                        ⚠️ {otpError}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button type="button" onClick={() => setWizardStep(3)} className="btn-secondary" style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ChevronLeft size={16} /> পূর্ববর্তী
                    </button>
                    {otpSentMessage && (
                      <button
                        type="button"
                        onClick={() => setWizardStep(5)}
                        className="btn-primary"
                        style={{ padding: '10px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        OTP দিতে যান <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 5: OTP যাচাই ও চূড়ান্ত জমা ── */}
              {wizardStep === 5 && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#93c5fd', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} /> ধাপ ৫: OTP যাচাই ও চূড়ান্ত বরাদ্দ জমা
                  </div>

                  {/* Summary Card */}
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '18px',
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>
                    <div style={{ fontWeight: '700', color: '#e2e8f0', marginBottom: '10px', fontSize: '13px' }}>📋 বরাদ্দের সারসংক্ষেপ</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div>নাগরিক: <strong style={{ color: '#4ade80' }}>{foundUser?.name}</strong></div>
                      <div>NID: <strong style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{foundUser?.nid}</strong></div>
                      <div>জমির দাগ: <strong style={{ color: '#e2e8f0' }}>{selectedLand?.dag_no}</strong></div>
                      <div>মৌজা: <strong style={{ color: '#e2e8f0' }}>{selectedLand?.mouza}</strong></div>
                      <div>ভলিউম বই: <strong style={{ color: '#e2e8f0' }}>{volumeBook}</strong></div>
                      <div>পৃষ্ঠা নং: <strong style={{ color: '#e2e8f0' }}>{pageNo}</strong></div>
                    </div>
                  </div>

                  {/* OTP Input */}
                  <div style={{
                    background: 'rgba(59,130,246,0.05)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: '12px',
                    padding: '18px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '13px', color: '#93c5fd', marginBottom: '6px' }}>🔒 নাগরিকের ইমেইলে প্রাপ্ত OTP লিখুন</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>{foundUser?.email}</div>
                    <input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="○ ○ ○ ○ ○ ○"
                      value={citizenOtp}
                      onChange={(e) => setCitizenOtp(e.target.value.replace(/\D/g, ''))}
                      className="input-field"
                      style={{
                        fontSize: '24px',
                        letterSpacing: '12px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontWeight: '800',
                        color: '#4ade80',
                        width: '100%',
                        maxWidth: '220px',
                        padding: '12px'
                      }}
                    />
                    {otpPreview && (
                      <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.1)', border: '1px dashed rgba(245,158,11,0.3)', color: '#fde047', borderRadius: '8px', fontSize: '11px', marginTop: '10px', display: 'inline-block' }}>
                        💡 সিমুলেশন OTP: <strong>{otpPreview}</strong>
                      </div>
                    )}
                    <div style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => { setOtpSentMessage(null); setOtpPreview(null); setOtpError(null); setWizardStep(4); }}
                        style={{ fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        OTP পাননি? আবার পাঠান
                      </button>
                    </div>
                  </div>

                  {assignSuccess && (
                    <div style={{
                      padding: '14px 16px',
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: '10px',
                      color: '#86efac',
                      fontSize: '13px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <CheckCircle size={18} color="#4ade80" /> {assignSuccess}
                    </div>
                  )}
                  {assignError && (
                    <div style={{
                      padding: '14px 16px',
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '10px',
                      color: '#fca5a5',
                      fontSize: '13px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <AlertTriangle size={18} color="#f87171" /> {assignError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => setWizardStep(4)} className="btn-secondary" style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ChevronLeft size={16} /> পূর্ববর্তী
                    </button>
                    <button
                      type="button"
                      onClick={handleAssignLand}
                      disabled={assigning || citizenOtp.length !== 6}
                      className="btn-primary"
                      style={{
                        padding: '12px 28px',
                        fontSize: '14px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: citizenOtp.length === 6 ? 'linear-gradient(135deg, #16a34a, #22c55e)' : undefined,
                        opacity: assigning ? 0.7 : 1
                      }}
                    >
                      {assigning ? (
                        <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> পাঠানো হচ্ছে...</>
                      ) : (
                        <><ShieldCheck size={17} /> নাগরিককে জমি বরাদ্দ করুন ➔ এসি ল্যান্ডে পাঠান</>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Table: Sent Assignment Requests */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#60a5fa" /> প্রেরিত জমি বরাদ্দ অনুরোধসমূহের স্থিতি
              </h3>
              <button onClick={fetchSentRequests} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }}>
                রিফ্রেশ
              </button>
            </div>

            {sentRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                এখনো কোনো জমি বরাদ্দ অনুরোধ পাঠানো হয়নি।
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                      <th style={{ padding: '10px 12px' }}>অনুরোধ নং</th>
                      <th style={{ padding: '10px 12px' }}>নাগরিক</th>
                      <th style={{ padding: '10px 12px' }}>জমির তথ্য</th>
                      <th style={{ padding: '10px 12px' }}>ভলিউম / পৃষ্ঠা</th>
                      <th style={{ padding: '10px 12px' }}>বর্তমান স্ট্যাটাস</th>
                      <th style={{ padding: '10px 12px' }}>পর্যালোচনা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentRequests.map((req) => (
                      <tr key={req._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#93c5fd' }}>
                          {req.request_id}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: '#f1f5f9' }}>{req.user_name}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {req.user_nid}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div>দাগ: <strong>{req.dag_no}</strong> | খতিয়ান: {req.khatian_no}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>মৌজা: {req.mouza} ({req.area_decimal} শতক)</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div>ভলিউম: <strong>{req.volume_book}</strong></div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>পৃষ্ঠা: {req.page_no}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: req.status === 'Approved' ? 'rgba(34, 197, 94, 0.15)' : req.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: req.status === 'Approved' ? '#86efac' : req.status === 'Rejected' ? '#fca5a5' : '#fde047',
                            border: `1px solid ${req.status === 'Approved' ? 'rgba(34, 197, 94, 0.3)' : req.status === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}>
                            {req.status === 'Approved' ? '✅ অনুমোদিত (Approved)' : req.status === 'Rejected' ? '❌ প্রত্যাখ্যাত (Rejected)' : '⏳ এসি ল্যান্ডে অপেক্ষমান'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>
                          {req.ac_land_reviewed_by ? (
                            <div>
                              <div>কর্মকর্তা: {req.ac_land_reviewed_by}</div>
                              {req.rejection_reason && <div style={{ color: '#ef4444' }}>কারণ: {req.rejection_reason}</div>}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b' }}>পর্যালোচনার অপেক্ষায়</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Existing Sub-Registry Deed Registration Panel */}
      {activeTab === 'deed_registry' && (
        <div>
          <P4RegistryPanel />
        </div>
      )}
          </main>
        </div>
      </div>
    </div>
  );
}
