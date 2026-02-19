import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Gift, Calendar, MessageSquare, ExternalLink } from 'lucide-react';

interface ContributionWithEvent {
  id: string;
  event_id: string;
  contributor_name: string;
  amount: number;
  base_amount: number;
  support_amount: number;
  message: string;
  created_at: string;
  payment_method: string;
  payment_status: string;
  event: {
    celebrant_name: string;
    event_date: string;
    slug: string;
    currency: string;
  };
}

interface ContributionHistoryProps {
  onViewEvent: (slug: string) => void;
}

export default function ContributionHistory({ onViewEvent }: ContributionHistoryProps) {
  const { user } = useAuth();
  const [contributions, setContributions] = useState<ContributionWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadContributions();
  }, [user]);

  const loadContributions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          id,
          event_id,
          contributor_name,
          amount,
          base_amount,
          support_amount,
          message,
          created_at,
          payment_method,
          payment_status,
          events (
            celebrant_name,
            event_date,
            slug,
            currency
          )
        `)
        .eq('contributor_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          event_id: item.event_id,
          contributor_name: item.contributor_name,
          amount: Number(item.amount),
          base_amount: Number(item.base_amount),
          support_amount: Number(item.support_amount),
          message: item.message,
          created_at: item.created_at,
          payment_method: item.payment_method,
          payment_status: item.payment_status,
          event: item.events
        }));
        setContributions(formatted);
      }
    } catch (error) {
      console.error('Error loading contribution history:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByYear = (contributions: ContributionWithEvent[]) => {
    const grouped: { [year: string]: ContributionWithEvent[] } = {};

    contributions.forEach((contrib) => {
      const year = new Date(contrib.created_at).getFullYear().toString();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(contrib);
    });

    return grouped;
  };

  const getTotalContributed = () => {
    return contributions.reduce((sum, contrib) => sum + contrib.base_amount, 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="text-gray-600">Caricamento...</div>
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="bg-gradient-to-br from-orange-100 to-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-10 h-10 text-orange-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Nessun regalo ancora</h3>
        <p className="text-gray-600">
          Quando contribuirai a un evento, vedrai qui la tua storia di generosità!
        </p>
      </div>
    );
  }

  const groupedContributions = groupByYear(contributions);
  const years = Object.keys(groupedContributions).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Gift className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tighter">La Tua Timeline</h3>
            <p className="text-white/80 text-sm font-semibold">I regali a cui hai contribuito</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4">
          <div className="text-sm font-semibold text-white/80">Totale Contribuito</div>
          <div className="text-4xl font-black mt-1">
            {formatCurrency(getTotalContributed(), contributions[0]?.event?.currency || 'EUR')}
          </div>
          <div className="text-sm font-semibold text-white/80 mt-2">
            in {contributions.length} {contributions.length === 1 ? 'regalo' : 'regali'}
          </div>
        </div>
      </div>

      {years.map((year) => (
        <div key={year} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full font-black text-lg">
              {year}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent"></div>
          </div>

          <div className="space-y-4">
            {groupedContributions[year].map((contribution) => (
              <div
                key={contribution.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden"
                onClick={() => onViewEvent(contribution.event.slug)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-black text-xl text-gray-900 mb-1">
                        Regalo per {contribution.event.celebrant_name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(contribution.event.event_date).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-orange-600">
                        {formatCurrency(contribution.base_amount, contribution.event.currency)}
                      </div>
                      {contribution.support_amount > 0 && (
                        <div className="text-xs text-gray-500 font-semibold">
                          +{formatCurrency(contribution.support_amount, contribution.event.currency)} caffè
                        </div>
                      )}
                    </div>
                  </div>

                  {contribution.message && (
                    <div className="bg-orange-50 rounded-xl p-4 mb-3 border-l-4 border-orange-500">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                        <p className="text-sm text-gray-700 font-medium italic">
                          "{contribution.message}"
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        contribution.payment_status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {contribution.payment_status === 'confirmed' ? 'Confermato' : 'In attesa'}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {contribution.payment_method === 'digital' ? 'Online' : 'Contanti'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                      Vedi evento
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
