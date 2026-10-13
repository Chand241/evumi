import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';

export default function QRVerifyPage() {
  const { qr_code_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`/api/verify-by-qr/${qr_code_id}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'QR যাচাই ব্যর্থ।');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [qr_code_id]);

  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', padding: '0 24px' }}>
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
        {loading && <div className="loader" style={{ margin: '0 auto' }} />}
        {error && (
          <div>
            <XCircle size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: '#fca5a5', fontSize: '16px', fontWeight: '700' }}>❌ QR যাচাই ব্যর্থ</div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>{error}</div>
          </div>
        )}
        {data && (
          <div className="animate-fade-in-up">
            <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: '#86efac', fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>✅ খতিয়ান বৈধ</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '24px' }}>QR Code: {qr_code_id}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
              {data.data && Object.entries({
                'মৌজা': data.data.mouza, 'দাগ নং': data.data.dag_no,
                'খতিয়ান': data.data.khatian_no, 'মালিক': data.data.owner_name,
                'জমি': `${data.data.total_area_decimal} শতাংশ`, 'স্ট্যাটাস': data.data.status,
              }).map(([k, v]) => (
                <div key={k} style={{ padding: '10px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{k}</div>
                  <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '600' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '10px', color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Hash: {data.data?.deed_hash}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
