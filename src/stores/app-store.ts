import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Store, Company } from '@/types'
import { authService } from '@/services/auth-service'
import { dataService } from '@/services/data-service'

interface AppState {
  // Estado
  currentUser: User | null
  currentStore: Store | null
  company: Company | null
  stores: Store[]
  users: User[]

  // Estado de Carregamento
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  sidebarOpen: boolean

  // Ações de inicialização
  initialize: () => Promise<void>

  // Ações de sessão
  login: (email: string, pass: string) => Promise<boolean>
  logout: () => Promise<void>
  setCurrentUser: (user: User | null) => void
  setCurrentStore: (store: Store | null) => void

  // Ações de dados
  loadStores: () => Promise<void>
  loadUsers: () => Promise<void>

  // UI
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  clearError: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentUser: null,
      currentStore: null,
      company: null,
      stores: [],
      users: [],
      isLoading: false,
      error: null,
      isInitialized: false,
      sidebarOpen: true,

      // Inicialização
      initialize: async () => {
        try {
          set({ isLoading: true })

          // Verificar sessão atual
          const user = await authService.getCurrentUser()
          if (user) {
            set({ currentUser: user })

            // Carregar dados iniciais se logado
            const stores = await dataService.getStores()

            // Carregar Empresa
            const company = await dataService.getCompany(user.empresaId)

            set({ stores, company })

            // Restaurar loja selecionada se possível
            const currentStoreId = get().currentStore?.id
            if (currentStoreId) {
              const found = stores.find(s => s.id === currentStoreId)
              if (found) set({ currentStore: found })
            }
          }

          set({ isInitialized: true })
        } catch (error: any) {
          console.error('Erro na inicialização:', error)
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },

      // Sessão
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null })
          const { user, error } = await authService.login(email, password)

          if (error) {
            set({ error })
            return false
          }

          if (user) {
            set({ currentUser: user })
            // Carregar dados pós-login
            const stores = await dataService.getStores()
            const company = await dataService.getCompany(user.empresaId)
            set({ stores, company })

            // Selecionar primeira loja por padrão
            if (stores.length > 0) {
              set({ currentStore: stores[0] })
            }
            return true
          }
          return false
        } catch (e: any) {
          set({ error: e.message })
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        await authService.logout()
        set({ currentUser: null, currentStore: null }) // Limpar estado
      },

      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentStore: (store) => set({ currentStore: store }),

      // Carregamento de Dados
      loadStores: async () => {
        try {
          set({ isLoading: true })
          const stores = await dataService.getStores()
          set({ stores })
        } catch (error: any) {
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },

      loadUsers: async () => {
        // Implementar se necessário buscar users da api
      },

      // UI
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'pdv-app-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        currentStore: state.currentStore // Persistir Loja Selecionada
      }),
    }
  )
)
