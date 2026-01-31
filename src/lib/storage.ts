// ==========================================
// SERVIÇO DE ARMAZENAMENTO LOCAL
// ==========================================
// Este serviço será substituído pelo Supabase posteriormente
// Por enquanto usa localStorage para persistência

const STORAGE_PREFIX = 'pdv_'

export const StorageKeys = {
  COMPANY: 'company',
  STORES: 'stores',
  USERS: 'users',
  USER_STORES: 'user_stores',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  PRODUCT_VARIANTS: 'product_variants',
  STOCK: 'stock',
  STOCK_MOVEMENTS: 'stock_movements',
  STOCK_ALERTS: 'stock_alerts',
  CUSTOMERS: 'customers',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items',
  PAYMENTS: 'payments',
  CREDIT_SALES: 'credit_sales',
  CREDIT_PAYMENTS: 'credit_payments',
  INVOICES: 'invoices',
  CASH_REGISTERS: 'cash_registers',
  CASH_MOVEMENTS: 'cash_movements',
  SETTINGS: 'settings',
  CURRENT_USER: 'current_user',
  CURRENT_STORE: 'current_store',
  SALE_COUNTER: 'sale_counter',
} as const

type StorageKey = typeof StorageKeys[keyof typeof StorageKeys]

function getKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`
}

// Verifica se estamos no navegador
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Funções genéricas de storage
export function getItem<T>(key: StorageKey): T | null {
  if (!isBrowser()) return null

  try {
    const item = localStorage.getItem(getKey(key))
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error)
    return null
  }
}

export function setItem<T>(key: StorageKey, value: T): void {
  if (!isBrowser()) return

  try {
    localStorage.setItem(getKey(key), JSON.stringify(value))
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error)
  }
}

export function removeItem(key: StorageKey): void {
  if (!isBrowser()) return

  try {
    localStorage.removeItem(getKey(key))
  } catch (error) {
    console.error(`Erro ao remover ${key} do localStorage:`, error)
  }
}

export function clearAll(): void {
  if (!isBrowser()) return

  try {
    Object.values(StorageKeys).forEach(key => {
      localStorage.removeItem(getKey(key))
    })
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error)
  }
}

// ==========================================
// CRUD GENÉRICO PARA ENTIDADES
// ==========================================

export interface CrudOptions<T> {
  key: StorageKey
  idField?: keyof T
}

export function createCrud<T extends { id: string }>(options: CrudOptions<T>) {
  const { key, idField = 'id' } = options

  return {
    // Listar todos
    getAll(): T[] {
      return getItem<T[]>(key) || []
    },

    // Buscar por ID
    getById(id: string): T | null {
      const items = this.getAll()
      return items.find(item => item[idField] === id) || null
    },

    // Buscar por campo
    findBy<K extends keyof T>(field: K, value: T[K]): T[] {
      const items = this.getAll()
      return items.filter(item => item[field] === value)
    },

    // Buscar primeiro por campo
    findFirstBy<K extends keyof T>(field: K, value: T[K]): T | null {
      const items = this.getAll()
      return items.find(item => item[field] === value) || null
    },

    // Criar
    create(item: T): T {
      const items = this.getAll()
      items.push(item)
      setItem(key, items)
      return item
    },

    // Criar múltiplos
    createMany(newItems: T[]): T[] {
      const items = this.getAll()
      items.push(...newItems)
      setItem(key, items)
      return newItems
    },

    // Atualizar
    update(id: string, updates: Partial<T>): T | null {
      const items = this.getAll()
      const index = items.findIndex(item => item[idField] === id)

      if (index === -1) return null

      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() }
      setItem(key, items)
      return items[index]
    },

    // Deletar
    delete(id: string): boolean {
      const items = this.getAll()
      const filteredItems = items.filter(item => item[idField] !== id)

      if (filteredItems.length === items.length) return false

      setItem(key, filteredItems)
      return true
    },

    // Deletar múltiplos
    deleteMany(ids: string[]): number {
      const items = this.getAll()
      const filteredItems = items.filter(item => !ids.includes(item[idField] as string))
      const deletedCount = items.length - filteredItems.length

      setItem(key, filteredItems)
      return deletedCount
    },

    // Deletar por campo
    deleteBy<K extends keyof T>(field: K, value: T[K]): number {
      const items = this.getAll()
      const filteredItems = items.filter(item => item[field] !== value)
      const deletedCount = items.length - filteredItems.length

      setItem(key, filteredItems)
      return deletedCount
    },

    // Substituir todos
    setAll(items: T[]): void {
      setItem(key, items)
    },

    // Contar
    count(): number {
      return this.getAll().length
    },

    // Limpar todos
    clear(): void {
      setItem(key, [])
    }
  }
}

// ==========================================
// INSTÂNCIAS DE CRUD PARA CADA ENTIDADE
// ==========================================

import type {
  Company,
  Store,
  User,
  UserStore,
  Category,
  Product,
  ProductVariant,
  Stock,
  StockMovement,
  StockAlert,
  Customer,
  Sale,
  SaleItem,
  Payment,
  CreditSale,
  CreditPayment,
  Invoice,
  CashRegister,
  CashMovement,
  Settings,
} from '@/types'

export const companyStorage = {
  get(): Company | null {
    return getItem<Company>(StorageKeys.COMPANY)
  },
  set(company: Company): void {
    setItem(StorageKeys.COMPANY, company)
  },
  clear(): void {
    removeItem(StorageKeys.COMPANY)
  }
}

export const storesStorage = createCrud<Store>({ key: StorageKeys.STORES })
export const usersStorage = createCrud<User>({ key: StorageKeys.USERS })
export const userStoresStorage = createCrud<UserStore>({ key: StorageKeys.USER_STORES })
export const categoriesStorage = createCrud<Category>({ key: StorageKeys.CATEGORIES })
export const productsStorage = createCrud<Product>({ key: StorageKeys.PRODUCTS })
export const productVariantsStorage = createCrud<ProductVariant>({ key: StorageKeys.PRODUCT_VARIANTS })
export const stockStorage = createCrud<Stock>({ key: StorageKeys.STOCK })
export const stockMovementsStorage = createCrud<StockMovement>({ key: StorageKeys.STOCK_MOVEMENTS })
export const stockAlertsStorage = createCrud<StockAlert>({ key: StorageKeys.STOCK_ALERTS })
export const customersStorage = createCrud<Customer>({ key: StorageKeys.CUSTOMERS })
export const salesStorage = createCrud<Sale>({ key: StorageKeys.SALES })
export const saleItemsStorage = createCrud<SaleItem>({ key: StorageKeys.SALE_ITEMS })
export const paymentsStorage = createCrud<Payment>({ key: StorageKeys.PAYMENTS })
export const creditSalesStorage = createCrud<CreditSale>({ key: StorageKeys.CREDIT_SALES })
export const creditPaymentsStorage = createCrud<CreditPayment>({ key: StorageKeys.CREDIT_PAYMENTS })
export const invoicesStorage = createCrud<Invoice>({ key: StorageKeys.INVOICES })
export const cashRegistersStorage = createCrud<CashRegister>({ key: StorageKeys.CASH_REGISTERS })
export const cashMovementsStorage = createCrud<CashMovement>({ key: StorageKeys.CASH_MOVEMENTS })
export const settingsStorage = createCrud<Settings>({ key: StorageKeys.SETTINGS })

// ==========================================
// SESSÃO DO USUÁRIO
// ==========================================

export const sessionStorage = {
  getCurrentUser(): User | null {
    return getItem<User>(StorageKeys.CURRENT_USER)
  },
  setCurrentUser(user: User | null): void {
    if (user) {
      setItem(StorageKeys.CURRENT_USER, user)
    } else {
      removeItem(StorageKeys.CURRENT_USER)
    }
  },
  getCurrentStore(): Store | null {
    return getItem<Store>(StorageKeys.CURRENT_STORE)
  },
  setCurrentStore(store: Store | null): void {
    if (store) {
      setItem(StorageKeys.CURRENT_STORE, store)
    } else {
      removeItem(StorageKeys.CURRENT_STORE)
    }
  },
  clear(): void {
    removeItem(StorageKeys.CURRENT_USER)
    removeItem(StorageKeys.CURRENT_STORE)
  }
}

// ==========================================
// CONTADOR DE VENDAS
// ==========================================

export const saleCounterStorage = {
  get(lojaId: string): number {
    const counters = getItem<Record<string, number>>(StorageKeys.SALE_COUNTER) || {}
    return counters[lojaId] || 0
  },
  increment(lojaId: string): number {
    const counters = getItem<Record<string, number>>(StorageKeys.SALE_COUNTER) || {}
    counters[lojaId] = (counters[lojaId] || 0) + 1
    setItem(StorageKeys.SALE_COUNTER, counters)
    return counters[lojaId]
  }
}

// ==========================================
// INICIALIZAÇÃO COM DADOS DE EXEMPLO
// ==========================================

export function initializeDemoData(): void {
  // Verifica se já existe empresa
  if (companyStorage.get()) return

  const now = new Date().toISOString()

  // Criar empresa
  const company: Company = {
    id: crypto.randomUUID(),
    nome: 'Minha Empresa',
    cnpj: '00.000.000/0001-00',
    razaoSocial: 'Minha Empresa LTDA',
    email: 'contato@minhaempresa.com',
    telefone: '(11) 99999-9999',
    createdAt: now,
    updatedAt: now,
  }
  companyStorage.set(company)

  // Criar loja
  const store: Store = {
    id: crypto.randomUUID(),
    empresaId: company.id,
    nome: 'Loja Principal',
    codigo: 'LP001',
    endereco: {
      rua: 'Rua Principal',
      numero: '123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000',
    },
    telefone: '(11) 3333-3333',
    ativa: true,
    createdAt: now,
    updatedAt: now,
  }
  storesStorage.create(store)

  // Criar usuário admin
  const admin: User = {
    id: crypto.randomUUID(),
    empresaId: company.id,
    email: 'admin@minhaempresa.com',
    nome: 'Administrador',
    cargo: 'admin',
    ativo: true,
    createdAt: now,
    updatedAt: now,
  }
  usersStorage.create(admin)

  // Vincular admin à loja
  const userStore: UserStore = {
    id: crypto.randomUUID(),
    userId: admin.id,
    storeId: store.id,
    createdAt: now,
  }
  userStoresStorage.create(userStore)

  // Criar categorias
  const categorias: Category[] = [
    { id: crypto.randomUUID(), empresaId: company.id, nome: 'Bebidas', cor: '#3B82F6', icone: 'wine', ordem: 1, ativa: true, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), empresaId: company.id, nome: 'Alimentos', cor: '#22C55E', icone: 'utensils', ordem: 2, ativa: true, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), empresaId: company.id, nome: 'Limpeza', cor: '#A855F7', icone: 'spray-can', ordem: 3, ativa: true, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), empresaId: company.id, nome: 'Carvão e Churrasqueira', cor: '#F97316', icone: 'flame', ordem: 4, ativa: true, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), empresaId: company.id, nome: 'Diversos', cor: '#6B7280', icone: 'package', ordem: 5, ativa: true, createdAt: now, updatedAt: now },
  ]
  categoriesStorage.createMany(categorias)

  // Criar alguns produtos de exemplo
  const produtos: Product[] = [
    {
      id: crypto.randomUUID(),
      empresaId: company.id,
      categoriaId: categorias[0].id,
      nome: 'Coca-Cola',
      codigoBarras: '7894900010015',
      unidadeMedida: 'un',
      precoCusto: 4.50,
      precoVenda: 6.00,
      margemLucro: 33.33,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      empresaId: company.id,
      categoriaId: categorias[0].id,
      nome: 'Cerveja Brahma',
      codigoBarras: '7891149100019',
      unidadeMedida: 'un',
      precoCusto: 3.00,
      precoVenda: 5.00,
      margemLucro: 40,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      empresaId: company.id,
      categoriaId: categorias[3].id,
      nome: 'Carvão Vegetal 3kg',
      codigoBarras: '7891234567890',
      unidadeMedida: 'un',
      precoCusto: 12.00,
      precoVenda: 18.00,
      margemLucro: 50,
      ativo: true,
      createdAt: now,
      updatedAt: now,
    },
  ]
  productsStorage.createMany(produtos)

  // Criar variantes para Coca-Cola
  const variantes: ProductVariant[] = [
    { id: crypto.randomUUID(), produtoId: produtos[0].id, nome: '350ml', codigoBarras: '7894900010015', precoVenda: 4.50, ativo: true, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), produtoId: produtos[0].id, nome: '600ml', codigoBarras: '7894900010022', precoVenda: 6.00, ativo: true, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), produtoId: produtos[0].id, nome: '2L', codigoBarras: '7894900010039', precoVenda: 10.00, ativo: true, createdAt: now, updatedAt: now },
  ]
  productVariantsStorage.createMany(variantes)

  // Criar estoque inicial
  const estoques: Stock[] = [
    { id: crypto.randomUUID(), lojaId: store.id, produtoId: produtos[0].id, varianteId: variantes[0].id, quantidade: 50, quantidadeMinima: 10, updatedAt: now },
    { id: crypto.randomUUID(), lojaId: store.id, produtoId: produtos[0].id, varianteId: variantes[1].id, quantidade: 30, quantidadeMinima: 10, updatedAt: now },
    { id: crypto.randomUUID(), lojaId: store.id, produtoId: produtos[0].id, varianteId: variantes[2].id, quantidade: 20, quantidadeMinima: 5, updatedAt: now },
    { id: crypto.randomUUID(), lojaId: store.id, produtoId: produtos[1].id, quantidade: 100, quantidadeMinima: 20, updatedAt: now },
    { id: crypto.randomUUID(), lojaId: store.id, produtoId: produtos[2].id, quantidade: 15, quantidadeMinima: 5, updatedAt: now },
  ]
  stockStorage.createMany(estoques)

  // Definir sessão inicial
  sessionStorage.setCurrentUser(admin)
  sessionStorage.setCurrentStore(store)
}
