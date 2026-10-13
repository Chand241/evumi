import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ArrowRight, AlertCircle, CheckCircle, ShieldCheck, Mail, Key, ArrowLeft, RefreshCw, Send, MapPin } from 'lucide-react';
import {
  BANGLADESH_DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict
} from '../utils/geoData';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { verifyAndRegister } = useAuth();

  // Initial administrative defaults: রাজশাহী > বগুড়া > শিবগঞ্জ
  const initialDivision = 'রাজশাহী';
  const initialDistricts = getDistrictsForDivision(initialDivision);
  const initialDistrict = 'বগুড়া';
  const initialUpazilas = getUpazilasForDistrict(initialDistrict);
  const initialUpazila = 'শিবগঞ্জ';

  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    mother_name: '',
    nid: '',
    division: initialDivision,
    district: initialDistrict,
    upazila: initialUpazila,
    phone: '',
    email: '',
    password: ''
  });

  const [districtsList, setDistrictsList] = useState(initialDistricts);
  const [upazilasList, setUpazilasList] = useState(initialUpazilas);

  // OTP Verification Step State: 'FORM' | 'OTP'
  const [step, setStep] = useState('FORM');
  const [otp, setOtp] = useState('');
  const [previewOtp, setPreviewOtp] = useState(null);
  const [otpMessage, setOtpMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cascade handler for Division
  const handleDivisionChange = (e) => {
    const selectedDivision = e.target.value;
    const districts = getDistrictsForDivision(selectedDivision);
    const defaultDistrict = districts[0] || '';
    const upazilas = getUpazilasForDistrict(defaultDistrict);
    const defaultUpazila = upazilas[0] || '';

    setDistrictsList(districts);
    setUpazilasList(upazilas);

    setFormData(prev => ({
      ...prev,
      division: selectedDivision,
      district: defaultDistrict,
      upazila: defaultUpazila
    }));
  };

  // Cascade handler for District
  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    const upazilas = getUpazilasForDistrict(selectedDistrict);
    const defaultUpazila = upazilas[0] || '';

    setUpazilasList(upazilas);

    setFormData(prev => ({
      ...prev,
      district: selectedDistrict,
      upazila: defaultUpazila
    }));
  };

  const handleUpazilaChange = (e) => {
    const selectedUpazila = e.target.value;
    setFormData(prev => ({
      ...prev,
      upazila: selectedUpazila
    }));
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Step 1: Send OTP to User's Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post('/api/otp/send-registration-otp', {
        email: formData.email,
        nid: formData.nid,
        name: formData.name
      });

      if (res.data.success) {
        setOtpMessage(res.data.message);
        if (res.data.previewOtp) {
          setPreviewOtp(res.data.previewOtp);
        } else {
          setPreviewOtp(null);
        }
        setStep('OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post('/api/otp/send-registration-otp', {
        email: formData.email,
        nid: formData.nid,
        name: formData.name
      });
      if (res.data.success) {
        setOtpMessage(res.data.message);
        if (res.data.previewOtp) {
          setPreviewOtp(res.data.previewOtp);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'ওটিপি পুনরায় পাঠাতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize registration
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('অনুগ্রহ করে সঠিক ৬ ডিজিটের ওটিপি প্রদান করুন।');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await verifyAndRegister({
        ...formData,
        otp: otp.trim()
      });
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'ওটিপি যাচাই ও নিবন্ধন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#86efac',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '12px'
        }}>
          <ShieldCheck size={14} /> বাংলাদেশ ভূমি প্রশাসন · সুরক্ষিত নাগরিক নিবন্ধন
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>
          নতুন নাগরিক অ্যাকাউন্ট তৈরি করুন
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          {step === 'FORM'
            ? 'সকল তথ্য পূরণ করুন। নিবন্ধনের জন্য আপনার ব্যক্তিগত ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হবে।'
            : `আপনার ইমেইল (${formData.email}) এ প্রেরিত ৬ ডিজিটের ওটিপি যাচাই করুন।`}
        </p>
      </div>

      <div className="glass-card" style={{ padding: '36px' }}>
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ================= STEP 1: REGISTRATION FORM ================= */}
        {step === 'FORM' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Row 1: Full Name & NID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                  নাগরিকের পূর্ণ নাম (Name) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  placeholder="যেমন: মো. রহিম উদ্দিন"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                  জাতীয় পরিচয়পত্র নম্বর (NID) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="nid"
                  required
                  className="input-field"
                  placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি"
                  value={formData.nid}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Row 2: Father's Name & Mother's Name */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                  পিতার নাম (Father's Name) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="father_name"
                  required
                  className="input-field"
                  placeholder="পিতার পূর্ণ নাম"
                  value={formData.father_name}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                  মাতার নাম (Mother's Name) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="mother_name"
                  required
                  className="input-field"
                  placeholder="মাতার পূর্ণ নাম"
                  value={formData.mother_name}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Row 3: Cascading Administrative Location (Division -> District -> Upazila) */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} /> প্রশাসনিক ভৌগোলিক অবস্থান নির্বাচন (বাংলাদেশ)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: '500' }}>
                    ১. বিভাগ (Division) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formData.division}
                    onChange={handleDivisionChange}
                    style={{ width: '100%' }}
                  >
                    {BANGLADESH_DIVISIONS.map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: '500' }}>
                    ২. জেলা (District) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    style={{ width: '100%' }}
                  >
                    {districtsList.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: '500' }}>
                    ৩. উপজেলা (Upazila) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formData.upazila}
                    onChange={handleUpazilaChange}
                    style={{ width: '100%' }}
                  >
                    {upazilasList.map(upz => (
                      <option key={upz} value={upz}>{upz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 4: Phone & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                  মোবাইল নম্বর (Phone) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="input-field"
                  placeholder="017XXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                  ব্যক্তিগত ইমেইল (Email) <span style={{ color: '#ef4444' }}>* (ওটিপি পাঠানো হবে)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="input-field"
                  placeholder="yourname@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                />
              </div>
            </div>

            {/* Row 5: Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                পাসওয়ার্ড (Password) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                className="input-field"
                placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                value={formData.password}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#86efac',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} /> পরবর্তী ধাপে আপনার ইমেইলে প্রেরিত ৬ ডিজিটের ওটিপি কোড যাচাই করা হবে।
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '15px',
                marginTop: '6px'
              }}
            >
              <Send size={18} />
              {loading ? 'ওটিপি পাঠানো হচ্ছে...' : 'ইমেইল ওটিপি পাঠান ও নিবন্ধন এগিয়ে নিন'}
            </button>
          </form>
        )}

        {/* ================= STEP 2: EMAIL OTP VERIFICATION ================= */}
        {step === 'OTP' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in-up">
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '2px solid rgba(34, 197, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '28px'
              }}>
                📨
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>
                ইমেইল ওটিপি যাচাইকরণ
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
                আপনার ব্যক্তিগত ইমেইল <strong>{formData.email}</strong> এ একটি ৬ ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।
              </p>
            </div>

            {otpMessage && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '8px',
                color: '#86efac',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                {otpMessage}
              </div>
            )}

            {previewOtp && (
              <div style={{
                padding: '14px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px dashed rgba(245, 158, 11, 0.4)',
                borderRadius: '8px',
                color: '#fcd34d',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                💡 <strong>সিমুলেশন মোড ওটিপি:</strong> <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '2px' }}>{previewOtp}</span>
                <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>
                  (আপনার পার্সোনাল জিমেইল .env এ কনফিগার করলে সরাসরি ইনবক্সে আসবে)
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '8px', fontWeight: '600', textAlign: 'center' }}>
                  ৬ ডিজিটের ওটিপি কোড লিখুন
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="******"
                  className="input-field"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    margin: '0 auto',
                    display: 'block',
                    textAlign: 'center',
                    fontSize: '28px',
                    letterSpacing: '12px',
                    fontWeight: '800',
                    color: '#4ade80',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary"
                style={{
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px'
                }}
              >
                <Key size={18} />
                {loading ? 'যাচাই হচ্ছে...' : 'ওটিপি যাচাই ও নাগরিক অ্যাকাউন্ট নিশ্চিত করুন'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setStep('FORM')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} /> তথ্য সংশোধন করুন
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600'
                }}
              >
                <RefreshCw size={14} /> পুনরায় ওটিপি পাঠান
              </button>
            </div>
          </div>
        )}

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          textAlign: 'center',
          fontSize: '13px',
          color: '#94a3b8'
        }}>
          ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" style={{ color: '#4ade80', fontWeight: '600', textDecoration: 'none' }}>
            লগইন করুন
          </Link>
        </div>
      </div>
    </div>
  );
}
