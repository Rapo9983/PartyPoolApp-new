import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase Configuration Error:');
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('  - VITE_SUPABASE_URL is not set');
  if (!supabaseAnonKey) console.error('  - VITE_SUPABASE_ANON_KEY is not set');
  console.error('Please check your .env file and ensure both variables are configured.');
  throw new Error('Missing Supabase environment variables. Check the console for details.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Event = {
  id: string;
  creator_id: string;
  celebrant_name: string;
  event_date: string;
  event_time?: string | null;
  location?: string | null;
  description: string;
  budget_goal: number;
  current_amount: number;
  currency: string;
  gift_url?: string | null;
  paypal_email?: string | null;
  satispay_id?: string | null;
  slug: string;
  contribution_type: 'free' | 'equal_shares';
  participants_count?: number | null;
  is_supporter: boolean;
  created_at: string;
  updated_at: string;
};

export type Contribution = {
  id: string;
  event_id: string;
  contributor_id: string | null;
  contributor_name: string;
  amount: number;
  base_amount: number;
  support_amount: number;
  message: string;
  payment_method: 'digital' | 'cash';
  payment_status: 'confirmed' | 'promised';
  created_at: string;
};

export type Wish = {
  id: string;
  event_id: string;
  author_id: string | null;
  author_name: string;
  message: string;
  created_at: string;
};
