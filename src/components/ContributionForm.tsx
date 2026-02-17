import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { createPayPalLink, formatCurrency } from '../lib/utils';
import SatispayPopup from './SatispayPopup';
import confetti from 'canvas-confetti';
import { X, User, MessageSquare, Coffee, Wallet, CreditCard } from 'lucide-react';

export default function ContributionForm({ eventId, currency, budgetGoal, paypalEmail, satispayId, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [showSatispayPopup, setShowSatispayPopup] = useState(false);
  const [formData, setFormData] = useState({
    contributorName: '',
    amount: '',
    message: '',
    isAnonymous: false,
    addSupport: false,
    paymentMethod: 'digital' as 'digital' | 'cash',
  });

  const getTotalAmount = () => {
    const base = parseFloat(formData.amount) || 0;
    const support = formData.addSupport ? 1 : 0;
    return Math.round((base + support) * 100) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !formData.amount) return;
    setLoading(true);

    try {
      const base = parseFloat(formData.amount);
      const support = formData.addSupport ? 1 : 0;

      // Inseriamo contributo e augurio contemporaneamente se c'è un messaggio
      const { error: err } = await supabase.from('contributions').insert({
        event_id: eventId,
        contributor_name: formData.isAnonymous ? 'Un amico' : formData.contributorName,
        amount: base + support,
        base_amount: base,
        support_amount: support,
        message: formData.message,
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentMethod === 'cash' ? 'promised' : 'confirmed',
      });

      if (err) throw err;

      // Se c'è un messaggio, lo salviamo anche nella tabella wishes
      if (formData.message.trim()) {
        await supabase.from('wishes').insert({
          event_id: eventId,
          author_name: formData.isAnonymous ? 'Un amico' : formData.contributorName,
          message: formData.message
        });
      }

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => { setLoading(false); onSuccess(); }, 1500);
    } catch (err) {
      alert("Errore salvataggio");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-50 px-8 py-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Fai un regalo</h2>
          <button onClick={onClose} className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nome</label>
            <input type="text" value={formData.contributorName} onChange={(e) => setFormData({...formData, contributorName: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-500 outline-none font-bold" placeholder="Tuo nome" required={!formData.isAnonymous} disabled={formData.isAnonymous} />
            <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-bold text-gray-400">
              <input type="checkbox" checked={formData.isAnonymous} onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})} className="rounded text-orange-500" /> Rimani anonimo
            </label>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Importo ({currency})</label>
            <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-2xl focus:border-orange-500 outline-none" placeholder="0.00" required />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Scrivi un messaggio</label>
            <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-500 outline-none font-medium h-24" placeholder="Fai i tuoi auguri..." />
          </div>

          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.addSupport} onChange={(e) => setFormData({...formData, addSupport: e.target.checked})} className="rounded text-orange-500" />
              <span className="text-sm font-black text-orange-800">☕ Offri 1€ agli organizzatori?</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'digital'})} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 ${formData.paymentMethod === 'digital' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>
                <CreditCard size={20}/><span className="text-[10px] font-black uppercase">Online</span>
             </button>
             <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'cash'})} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 ${formData.paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>
                <Wallet size={20}/><span className="text-[10px] font-black uppercase">Contanti</span>
             </button>
          </div>

          {formData.paymentMethod === 'digital' && formData.amount && (
            <div className="space-y-2">
              {paypalEmail && <a href={createPayPalLink(paypalEmail, getTotalAmount(), currency)} target="_blank" className="block w-full bg-[#0070ba] text-white py-4 rounded-2xl font-black text-center shadow-lg">PayPal ({formatCurrency(getTotalAmount(), currency)})</a>}
              {satispayId && <button type="button" onClick={() => setShowSatispayPopup(true)} className="w-full bg-[#fa3e5a] text-white py-4 rounded-2xl font-black shadow-lg">Satispay ({formatCurrency(getTotalAmount(), currency)})</button>}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-black text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl uppercase tracking-tighter disabled:opacity-50">
            {loading ? 'Salvataggio...' : 'Conferma Regalo'}
          </button>
        </form>
      </div>
      {showSatispayPopup && <SatispayPopup satispayId={satispayId} amount={getTotalAmount().toString()} currency={currency} onClose={() => setShowSatispayPopup(false)} />}
    </div>
  );
}
