import { supabase } from '@/lib/supabase'
import { Product, Store, Sale, SaleItem, Company, Payment, StockMovement, Category } from '@/types'

// Utilitário para converter snake_case (DB) para camelCase (App)
const toCamelCase = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(toCamelCase)
        if (obj !== null && typeof obj === 'object') {
                return Object.keys(obj).reduce((acc, key) => {
                        // Exceções conhecidas ou conversão padrão
                        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
                        acc[camelKey] = toCamelCase(obj[key])
                        return acc
                }, {} as any)
        }
        return obj
}

// Utilitário para converter camelCase (App) para snake_case (DB)
const toSnakeCase = (obj: any): any => {
        if (obj !== null && typeof obj === 'object') {
                return Object.keys(obj).reduce((acc, key) => {
                        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
                        acc[snakeKey] = obj[key]
                        return acc
                }, {} as any)
        }
        return obj
}

export const dataService = {
        // Lojas
        async getStores(): Promise<Store[]> {
                const { data, error } = await supabase.from('stores').select('*')
                if (error) throw error
                return toCamelCase(data)
        },

        async getCompany(id: string): Promise<Company> {
                const { data, error } = await supabase.from('companies').select('*').eq('id', id).single()
                if (error) throw error
                return toCamelCase(data)
        },

        // Produtos
        async getProducts(empresaId: string): Promise<Product[]> {
                const { data, error } = await supabase
                        .from('products')
                        .select('*, product_variants(*)')
                        .eq('empresa_id', empresaId)

                if (error) throw error
                return toCamelCase(data)
        },

        // Categorias
        async getCategories(empresaId: string) {
                const { data, error } = await supabase.from('categories').select('*').eq('empresa_id', empresaId)
                if (error) throw error
                return toCamelCase(data)
        },

        async createCategory(category: Partial<Category>): Promise<Category> {
                const dbCategory = toSnakeCase(category)
                const { data, error } = await supabase
                        .from('categories')
                        .insert(dbCategory)
                        .select()
                        .single()

                if (error) throw error
                return toCamelCase(data)
        },

        async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
                const dbUpdates = toSnakeCase(updates)
                const { data, error } = await supabase
                        .from('categories')
                        .update(dbUpdates)
                        .eq('id', id)
                        .select()
                        .single()

                if (error) throw error
                return toCamelCase(data)
        },

        async deleteCategory(id: string): Promise<void> {
                const { error } = await supabase.from('categories').delete().eq('id', id)
                if (error) throw error
        },

        // Vendas
        async createSale(sale: Partial<Sale>, items: Partial<SaleItem>[]): Promise<boolean> {
                try {
                        // 1. Criar Venda
                        const { data: saleData, error: saleError } = await supabase
                                .from('sales')
                                .insert(toSnakeCase(sale))
                                .select()
                                .single()

                        if (saleError) throw saleError

                        // 2. Criar Itens
                        const itemsWithSaleId = items.map(item => ({
                                ...toSnakeCase(item),
                                venda_id: saleData.id
                        }))

                        const { error: itemsError } = await supabase
                                .from('sale_items')
                                .insert(itemsWithSaleId)

                        if (itemsError) throw itemsError

                        return true
                } catch (error) {
                        console.error('Erro ao criar venda:', error)
                        return false
                }
        },

        // Produtos CRUD (Adicionado)
        async createProduct(product: Partial<Product>): Promise<Product> {
                const dbProduct = toSnakeCase(product)
                const { data, error } = await supabase
                        .from('products')
                        .insert(dbProduct)
                        .select()
                        .single()

                if (error) throw error
                return toCamelCase(data)
        },

        async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
                const dbUpdates = toSnakeCase(updates)
                const { data, error } = await supabase
                        .from('products')
                        .update(dbUpdates)
                        .eq('id', id)
                        .select()
                        .single()

                if (error) throw error
                return toCamelCase(data)
        },

        async deleteProduct(id: string): Promise<void> {
                const { error } = await supabase.from('products').delete().eq('id', id)
                if (error) throw error
        },

        // Pagamentos
        async createPayment(payment: Partial<Payment>): Promise<Payment> {
                const dbPayment = toSnakeCase(payment)
                const { data, error } = await supabase
                        .from('payments')
                        .insert(dbPayment)
                        .select()
                        .single()

                if (error) throw error
                return toCamelCase(data)
        },

        // Contador de Vendas
        async getNextSaleNumber(lojaId: string): Promise<number> {
                // Simples contagem por enquanto. Idealmente, ter uma tabela de sequenciais ou trigger.
                const { count, error } = await supabase
                        .from('sales')
                        .select('*', { count: 'exact', head: true })
                        .eq('loja_id', lojaId)

                if (error) throw error
                return (count || 0) + 1
        },

        // Estoque e Movimentações
        async getStockMovements(lojaId: string): Promise<StockMovement[]> {
                const { data, error } = await supabase
                        .from('stock_movements')
                        .select('*')
                        .eq('loja_id', lojaId)
                        .order('created_at', { ascending: false })
                        .limit(100)

                if (error) throw error
                return toCamelCase(data)
        },

        async createStockMovement(movement: Partial<StockMovement>): Promise<StockMovement> {
                const dbMovement = toSnakeCase(movement)
                const { data, error } = await supabase
                        .from('stock_movements')
                        .insert(dbMovement)
                        .select()
                        .single()

                if (error) throw error
                return toCamelCase(data)
        },

        // Recurso Realtime: Listener de Vendas
        subscribeToSales(lojaId: string, callback: (payload: any) => void) {
                return supabase
                        .channel('sales-channel')
                        .on(
                                'postgres_changes',
                                { event: 'INSERT', schema: 'public', table: 'sales', filter: `loja_id=eq.${lojaId}` },
                                callback
                        )
                        .subscribe()
        }
}
