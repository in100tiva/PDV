import { supabase } from '@/lib/supabase'
import { User, Store } from '@/types'

export const authService = {
        async login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                })

                if (authError) {
                        return { user: null, error: authError.message }
                }

                if (!authData.user) {
                        return { user: null, error: 'Usuário não encontrado' }
                }

                // Buscar dados do usuário na tabela public.users
                const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', authData.user.id)
                        .single()

                if (userError || !userData) {
                        return { user: null, error: 'Erro ao buscar dados do usuário' }
                }

                // Converter snake_case para camelCase
                const user: User = {
                        id: userData.id,
                        empresaId: userData.empresa_id,
                        email: userData.email,
                        nome: userData.nome,
                        cpf: userData.cpf,
                        telefone: userData.telefone,
                        cargo: userData.cargo,
                        avatarUrl: userData.avatar_url,
                        ativo: userData.ativo,
                        createdAt: userData.created_at,
                        updatedAt: userData.updated_at,
                }

                return { user, error: null }
        },

        async logout(): Promise<void> {
                await supabase.auth.signOut()
                localStorage.clear() // Limpar dados locais antigos
        },

        async getCurrentUser(): Promise<User | null> {
                const { data: { user: authUser } } = await supabase.auth.getUser()

                if (!authUser) return null

                const { data: userData } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', authUser.id)
                        .single()

                if (!userData) return null

                return {
                        id: userData.id,
                        empresaId: userData.empresa_id,
                        email: userData.email,
                        nome: userData.nome,
                        cpf: userData.cpf,
                        telefone: userData.telefone,
                        cargo: userData.cargo,
                        avatarUrl: userData.avatar_url,
                        ativo: userData.ativo,
                        createdAt: userData.created_at,
                        updatedAt: userData.updated_at,
                }
        }
}
