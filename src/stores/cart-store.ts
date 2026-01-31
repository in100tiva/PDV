import { create } from 'zustand'
import type { CartItem, Customer, Product, ProductVariant, DiscountType } from '@/types'
import { generateId } from '@/lib/utils'

interface CartState {
  // Estado do carrinho
  items: CartItem[]
  cliente: Customer | null
  descontoTipo: DiscountType | null
  descontoValor: number
  observacoes: string

  // Computed
  subtotal: number
  descontoTotal: number
  total: number
  itemCount: number

  // Ações
  addItem: (produto: Product, variante?: ProductVariant, quantidade?: number) => void
  updateItemQuantity: (itemId: string, quantidade: number) => void
  removeItem: (itemId: string) => void
  setItemDiscount: (itemId: string, tipo: DiscountType, valor: number) => void
  removeItemDiscount: (itemId: string) => void

  setCliente: (cliente: Customer | null) => void
  setDesconto: (tipo: DiscountType | null, valor: number) => void
  setObservacoes: (observacoes: string) => void

  clearCart: () => void

  // Helpers
  getItemByProductId: (produtoId: string, varianteId?: string) => CartItem | undefined
  recalculate: () => void
}

function calculateItemSubtotal(item: CartItem): number {
  const baseTotal = item.quantidade * item.precoUnitario

  if (!item.descontoTipo || !item.descontoValor) {
    return baseTotal
  }

  if (item.descontoTipo === 'percentual') {
    return baseTotal * (1 - item.descontoValor / 100)
  }

  return Math.max(0, baseTotal - item.descontoValor)
}

function calculateDiscount(subtotal: number, tipo: DiscountType | null, valor: number): number {
  if (!tipo || !valor) return 0

  if (tipo === 'percentual') {
    return subtotal * (valor / 100)
  }

  return Math.min(subtotal, valor)
}

export const useCartStore = create<CartState>()((set, get) => ({
  // Estado inicial
  items: [],
  cliente: null,
  descontoTipo: null,
  descontoValor: 0,
  observacoes: '',
  subtotal: 0,
  descontoTotal: 0,
  total: 0,
  itemCount: 0,

  // Adicionar item
  addItem: (produto, variante, quantidade = 1) => {
    const { items } = get()
    const existingItem = items.find(
      (item) => item.produtoId === produto.id && item.varianteId === (variante?.id || undefined)
    )

    if (existingItem) {
      // Atualizar quantidade se já existe
      set((state) => ({
        items: state.items.map((item) =>
          item.id === existingItem.id
            ? {
                ...item,
                quantidade: item.quantidade + quantidade,
                subtotal: calculateItemSubtotal({
                  ...item,
                  quantidade: item.quantidade + quantidade,
                }),
              }
            : item
        ),
      }))
    } else {
      // Adicionar novo item
      const precoUnitario = variante?.precoVenda ?? produto.precoVenda
      const newItem: CartItem = {
        id: generateId(),
        produtoId: produto.id,
        varianteId: variante?.id,
        produto,
        variante,
        quantidade,
        precoUnitario,
        subtotal: quantidade * precoUnitario,
      }

      set((state) => ({
        items: [...state.items, newItem],
      }))
    }

    get().recalculate()
  },

  // Atualizar quantidade
  updateItemQuantity: (itemId, quantidade) => {
    if (quantidade <= 0) {
      get().removeItem(itemId)
      return
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantidade,
              subtotal: calculateItemSubtotal({ ...item, quantidade }),
            }
          : item
      ),
    }))

    get().recalculate()
  },

  // Remover item
  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }))

    get().recalculate()
  },

  // Aplicar desconto no item
  setItemDiscount: (itemId, tipo, valor) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item

        const updatedItem = { ...item, descontoTipo: tipo, descontoValor: valor }
        return {
          ...updatedItem,
          subtotal: calculateItemSubtotal(updatedItem),
        }
      }),
    }))

    get().recalculate()
  },

  // Remover desconto do item
  removeItemDiscount: (itemId) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item

        const updatedItem = {
          ...item,
          descontoTipo: undefined,
          descontoValor: undefined,
        }
        return {
          ...updatedItem,
          subtotal: calculateItemSubtotal(updatedItem),
        }
      }),
    }))

    get().recalculate()
  },

  // Definir cliente
  setCliente: (cliente) => {
    set({ cliente })
  },

  // Definir desconto geral
  setDesconto: (tipo, valor) => {
    set({ descontoTipo: tipo, descontoValor: valor })
    get().recalculate()
  },

  // Definir observações
  setObservacoes: (observacoes) => {
    set({ observacoes })
  },

  // Limpar carrinho
  clearCart: () => {
    set({
      items: [],
      cliente: null,
      descontoTipo: null,
      descontoValor: 0,
      observacoes: '',
      subtotal: 0,
      descontoTotal: 0,
      total: 0,
      itemCount: 0,
    })
  },

  // Buscar item por produto
  getItemByProductId: (produtoId, varianteId) => {
    const { items } = get()
    return items.find(
      (item) => item.produtoId === produtoId && item.varianteId === varianteId
    )
  },

  // Recalcular totais
  recalculate: () => {
    const { items, descontoTipo, descontoValor } = get()

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const descontoTotal = calculateDiscount(subtotal, descontoTipo, descontoValor)
    const total = subtotal - descontoTotal
    const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0)

    set({ subtotal, descontoTotal, total, itemCount })
  },
}))
