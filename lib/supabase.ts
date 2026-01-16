import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface ParcelRecord {
  id?: number
  branch: string
  date: string
  vip_code: string
  vip_name: string
  count: number
  created_at?: string
  updated_at?: string
}

export interface Branch {
  id?: number
  name: string
  monthly_target?: number
  created_at?: string
}
