import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Exporta o client mesmo que as variáveis sejam strings vazias (previne erro de travamento no build).
// No navegador, se as variáveis estiverem vazias, as chamadas falharão, o que é o comportamento esperado.
export const supabase = createClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder'
)
