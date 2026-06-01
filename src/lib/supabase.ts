import { createClient } from '@supabase/supabase-js';

// Provide a fallback valid URL to prevent Next.js build-time crash when keys are placeholders
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL 
  : 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MCASLog = {
  id: string;
  created_at: string;
  time_block: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  allergy_index: number;
  is_flare_phase: boolean;
  symptoms: string[];
  foods: { item: string; qty: string; is_leftover: boolean; allergens?: string[] }[];
  food_image_url?: string;
  meds_and_supps: { item: string; dose: string; type: 'daily_supplement' | 'rescue_medication' }[];
  stress_level: number;
  sleep_quality?: number;
  menstrual_phase: 'Follicular' | 'Ovulation' | 'Luteal' | 'Menstruation' | 'None';
  weather_temp?: number;
  weather_humidity?: number;
  weather_uv?: number;
  weather_pressure?: number;
  weather_aqi?: number;
  weather_pm?: { pm2_5: number; pm10: number };
};
