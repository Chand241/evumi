import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, CreditCard, ArrowLeft } from 'lucide-react';

export default function PaymentPage() {
  const { record_id } = useParams();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      await axios.post('/api/complete-payment', { record_id });
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', padding: '0 24px' }}>
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        {!done ? (
          <>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>💳</div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', marginBottom: '10px' }}>নামজারি ফি পেমেন্ট</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px', lineHeight: 1.7 }}>
              আপনার নামজারি আবেদন অনুমোদিত হয়েছে। নামজারি সম্পন্ন করতে নিচের বাটনে ক্লিক করুন।
            </p>
            <div style={{ padding: '20px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#60a5fa' }}>৳ ১,১৫০</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>নামজারি সরকারি ফি</div>
            </div>
            <button onClick={handlePay} disabled={paying} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', fontSize: '16px' }}>
              {paying ? <><div className="loader" /> প্রক্রিয়াকরণ...</> : <><CreditCard size={18} /> পেমেন্ট সম্পন্ন করুন (Demo)</>}
            </button>
          </>
        ) : (
          <>
            <div className="animate-fade-in-up">
              <CheckCircle size={60} color="#22c55e" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#86efac', marginBottom: '10px' }}>পেমেন্ট সফল! 🎉</div>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.7 }}>
                আপনার নামজারি সম্পন্ন হয়েছে। AC Land ড্যাশবোর্ডে QR কোডসহ নামজারি খতিয়ান তৈরি হয়েছে।
              </p>
              <button onClick={() => navigate('/ac-land')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                <ArrowLeft size={16} /> AC Land ড্যাশবোর্ডে যান
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
