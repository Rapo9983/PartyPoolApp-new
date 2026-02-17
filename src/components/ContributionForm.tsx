import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { createPayPalLink, formatCurrency } from '../lib/utils';
import SatispayPopup from './SatispayPopup';
import confetti from 'canvas-confetti';
import { X, Coffee, Wallet, CreditCard, User, MessageSquare } from 'lucide-react';

export default function ContributionForm({ eventId, currency, budgetGoal, paypalEmail, satispayId, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [showSatispayPopup, setShowSatispayPopup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
    isAnonymous: false,
    addSupport: false,
    paymentMethod: 'digital' as 'digital' | 'cash'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !formData.amount) return;
    setLoading(true);

    try {
      const base = parseFloat(formData.amount);
      const support = formData.addSupport ? 1 : 0;
      const finalName = formData.isAnonymous ? 'Un amico' : formData.name;

      const { error } = await supabase.from('contributions').insert({
        event_id: eventId,
        contributor_name: finalName,
        amount: base + support,
        base_amount: base,
        support_amount: support,
        message: formData.message,
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentMethod === 'cash' ? 'promised' : 'confirmed'
      });

      if (error) throw error;

      if (formData.message.trim()) {
        await supabase.from('wishes').insert({
          event_id: eventId,
          author_name: finalName,
          message: formData.message
        });
      }

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => { setLoading(false); onSuccess(); }, 1500);
    } catch (err) {
      setLoading(false);
      alert("Errore durante il salvataggio.");
    }
  };

  const total = (parseFloat(formData.amount) || 0) + (formData.addSupport ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999] backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Fai un regalo</h2>
          <button onClick={onClose} className="p-3 bg-white shadow-md rounded-full hover:bg-gray-100 transition-all"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Campo Nome */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Il tuo Nome</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] font-bold focus:border-orange-500 outline-none transition-all" placeholder="Esempio: Marco Rossi" required={!formData.isAnonymous} disabled={formData.isAnonymous} />
            </div>
            <label className="flex items-center gap-3 ml-2 cursor-pointer">
              <input type="checkbox" checked={formData.isAnonymous} onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})} className="w-5 h-5 rounded-lg text-orange-500 border-gray-200" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nascondi il mio nome</span>
            </label>
          </div>

          {/* Campo Importo */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Quanto regali?</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-orange-500">{currency === 'EUR' ? '€' : currency}</span>
              <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full pl-12 pr-6 py-6 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] font-black text-3xl focus:border-orange-500 outline-none transition-all" placeholder="0.00" required />
            </div>
          </div>

          {/* Campo Messaggio (RIPRISTINATO) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Scrivi un messaggio</label>
            <div className="relative">
              <MessageSquare className="absolute left-5 top-6 text-gray-400" size={20} />
              <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] font-bold focus:border-orange-500 outline-none transition-all h-32 resize-none" placeholder="Fai i tuoi auguri..." />
            </div>
          </div>

          {/* Opzione Caffè */}
          <div className="bg-orange-50 p-6 rounded-[2rem] border-2 border-orange-100/50">
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="bg-white p-3 rounded-xl shadow-sm"><Coffee className="text-orange-500" /></div>
              <div className="flex-1">
                <span className="text-sm font-black text-orange-900 uppercase tracking-tighter block">Offri un caffè? (+1.00€)</span>
                <span className="text-[10px] font-bold text-orange-600/70 uppercase">Per sostenere gli organizzatori</span>
              </div>
              <input type="checkbox" checked={formData.addSupport} onChange={(e) => setFormData({...formData, addSupport: e.target.checked})} className="w-6 h-6 rounded-lg text-orange-500 border-orange-200" />
            </label>
          </div>

          {/* Metodo di Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'digital'})} className={`p-6 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 transition-all ${formData.paymentMethod === 'digital' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg' : 'border-gray-100 text-gray-400'}`}>
              <CreditCard size={24} />
              <span className="font-black text-[10px] uppercase tracking-widest">Pagamento Online</span>
            </button>
            <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'cash'})} className={`p-6 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 transition-all ${formData.paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg' : 'border-gray-100 text-gray-400'}`}>
              <Wallet size={24} />
              <span className="font-black text-[10px] uppercase tracking-widest">Contanti a mano</span>
            </button>
          </div>

          {/* Pulsanti Rapidi Online */}
          {formData.paymentMethod === 'digital' && total > 0 && (
            <div className="space-y-3 pt-4 animate-in slide-in-from-bottom-4">
              {paypalEmail && (
                <a href={createPayPalLink(paypalEmail, total, currency)} target="_blank" className="block w-full bg-[#0070ba] text-white py-5 rounded-[1.5rem] font-black text-center shadow-xl hover:opacity-90 transition-all uppercase tracking-widest text-xs">Paga con PayPal</a>
              )}
              {satispayId && (
                <button type="button" onClick={() => setShowSatispayPopup(true)} className="w-full bg-[#fa3e5a] text-white py-5 rounded-[1.5rem] font-black shadow-xl hover:opacity-90 transition-all uppercase tracking-widest text-xs">Paga con Satispay</button>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-black text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-gray-900 transition-all active:scale-95 uppercase tracking-tighter mt-4">
            {loading ? 'SALVATAGGIO...' : 'CONFERMA REGALO'}
          </button>
        </form>
      </div>

      {showSatispayPopup && (
        <SatispayPopup satispayId={satispayId} amount={total.toString()} currency={currency} onClose={() => setShowSatispayPopup(false)} />
      )}
    </div>
  );
}
