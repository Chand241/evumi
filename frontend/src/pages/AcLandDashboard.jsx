import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle, XCircle, Clock, FileText, Search, AlertTriangle, ShieldCheck, ArrowRight, Layers } from 'lucide-react';
import P4AcLandPanel from './P4AcLandPanel';

export default function AcLandDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assign_requests'); // 'assign_requests' | 'mutations'

  // Assignment requests
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Pending_AC_Land_Review');

  // Modal for review action
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approve'); // 'Approve' | 'Reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      const res = await axios.get('/api/assign/requests', { params });
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmittingReview(true);
    try {
      const res = await axios.post(`/api/assign/review-request/${selectedReq._id}`, {
        action: reviewAction,
        rejection_reason: rejectionReason,
        remarks: remarks
      });

      if (res.data.success) {
        setReviewSuccess(res.data.message);
        setTimeout(() => {
          setSelectedReq(null);
          setReviewSuccess(null);
          fetchRequests();
        }, 1500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'পর্যালোচনা ব্যর্থ হয়েছে');
    } finally {
      setSubmittingReview(false);
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
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '22px',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}>
                <Users size={24} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'এসি ল্যান্ড'}
                </div>
                <div style={{ display: 'inline-block', fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: '#ecfdf5', color: '#047857', fontWeight: '700', marginTop: '2px' }}>
                  এসি ল্যান্ড অফিস
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
                onClick={() => setActiveTab('assign_requests')}
                className={`sidebar-nav-item ${activeTab === 'assign_requests' ? 'active-emerald' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={18} color={activeTab === 'assign_requests' ? '#047857' : '#64748b'} />
                  <span>জমি বরাদ্দ অনুমোদন</span>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: activeTab === 'assign_requests' ? '#a7f3d0' : '#f1f5f9',
                  color: activeTab === 'assign_requests' ? '#065f46' : '#475569'
                }}>
                  {requests.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mutations')}
                className={`sidebar-nav-item ${activeTab === 'mutations' ? 'active-emerald' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} color={activeTab === 'mutations' ? '#047857' : '#64748b'} />
                  <span>ই-নামজারি ও মিউটেশন</span>
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
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>রাজস্ব সার্কেল</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {user?.office_details?.office_name || 'ধানমন্ডি রাজস্ব সার্কেল'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  পদবি: {user?.office_details?.designation || 'সহকারী কমিশনার (ভূমি)'}
                </div>
              </div>

              <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '11px', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={14} color="#059669" />
                <span>QR খতিয়ান ও অটো-মিউটেশন সক্রিয়</span>
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
              borderLeft: '4px solid #10b981'
            }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {activeTab === 'assign_requests' ? 'সাব-রেজিস্ট্রি থেকে প্রেরিত জমি বরাদ্দ ইনবক্স' : 'ই-নামজারি ও QR-কোডযুক্ত খতিয়ান প্রদান'}
                </h1>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '3px 0 0' }}>
                  সহকারী কমিশনার (ভূমি) অফিস · {user?.office_details?.office_name || 'রাজস্ব সার্কেল'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={fetchRequests}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '12px' }}
                >
                  ইনবক্স রিফ্রেশ
                </button>
              </div>
            </div>

{activeTab === 'assign_requests' && (
        <div>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'Pending_AC_Land_Review', label: '⏳ পর্যালোচনায় অপেক্ষমান' },
                { id: 'Approved', label: '✅ অনুমোদিত' },
                { id: 'Rejected', label: '❌ প্রত্যাখ্যাত' },
                { id: 'ALL', label: 'সব অনুরোধ' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: filterStatus === f.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: filterStatus === f.id ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                    color: filterStatus === f.id ? '#6ee7b7' : '#94a3b8',
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button onClick={fetchRequests} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
              ইনবক্স রিফ্রেশ করুন
            </button>
          </div>

          {/* Requests Cards Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>অনুরোধ তালিকা লোড হচ্ছে...</div>
          ) : requests.length === 0 ? (
            <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>📥</div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '6px' }}>
                এই ক্যাটাগরিতে কোনো অনুরোধ পাওয়া যায়নি
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                সাব-রেজিস্ট্রি অফিস থেকে নতুন কোনো বরাদ্দ অনুরোধ পাঠানো হলে এখানে তালিকাভুক্ত হবে।
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="glass-card"
                  style={{
                    padding: '24px',
                    borderLeft: `4px solid ${req.status === 'Approved' ? '#10b981' : req.status === 'Rejected' ? '#ef4444' : '#f59e0b'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6ee7b7' }}>
                      {req.request_id}
                    </span>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: req.status === 'Approved' ? 'rgba(34, 197, 94, 0.15)' : req.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: req.status === 'Approved' ? '#86efac' : req.status === 'Rejected' ? '#fca5a5' : '#fde047',
                      border: `1px solid ${req.status === 'Approved' ? 'rgba(34, 197, 94, 0.3)' : req.status === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}>
                      {req.status === 'Approved' ? '✅ অনুমোদিত' : req.status === 'Rejected' ? '❌ প্রত্যাখ্যাত' : '⏳ রিভিউ অপেক্ষমান'}
                    </span>
                  </div>

                  {/* Citizen details */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
                      বরাদ্দ প্রাপক নাগরিক (Citizen):
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9' }}>
                      {req.user_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                      NID: <strong style={{ fontFamily: 'monospace' }}>{req.user_nid}</strong> | ফোন: {req.user_phone || 'N/A'}
                    </div>
                  </div>

                  {/* Land & Volume details */}
                  <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    <div>মৌজা: <strong>{req.mouza}</strong></div>
                    <div>জে.এল নং: <strong>{req.jl_no}</strong></div>
                    <div>খতিয়ান: <strong>{req.khatian_no}</strong></div>
                    <div>দাগ নং: <strong>{req.dag_no}</strong></div>
                    <div>জমির পরিমাণ: <strong style={{ color: '#10b981' }}>{req.area_decimal} শতক</strong></div>
                    <div>উপজেলা: <strong>{req.upazila}</strong></div>
                    <div>ভলিউম বই: <strong style={{ color: '#93c5fd' }}>{req.volume_book}</strong></div>
                    <div>পৃষ্ঠা নং: <strong style={{ color: '#93c5fd' }}>{req.page_no}</strong></div>
                  </div>

                  {req.deed_no && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                      দলিল নম্বর: <strong style={{ color: '#cbd5e1' }}>{req.deed_no}</strong>
                    </div>
                  )}

                  {req.remarks && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', marginBottom: '14px' }}>
                      মন্তব্য: {req.remarks}
                    </div>
                  )}

                  {/* Actions if pending */}
                  {req.status === 'Pending_AC_Land_Review' && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setReviewAction('Approve');
                        }}
                        className="btn-primary"
                        style={{
                          flex: 1,
                          padding: '9px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: 'linear-gradient(135deg, #059669, #10b981)'
                        }}
                      >
                        <CheckCircle size={14} /> অনুমোদন (Approve)
                      </button>

                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setReviewAction('Reject');
                        }}
                        className="btn-danger"
                        style={{
                          flex: 1,
                          padding: '9px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <XCircle size={14} /> বাতিল (Reject)
                      </button>
                    </div>
                  )}

                  {/* If already reviewed */}
                  {req.status !== 'Pending_AC_Land_Review' && (
                    <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                      পর্যালোচনা করেছেন: {req.ac_land_reviewed_by || 'এসি ল্যান্ড'} | {req.rejection_reason && <span style={{ color: '#ef4444' }}>কারণ: {req.rejection_reason}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Review Modal */}
          {selectedReq && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '20px'
            }}>
              <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '30px', position: 'relative' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '14px' }}>
                  {reviewAction === 'Approve' ? '✅ জমি বরাদ্দ অনুমোদন নিশ্চিতকরণ' : '❌ জমি বরাদ্দ বাতিল / প্রত্যাখ্যান'}
                </h3>

                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
                  {reviewAction === 'Approve'
                    ? `অনুমোদন করার সাথে সাথে দাগ নং ${selectedReq.dag_no} (মৌজা: ${selectedReq.mouza}) জমিটি আনুষ্ঠানিকভাবে নাগরিক ${selectedReq.user_name} (NID: ${selectedReq.user_nid})-এর নামে মালিকানা অর্পিত হবে।`
                    : 'অনুরোধটি প্রত্যাখ্যান করার কারণ উল্লেখ করুন।'}
                </p>

                {reviewSuccess && (
                  <div style={{ padding: '12px', background: 'rgba(34,197,94,0.15)', color: '#86efac', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                    {reviewSuccess}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit}>
                  {reviewAction === 'Reject' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                        প্রত্যাখ্যানের কারণ <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="যেমন: খতিয়ান তথ্যে গরমিল বা বালামে রেকর্ড অমিল"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                      এসি ল্যান্ড মন্তব্য (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="রেকর্ড ও বালাম যাচাই সাপেক্ষে গৃহীত সিদ্ধান্ত"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedReq(null)}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      বন্ধ করুন
                    </button>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className={reviewAction === 'Approve' ? 'btn-primary' : 'btn-danger'}
                      style={{ padding: '8px 18px', fontSize: '13px' }}
                    >
                      {submittingReview ? 'প্রসেস হচ্ছে...' : reviewAction === 'Approve' ? 'হ্যাঁ, অনুমোদন করুন' : 'প্রত্যাখ্যান নিশ্চিত করুন'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Existing P4 Mutation & Namjari Issuance */}
      {activeTab === 'mutations' && (
        <div>
          <P4AcLandPanel />
        </div>
      )}
          </main>
        </div>
      </div>
    </div>
  );
}
