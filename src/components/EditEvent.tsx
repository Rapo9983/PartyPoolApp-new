import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Event } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/utils';
import { addAmazonAffiliateTag } from '../lib/affiliateUtils';
import { Calendar, User, FileText, ArrowLeft, Clock, MapPin, Gift, Image as ImageIcon, Upload, Save, Users, ShoppingBag } from 'lucide-react';

const PayPalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.5 7.9c0 4.4-3.6 8-8 8h-2l-1 5h-3l2-10h4c2.8 0 5-2.2 5-5 0-.6-.1-1.2-.3-1.7 1.4.8 2.3 2.3 2.3 4 0 .2 0 .5-.1.7z" fill="#009cde"/>
    <path d="M17.2 2.2C16.5 1.5 15.5 1 14.4 1H7.9c-.5 0-.9.4-1 .9L4.5 14.3c-.1.3.2.6.5.6h3l1-5h2c4.4 0 8-3.6 8-8 0-.2 0-.5-.1-.7-.5-.7-1.2-1.2-2-1.5z" fill="#012169"/>
  </svg>
);

const SatispayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="2" width="16" height="20" rx="2" stroke="#F5333F" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="8" r="2" fill="#F5333F"/>
    <path d="M8 14h8M8 17h8" stroke="#F5333F" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface EditEventProps {
  eventId: string;
  onEventUpdated: (slug: string) => void;
  onBack: () => void;
}

export default function EditEvent({ eventId, onEventUpdated, onBack }: EditEventProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [celebrantImageUrl, setCelebrantImageUrl] = useState<string>('');
  const [celebrantImagePreview, setCelebrantImagePreview] = useState<string | null>(null);
  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');
  
  const [formData, setFormData] = useState({
    celebrantName: '',
    eventDate: '',
    eventTime: '',
    location: '',
    description: '',
    giftDescription: '', // AGGIUNTO
    budgetGoal: '',
    currency: '€',
    contributionType: 'free' as 'free' | 'equal_shares',
    participantsCount: '',
    giftUrl: '',
    paypalEmail: '',
    satispayId: '',
    slug: '',
  });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    setLoadingEvent(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (eventError) throw eventError;
      if (!eventData) {
        setError('Event not found');
        return;
      }

      if (eventData.creator_id !== user?.id) {
        setError('You are not authorized to edit this event');
        return;
      }

      setFormData({
        celebrantName: eventData.celebrant_name || '',
        eventDate: eventData.event_date || '',
        eventTime: eventData.event_time || '',
        location: eventData.location || '',
        description: eventData.description || '',
        giftDescription: eventData.gift_description || '', // CARICAMENTO
        budgetGoal: eventData.budget_goal?.toString() || '',
        currency: eventData.currency || '€',
        contributionType: eventData.contribution_type || 'free',
        participantsCount: eventData.participants_count?.toString() || '',
        giftUrl: eventData.gift_url || '',
        paypalEmail: eventData.paypal_email || '',
        satispayId: eventData.satispay_id || '',
        slug: eventData.slug || '',
      });

      if (eventData.celebrant_image) {
        setCelebrantImageUrl(eventData.celebrant_image);
        setCelebrantImagePreview(eventData.celebrant_image);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleCelebrantImageUrlChange = (url: string) => {
    setCelebrantImageUrl(url);
    setCelebrantImagePreview(url);
  };

  const handleCelebrantImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(t('event.imageTooBig'));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCelebrantImageUrl(base64String);
      setCelebrantImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const calculateShareAmount = () => {
    if (formData.contributionType === 'equal_shares' && formData.budgetGoal && formData.participantsCount) {
      const budget = parseFloat(formData.budgetGoal);
      const participants = parseInt(formData.participantsCount);
      if (!isNaN(budget) && !isNaN(participants) && participants > 0) {
        return budget / participants;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const processedGiftUrl = formData.giftUrl ? addAmazonAffiliateTag(formData.giftUrl) : null;
      const { error: updateError } = await supabase
        .from('events')
        .update({
          celebrant_name: formData.celebrantName,
          celebrant_image: celebrantImageUrl || null,
          event_date: formData.eventDate,
          event_time: formData.eventTime || null,
          location: formData.location || null,
          description: formData.description,
          gift_description: formData.giftDescription, // SALVATAGGIO
          budget_goal: parseFloat(formData.budgetGoal),
          currency: formData.currency,
          contribution_type: formData.contributionType,
          participants_count: formData.contributionType === 'equal_shares' && formData.participantsCount
            ? parseInt(formData.participantsCount)
            : null,
          gift_url: processedGiftUrl,
          paypal_email: formData.paypalEmail || null,
          satispay_id: formData.satispayId || null,
        })
        .eq('id', eventId);

      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => onEventUpdated(formData.slug), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvent) return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 p-4 font-sans">
      <div className="max-w-2xl mx-auto pt-8">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition font-medium">
          <ArrowLeft className="w-5 h-5" /> {t('event.back')}
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-3.5 rounded-2xl shadow-lg">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent uppercase tracking-tight">
              {t('event.edit')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Nome Celebrante */}
            <div>
              <label htmlFor="celebrantName" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                <User className="w-4 h-4 text-orange-500" /> {t('event.celebrantName')}
              </label>
              <input id="celebrantName" type="text" value={formData.celebrantName} onChange={(e) => setFormData({ ...formData, celebrantName: e.target.value })} required className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all bg-gray-50/30" />
            </div>

            {/* Immagine Celebrante */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                <ImageIcon className="w-4 h-4 text-orange-500" /> {t('event.celebrantImage')}
              </label>
              <div className="flex gap-3 mb-4">
                <button type="button" onClick={() => setImageInputType('url')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${imageInputType === 'url' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>{t('event.imageUrl')}</button>
                <button type="button" onClick={() => setImageInputType('file')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${imageInputType === 'file' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>{t('event.imageUpload')}</button>
              </div>
              {imageInputType === 'url' ? (
                <input type="url" value={celebrantImageUrl} onChange={(e) => handleCelebrantImageUrlChange(e.target.value)} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl bg-gray-50/30" placeholder={t('event.celebrantImagePlaceholder')} />
              ) : (
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleCelebrantImageFileChange} className="hidden" id="celebrantImageFile" />
                  <label htmlFor="celebrantImageFile" className="w-full px-5 py-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-400 transition-all cursor-pointer flex items-center justify-center gap-3 text-gray-500 bg-gray-50/30"><Upload className="w-5 h-5" /> <span>{t('event.uploadImage')}</span></label>
                </div>
              )}
              {celebrantImagePreview && (
                <div className="mt-4 flex justify-center">
                  <img src={celebrantImagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-full border-4 border-orange-100 shadow-md" />
                </div>
              )}
            </div>

            {/* Data e Ora */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="eventDate" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"><Calendar className="w-4 h-4 text-orange-500" /> {t('event.eventDate')}</label>
                <input id="eventDate" type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} required className="w-full px-5 py-3.5 border border-gray-200 rounded-xl bg-gray-50/30" />
              </div>
              <div>
                <label htmlFor="eventTime" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"><Clock className="w-4 h-4 text-orange-500" /> {t('event.eventTime')}</label>
                <input id="eventTime" type="time" value={formData.eventTime} onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl bg-gray-50/30" />
              </div>
            </div>

            {/* Location e Descrizione */}
            <div className="space-y-6">
              <div>
                <label htmlFor="location" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"><MapPin className="w-4 h-4 text-orange-500" /> {t('event.location')}</label>
                <input id="location" type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl bg-gray-50/30" />
              </div>
              <div>
                <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"><FileText className="w-4 h-4 text-orange-500" /> {t('event.description')}</label>
                <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={3} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl resize-none bg-gray-50/30" />
              </div>
            </div>

            {/* SEZIONE BUDGET E TIPO CONTRIBUTO (RIPRISTINATA) */}
            <div className="p-6 bg-pink-50/50 rounded-3xl border border-pink-100 space-y-6">
               <div className="grid md:grid-cols-3 gap-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block uppercase">{t('event.currency')}</label>
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-pink-100">
                    <option value="€">€ EUR</option>
                    <option value="$">$ USD</option>
                    <option value="£">£ GBP</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 mb-2 block uppercase">{t('event.budgetGoal')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{formData.currency}</span>
                    <input type="number" step="0.01" value={formData.budgetGoal} onChange={(e) => setFormData({ ...formData, budgetGoal: e.target.value })} required className="w-full pl-10 pr-5 py-3.5 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-pink-100" />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide"><Users className="w-4 h-4 text-pink-500" /> {t('event.contributionType')}</label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setFormData({ ...formData, contributionType: 'free' })} className={`p-5 rounded-2xl border-2 transition-all text-left ${formData.contributionType === 'free' ? 'border-pink-500 bg-white shadow-md' : 'border-gray-200 bg-white/50'}`}>
                    <div className="font-black text-gray-800">{t('event.contributionFree')}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('event.contributionFreeDesc')}</div>
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, contributionType: 'equal_shares' })} className={`p-5 rounded-2xl border-2 transition-all text-left ${formData.contributionType === 'equal_shares' ? 'border-pink-500 bg-white shadow-md' : 'border-gray-200 bg-white/50'}`}>
                    <div className="font-black text-gray-800">{t('event.contributionEqualShares')}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('event.contributionEqualSharesDesc')}</div>
                  </button>
                </div>
              </div>

              {formData.contributionType === 'equal_shares' && (
                <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-inner">
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">{t('event.participantsCount')}</label>
                  <input type="number" value={formData.participantsCount} onChange={(e) => setFormData({ ...formData, participantsCount: e.target.value })} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl mb-4" />
                  {calculateShareAmount() !== null && (
                    <div className="text-center p-4 bg-pink-50 rounded-xl border border-pink-100">
                      <div className="text-xs font-bold text-pink-400 uppercase mb-1">{t('event.shareAmount')}</div>
                      <div className="text-3xl font-black text-pink-600">{formatCurrency(calculateShareAmount()!, formData.currency)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEZIONE REGALO AGGIORNATA (SOLO CAMPI TESTUALI) */}
            <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100 space-y-5">
              <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                <Gift className="w-5 h-5 text-orange-500" /> {t('event.giftUrl')}
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descrizione breve del regalo</label>
                <textarea 
                  value={formData.giftDescription} 
                  onChange={(e) => setFormData({ ...formData, giftDescription: e.target.value })}
                  placeholder="Esempio: Nintendo Switch OLED Blu/Rosso"
                  rows={2}
                  className="w-full px-5 py-3.5 border border-gray-200 rounded-xl bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Link al prodotto (Amazon, etc.)</label>
                <div className="relative">
                  <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input type="url" value={formData.giftUrl} onChange={(e) => setFormData({ ...formData, giftUrl: e.target.value })} className="w-full pl-11 pr-5 py-3.5 border border-gray-200 rounded-xl bg-white" placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* Pagamenti */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"><PayPalIcon /> PayPal</label>
                <input type="text" value={formData.paypalEmail} onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl bg-gray-50/30" placeholder="Email o link" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"><SatispayIcon /> Satispay</label>
                <input type="text" value={formData.satispayId} onChange={(e) => setFormData({ ...formData, satispayId: e.target.value })} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl bg-gray-50/30" placeholder="Username" />
              </div>
            </div>

            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-sm font-medium">{error}</div>}
            {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-xl text-sm font-medium">{t('event.updateSuccess')}</div>}

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:shadow-orange-200 hover:scale-[1.01] transition-all disabled:opacity-50 uppercase tracking-tighter flex items-center justify-center gap-3">
              {loading ? t('event.updating') : <><Save className="w-6 h-6" /> {t('event.saveChanges')}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
