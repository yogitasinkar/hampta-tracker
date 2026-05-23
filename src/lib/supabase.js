import { createClient } from '@supabase/supabase-js'

// These two values come from your Supabase project:
//   Supabase dashboard -> Project Settings -> API
// Paste them into the .env file (see .env.example). Never commit real keys.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('Supabase env vars missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(url || '', anonKey || '')
