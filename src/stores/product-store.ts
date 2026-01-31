import { create } from 'zustand'
import type { Product, ProductVariant, Category, Stock, ProductWithDetails } from '@/types'
import { dataService } from '@/services/data-service'
import { supabase } from '@/lib/supabase' // Fallback para o que não estiver no service
import { useAppStore } from './app-store'

interface ProductState {
  // Estado
  products: Product[]
  variants: ProductVariant[]
  categories: Category[]
  stocks: Stock[]
  isLoading: boolean
  error: string | null
  searchTerm: string
  selectedCategory: string | null

  // Ações de carregamento
  loadAll: () => Promise<void>
  loadStocks: (lojaId: string) => Promise<void>
  loadCategories: () => Promise<void>

  // Ações de produtos
  addProduct: (product: Partial<Product>) => Promise<void>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>

  // Ações de categorias
  addCategory: (category: Partial<Category>) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Ações de variantes (TODO: Mover para dataService)
  // ... por simplicidade, manteremos vazios ou TODOs por enquanto, focando no principal

  // Ações de estoque
  updateStock: (lojaId: string, produtoId: string, varianteId: string | undefined, newQuantity: number) => Promise<void>
  adjustStock: (lojaId: string, produtoId: string, varianteId: string | undefined, delta: number) => Promise<void>

  // Busca
  setSearchTerm: (term: string) => void
  setSelectedCategory: (categoryId: string | null) => void
  getFilteredProducts: () => Product[]
  findByBarcode: (code: string) => { product: Product; variant?: ProductVariant } | null
}

export const useProductStore = create<ProductState>()((set, get) => ({
  // Estado inicial
  products: [],
  variants: [],
  categories: [],
  stocks: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  selectedCategory: null,

  // Carregamento
  loadAll: async () => {
    try {
      set({ isLoading: true, error: null })
      const { company } = useAppStore.getState()
      if (!company) return

      // Carregar produtos e categorias em paralelo
      const [products, categories] = await Promise.all([
        dataService.getProducts(company.id),
        dataService.getCategories(company.id)
      ])

      set({ products, categories })
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error)
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  loadStocks: async (lojaId: string) => {
    try {
      // TODO: Adicionar getStocks no dataService
      const { data, error } = await supabase.from('stock').select('*').eq('loja_id', lojaId)
      if (error) throw error
      // Mapeamento manual rápido ou adicionar transformer
      const stocks = data.map((s: any) => ({
        id: s.id,
        lojaId: s.loja_id,
        produtoId: s.produto_id,
        varianteId: s.variante_id,
        quantidade: s.quantidade,
        quantidadeMinima: s.quantidade_minima,
        updatedAt: s.updated_at
      }))
      set({ stocks })
    } catch (e) {
      console.error(e)
    }
  },

  loadCategories: async () => {
    try {
      const { company } = useAppStore.getState()
      if (!company) return
      set({ isLoading: true })
      const categories = await dataService.getCategories(company.id)
      set({ categories })
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Categorias
  addCategory: async (categoryData) => {
    try {
      set({ isLoading: true })
      const newCategory = await dataService.createCategory(categoryData)
      set((state) => ({ categories: [...state.categories, newCategory] }))
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  updateCategory: async (id, updates) => {
    try {
      set({ isLoading: true })
      const updated = await dataService.updateCategory(id, updates)
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? updated : c))
      }))
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  deleteCategory: async (id) => {
    try {
      set({ isLoading: true })
      await dataService.deleteCategory(id)
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id)
      }))
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  // Produtos
  addProduct: async (productData) => {
    try {
      set({ isLoading: true })
      const newProduct = await dataService.createProduct(productData)
      set((state) => ({ products: [...state.products, newProduct] }))
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  updateProduct: async (id, updates) => {
    try {
      set({ isLoading: true })
      const updated = await dataService.updateProduct(id, updates)
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updated : p)),
      }))
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  deleteProduct: async (id) => {
    try {
      set({ isLoading: true })
      await dataService.deleteProduct(id)
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }))
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  // Busca (Mantida Síncrona no Client)
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

  getFilteredProducts: () => {
    const { products, searchTerm, selectedCategory } = get()

    return products.filter((product) => {
      if (!product.ativo) return false
      if (selectedCategory && product.categoriaId !== selectedCategory) return false

      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchesName = product.nome.toLowerCase().includes(term)
        const matchesCode = product.codigoBarras?.includes(term) || product.codigoInterno?.toLowerCase().includes(term)

        if (!matchesName && !matchesCode) return false
      }
      return true
    })
  },

  // Helpers
  findByBarcode: (code: string) => {
    const { products, variants } = get()
    // Busca exata em produtos
    const product = products.find(p => p.codigoBarras === code || p.codigoInterno === code)
    if (product) return { product, variant: undefined }

    // Busca em variantes
    const variant = variants.find(v => v.codigoBarras === code)
    if (variant) {
      const prod = products.find(p => p.id === variant.produtoId)
      if (prod) return { product: prod, variant }
    }
    return null
  },

  updateStock: async (lojaId: string, produtoId: string, varianteId: string | undefined, newQuantity: number) => {
    // Atualiza via Supabase (upsert)
    try {
      // Precisamos do ID do stock se existir.
      const { stocks } = get()
      const existingStock = stocks.find(s => s.lojaId === lojaId && s.produtoId === produtoId && s.varianteId === varianteId)

      const stockData = {
        loja_id: lojaId,
        produto_id: produtoId,
        variante_id: varianteId || null,
        quantidade: newQuantity,
        // Se já existir, mantemos o ID, senão geramos (mas o banco deveria gerar ou upsert por unique key)
        // Supabase upsert:
        // Precisa de unique constraint em (loja_id, produto_id, variante_id)
      }

      // Se tiver ID, usa para update direto, senão tenta upsert
      const query = supabase.from('stock').upsert(stockData, { onConflict: 'loja_id, produto_id, variante_id' }).select()

      const { data, error } = await query.single()

      if (error) throw error

      // Atualiza localmente
      await get().loadStocks(lojaId)
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error)
    }
  },

  adjustStock: async (lojaId, produtoId, varianteId, delta) => {
    const { stocks, updateStock } = get()
    const stock = stocks.find(s => s.lojaId === lojaId && s.produtoId === produtoId && s.varianteId === varianteId)
    const currentQty = stock?.quantidade || 0
    const newQty = Math.max(0, currentQty + delta)
    await updateStock(lojaId, produtoId, varianteId, newQty)
  }
}))
