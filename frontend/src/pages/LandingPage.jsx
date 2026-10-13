import { useNavigate } from 'react-router-dom';
import { Shield, Search, ArrowRight, CheckCircle, Lock, Zap, LogIn, UserPlus, FileText, Database } from 'lucide-react';

const systemRoles = [
  {
    role: 'নাগরিক (User)',
    icon: '👤',
    color: '#92400e',
    bg: '#fef3c7',
    border: '#fde68a',
    desc: 'নিজস্ব অনুমোদিত জমির রেকর্ড দেখুন, P5 নাগরিক জমি যাচাই করুন এবং প্রোফাইল পরিচালনা করুন।'
  },
  {
    role: 'সাব-রেজিস্ট্রি (Register Office)',
    icon: '🏛️',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    desc: 'ক্যাসকেড ফিল্টারে জমি অনুসন্ধান, নাগরিক NID যাচাই, দলিল নিবন্ধন ও এসি ল্যান্ডে বরাদ্দ প্রেরণ।'
  },
  {
    role: 'এসি ল্যান্ড (AC Land Office)',
    icon: '⚖️',
    color: '#047857',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    desc: 'রেজিস্ট্রি থেকে প্রাপ্ত বরাদ্দ পর্যালোচনা ও অনুমোদন, মালিকানা হস্তান্তর ও QR খতিয়ান প্রদান।'
  },
  {
    role: 'মন্ত্রণালয় এডমিন (Super Admin)',
    icon: '👑',
    color: '#7c3aed',
    bg: '#ede9fe',
    border: '#c4b5fd',
    desc: 'কর্মকর্তা তৈরি ও ভূমিকা ব্যবস্থাপনা, কেন্দ্রীয় জমি রেকর্ড নিয়ন্ত্রণ, সিস্টেম অডিট ও প্রশাসন।'
  }
];

const flowSteps = [
  { icon: '📝', label: 'দলিল আবেদন', sub: 'সাব-রেজিস্ট্রি', color: '#1d4ed8', bg: '#eff6ff' },
  { icon: '🛡️', label: 'P3 যাচাই', sub: 'NID + জমি চেক', color: '#92400e', bg: '#fef3c7' },
  { icon: '✅', label: 'Deed Grant', sub: 'SHA-256 Hash', color: '#047857', bg: '#ecfdf5' },
  { icon: '🔒', label: 'Pending Lock', sub: 'ডাবল-সেল বন্ধ', color: '#991b1b', bg: '#fee2e2' },
  { icon: '🏛️', label: 'AC Land', sub: 'নামজারি ইস্যু', color: '#7c3aed', bg: '#ede9fe' },
  { icon: '💳', label: 'Payment', sub: 'অনলাইন ফি', color: '#92400e', bg: '#fef3c7' },
  { icon: '📄', label: 'QR খতিয়ান', sub: 'নতুন মালিক', color: '#047857', bg: '#ecfdf5' },
];

const features = [
  { icon: <Shield size={22} color="#1a6b3c" />, title: 'জাল দলিল প্রতিরোধ', desc: 'SHA-256 হ্যাশ যাচাইয়ের মাধ্যমে প্রতিটি দলিলের অখণ্ডতা নিশ্চিত করা হয়।' },
  { icon: <Lock size={22} color="#1d4ed8" />, title: 'ডাবল-সেলিং বন্ধ', desc: 'Pending Lock মেকানিজম এককভাবে একটি জমির একাধিক বিক্রয় রোধ করে।' },
  { icon: <CheckCircle size={22} color="#047857" />, title: 'স্বয়ংক্রিয় অনুমোদন', desc: 'রেজিস্ট্রি থেকে এসি ল্যান্ড পর্যন্ত সম্পূর্ণ ডিজিটাল ওয়ার্কফ্লো।' },
  { icon: <Database size={22} color="#7c3aed" />, title: 'কেন্দ্রীয় ডেটাবেস', desc: 'MongoDB-তে সমস্ত জমির রেকর্ড সুরক্ষিত ও রিয়েল-টাইম আপডেট।' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* ===== HERO ===== */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }} className="animate-fade-in-up">
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 18px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '999px',
          marginBottom: '24px',
          fontSize: '12px',
          color: '#15803d',
          fontWeight: '700',
          letterSpacing: '0.02em',
        }}>
          <Zap size={13} /> বাংলাদেশ ভূমি মন্ত্রণালয় · ডিজিটাল ভূমি প্রশাসন ২০২৬
        </div>

        <h1 style={{
          fontSize: 'clamp(34px, 6vw, 60px)',
          fontWeight: '900',
          lineHeight: 1.15,
          marginBottom: '20px',
          color: '#0f172a',
        }}>
          <span className="gradient-text-green">e-ভূমি</span>
          <br />
          <span style={{ color: '#1e293b' }}>সমন্বিত ডিজিটাল ভূমি</span>
          <br />
          <span className="gradient-text-blue">ব্যবস্থাপনা সিস্টেম</span>
        </h1>

        <p style={{
          fontSize: '17px',
          color: '#475569',
          maxWidth: '620px',
          margin: '0 auto 36px',
          lineHeight: 1.75,
        }}>
          নাগরিক, সাব-রেজিস্ট্রার, এসি ল্যান্ড ও মন্ত্রণালয় এডমিনের জন্য একক সুরক্ষিত প্ল্যাটফর্ম।
          জাল দলিল ও ডাবল-সেলিং প্রতিরোধে স্বয়ংক্রিয় ব্যবস্থা।
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/login')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', padding: '13px 28px' }}
          >
            <LogIn size={17} /> লগইন পোর্টাল <ArrowRight size={16} />
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate('/register')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', padding: '13px 24px' }}
          >
            <UserPlus size={17} /> নাগরিক নিবন্ধন
          </button>

          <button
            onClick={() => navigate('/verify')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', padding: '13px 24px' }}
          >
            <Search size={17} /> জমি যাচাই (P5)
          </button>
        </div>
      </div>

      {/* ===== STATS BAR ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '60px',
      }}>
        {[
          { val: '৯টি', label: 'সিড মৌজা (শিবগঞ্জ)', icon: '📌' },
          { val: '৪টি', label: 'সিস্টেম ভূমিকা', icon: '🔐' },
          { val: 'SHA-256', label: 'দলিল যাচাই প্রযুক্তি', icon: '🛡️' },
          { val: 'QR কোড', label: 'ই-নামজারি খতিয়ান', icon: '📄' },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#1a6b3c', marginBottom: '4px' }}>{s.val}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ===== 4 SYSTEM ROLES ===== */}
      <div style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            সিস্টেমের ৪টি ভূমিকা
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            একটি লগইন পেজ থেকে প্রতিটি রোল নিজ নিজ পোর্টালে প্রবেশ করে
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          {systemRoles.map((r, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                padding: '24px',
                borderTop: `4px solid ${r.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                background: r.bg,
                border: `1px solid ${r.border}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
              }}>{r.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {r.role}
              </h3>
              <p style={{ color: '#475569', fontSize: '13px', lineHeight: 1.65, margin: 0, flexGrow: 1 }}>
                {r.desc}
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: r.bg,
                  border: `1.5px solid ${r.border}`,
                  color: r.color,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  width: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                লগইন ও ড্যাশবোর্ড দেখুন <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ===== WORKFLOW PIPELINE ===== */}
      <div className="glass-card" style={{ padding: '36px', marginBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
          🔄 সমন্বিত কার্যপ্রবাহ (Workflow Pipeline)
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '32px' }}>
          সাব-রেজিস্ট্রি বরাদ্দ থেকে শুরু করে এসি ল্যান্ড অনুমোদন ও নাগরিকের নামে খতিয়ান তৈরি
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {flowSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: step.bg,
                border: `1px solid`,
                borderColor: step.bg,
                borderRadius: '12px',
                padding: '14px 16px',
                textAlign: 'center',
                minWidth: '105px',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '5px' }}>{step.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: step.color }}>{step.label}</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{step.sub}</div>
              </div>
              {i < flowSteps.length - 1 && (
                <div style={{ color: '#94a3b8', fontSize: '18px' }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== KEY FEATURES ===== */}
      <div style={{ marginBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          মূল বৈশিষ্ট্যসমূহ
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>
          প্রযুক্তি ও নিরাপত্তার সমন্বয়ে একটি আধুনিক ভূমি ব্যবস্থাপনা সিস্টেম
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                width: '42px',
                height: '42px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>{f.icon}</div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>{f.title}</h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CTA FOOTER ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5, #eff6ff)',
        border: '1px solid #a7f3d0',
        borderRadius: '20px',
        padding: '44px 36px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>
          আজই শুরু করুন
        </h2>
        <p style={{ color: '#475569', fontSize: '15px', marginBottom: '28px', lineHeight: 1.7 }}>
          নাগরিক হিসেবে বিনামূল্যে নিবন্ধন করুন অথবা নির্ধারিত কর্মকর্তা হিসেবে লগইন করুন।
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/register')}
            style={{ fontSize: '15px', padding: '13px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={17} /> নাগরিক হিসেবে নিবন্ধন করুন
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/login')}
            style={{ fontSize: '15px', padding: '13px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <LogIn size={17} /> কর্মকর্তা লগইন
          </button>
        </div>
      </div>
    </div>
  );
}
