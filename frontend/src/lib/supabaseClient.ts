import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL loaded:', supabaseUrl)
console.log('Supabase key exists:', Boolean(supabaseAnonKey))

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase environment variables are missing. Check frontend/.env.local.',
  )
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
)