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
  const { t, language } = useLanguage();
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
    giftDescription: '', // Nuovo campo
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
        giftDescription: eventData.gift_description || '', // Caricamento dal DB
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
          gift_description: formData.giftDescription, // Salvataggio nel DB
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
      setTimeout(() => {
        onEventUpdated(formData.slug);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">{t('common.loading')}</div>
      </div>
    );
