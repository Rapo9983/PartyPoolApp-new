import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Event } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/utils';
import { addAmazonAffiliateTag } from '../lib/affiliateUtils';
import { Calendar, User, FileText, ArrowLeft, Clock, MapPin, Gift, Image as ImageIcon, Upload, Save, Users, Edit } from 'lucide-react';
import ImageCropper from './ImageCropper';

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
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<string>('');
  
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
    if (file.size > 10 * 1024 * 1024) {
      setError(t('event.imageTooBig'));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setTempImageForCrop(base64String);
      setShowImageCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleImageCropSave = (croppedImageData: string) => {
    setCelebrantImageUrl(croppedImageData);
    setCelebrantImagePreview(croppedImageData);
    setShowImageCropper(false);
    setTempImageForCrop('');
  };

  const handleImageCropCancel = () => {
    setShowImageCropper(false);
    setTempImageForCrop('');
  };

  const handleEditImage = () => {
    if (celebrantImagePreview) {
      setTempImageForCrop(celebrantImagePreview);
      setShowImageCropper(true);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('event.back')}
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              {t('event.edit')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="celebrantName" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                {t('event.celebrantName')}
              </label>
              <input
                id="celebrantName"
                type="text"
                value={formData.celebrantName}
                onChange={(e) => setFormData({ ...formData, celebrantName: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder={t('event.celebrantPlaceholder')}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4" />
                {t('event.celebrantImage')}
              </label>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImageInputType('url')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    imageInputType === 'url'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('event.imageUrl')}
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputType('file')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    imageInputType === 'file'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('event.imageUpload')}
                </button>
              </div>

              {imageInputType === 'url' ? (
                <input
                  type="url"
                  value={celebrantImageUrl}
                  onChange={(e) => handleCelebrantImageUrlChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  placeholder={t('event.celebrantImagePlaceholder')}
                />
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCelebrantImageFileChange}
                    className="hidden"
                    id="celebrantImageFile"
                  />
                  <label
                    htmlFor="celebrantImageFile"
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition cursor-pointer flex items-center justify-center gap-2 text-gray-600 hover:text-orange-500"
                  >
                    <Upload className="w-5 h-5" />
                    <span>{t('event.uploadImage')}</span>
                  </label>
                </div>
              )}

              {celebrantImagePreview && (
                <div className="mt-3 p-3 bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-600">{t('event.imagePreview')}</p>
                    <button
                      type="button"
                      onClick={handleEditImage}
                      className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium"
                    >
                      <Edit className="w-3 h-3" />
                      Modifica
                    </button>
                  </div>
                  <img
                    src={celebrantImagePreview}
                    alt="Celebrant preview"
                    className="w-24 h-24 object-cover rounded-full mx-auto border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventDate" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  {t('event.eventDate')}
                </label>
                <input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="eventTime" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  {t('event.eventTime')}
                </label>
                <input
                  id="eventTime"
                  type="time"
                  value={formData.eventTime}
                  onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                {t('event.location')}
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder={t('event.locationPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                {t('event.description')}
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                placeholder={t('event.descriptionPlaceholder')}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="currency" className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('event.currency')}
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                >
                  <option value="€">€ EUR</option>
                  <option value="$">$ USD</option>
                  <option value="£">£ GBP</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="budgetGoal" className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('event.budgetGoal')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">{formData.currency}</span>
                  <input
                    id="budgetGoal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budgetGoal}
                    onChange={(e) => setFormData({ ...formData, budgetGoal: e.target.value })}
                    required
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Users className="w-4 h-4" />
                {t('event.contributionType')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, contributionType: 'free' })}
                  className={`p-4 rounded-xl border-2 transition ${
                    formData.contributionType === 'free'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{t('event.contributionFree')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('event.contributionFreeDesc')}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, contributionType: 'equal_shares' })}
                  className={`p-4 rounded-xl border-2 transition ${
                    formData.contributionType === 'equal_shares'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{t('event.contributionEqualShares')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('event.contributionEqualSharesDesc')}</div>
                </button>
              </div>
            </div>

            {formData.contributionType === 'equal_shares' && (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <label htmlFor="participantsCount" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4" />
                  {t('event.participantsCount')}
                </label>
                <input
                  id="participantsCount"
                  type="number"
                  min="1"
                  value={formData.participantsCount}
                  onChange={(e) => setFormData({ ...formData, participantsCount: e.target.value })}
                  required={formData.contributionType === 'equal_shares'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  placeholder={t('event.participantsPlaceholder')}
                />
                {calculateShareAmount() !== null && (
                  <div className="mt-3 text-center p-3 bg-white rounded-lg border border-orange-300">
                    <div className="text-sm text-gray-600 mb-1">{t('event.shareAmount')}</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(calculateShareAmount()!, formData.currency)}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="giftDescription" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Gift className="w-4 h-4" />
                Il regalo
              </label>
              <textarea
                id="giftDescription"
                value={formData.giftDescription}
                onChange={(e) => setFormData({ ...formData, giftDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Descrivi il regalo che desideri ricevere..."
              />
            </div>

            <div>
              <label htmlFor="giftUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Gift className="w-4 h-4" />
                {t('event.giftUrl')}
              </label>
              <input
                id="giftUrl"
                type="url"
                value={formData.giftUrl}
                onChange={(e) => setFormData({ ...formData, giftUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder={t('event.giftUrlPlaceholder')}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="paypalEmail" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <PayPalIcon />
                  {t('event.paypalEmail')}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <PayPalIcon />
                  </div>
                  <input
                    id="paypalEmail"
                    type="text"
                    value={formData.paypalEmail}
                    onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder={t('event.paypalEmailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="satispayId" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <SatispayIcon />
                  {t('event.satispayId')}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <SatispayIcon />
                  </div>
                  <input
                    id="satispayId"
                    type="text"
                    value={formData.satispayId}
                    onChange={(e) => setFormData({ ...formData, satispayId: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder={t('event.satispayIdPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {t('event.updateSuccess')}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                t('event.updating')
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('event.saveChanges')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {showImageCropper && tempImageForCrop && (
        <ImageCropper
          imageUrl={tempImageForCrop}
          onSave={handleImageCropSave}
          onCancel={handleImageCropCancel}
        />
      )}
    </div>
  );
}
