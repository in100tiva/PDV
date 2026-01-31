"use client"

import { useEffect, useState, useRef } from "react"
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  QrCode,
  CreditCard,
  X,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useProductStore, useCartStore, useAppStore } from "@/stores"
import { formatCurrency } from "@/lib/utils"
import { dataService } from "@/services/data-service"
import type { PaymentMethod, Sale, SaleItem, Payment } from "@/types"
import { supabase } from "@/lib/supabase" // Direct import for HACK

const paymentMethods: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { method: "dinheiro", label: "Dinheiro", icon: <Banknote className="h-5 w-5" /> },
  { method: "pix", label: "PIX", icon: <QrCode className="h-5 w-5" /> },
  { method: "credito", label: "Crédito", icon: <CreditCard className="h-5 w-5" /> },
  { method: "debito", label: "Débito", icon: <CreditCard className="h-5 w-5" /> },
]

export default function PDVPage() {
  const { currentStore, currentUser } = useAppStore()
  const {
    products,
    categories,
    loadAll,
    stocks,
    loadStocks,
    findByBarcode,
    adjustStock,
  } = useProductStore()
  const {
    items,
    subtotal,
    total,
    itemCount,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useCartStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("dinheiro")
  const [receivedAmount, setReceivedAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [saleComplete, setSaleComplete] = useState(false)
  const [lastSale, setLastSale] = useState<{ numero: number; total: number; troco: number } | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadAll()
    if (currentStore) {
      loadStocks(currentStore.id)
    }
  }, [loadAll, loadStocks, currentStore])

  // Foco automático no campo de busca
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Filtrar produtos
  const filteredProducts = products.filter((product) => {
    if (!product.ativo) return false

    if (selectedCategory && product.categoriaId !== selectedCategory) {
      return false
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchesName = product.nome.toLowerCase().includes(term)
      const matchesBarcode = product.codigoBarras?.includes(term)

      if (!matchesName && !matchesBarcode) {
        return false
      }
    }

    return true
  })

  // Busca por código de barras (enter)
  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm) {
      const result = findByBarcode(searchTerm)
      if (result) {
        addItem(result.product, result.variant)
        setSearchTerm("")
      }
    }
  }

  // Adicionar produto ao carrinho
  const handleAddProduct = (product: typeof products[0]) => {
    addItem(product)
    setSearchTerm("")
    searchInputRef.current?.focus()
  }

  // Finalizar venda
  const handleFinishSale = async () => {
    if (!currentStore || !currentUser || items.length === 0) return

    setIsProcessing(true)

    try {
      const now = new Date().toISOString()
      const saleNumber = await dataService.getNextSaleNumber(currentStore.id)

      // Criar venda
      const sale: Partial<Sale> = {
        lojaId: currentStore.id,
        usuarioId: currentUser.id,
        numero: saleNumber,
        status: "finalizada",
        subtotal,
        total,
        createdAt: now,
        updatedAt: now,
      }

      // Preparar itens
      const saleItems: Partial<SaleItem>[] = items.map(item => ({
        produtoId: item.produtoId,
        varianteId: item.varianteId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        precoCusto: item.produto.precoCusto,
        subtotal: item.subtotal,
        createdAt: now,
      }))

      // Executar transação de venda e itens
      const saleSuccess = await dataService.createSale(sale, saleItems)

      if (!saleSuccess) {
        throw new Error("Falha ao criar venda")
      }

      const { data: createdSale } = await supabase.from('sales').select('id').eq('loja_id', currentStore.id).eq('numero', saleNumber).single()

      if (createdSale) {
        // Criar pagamento
        const troco = selectedPaymentMethod === "dinheiro" && receivedAmount
          ? Math.max(0, parseFloat(receivedAmount) - total)
          : 0

        const payment: Partial<Payment> = {
          vendaId: createdSale.id,
          formaPagamento: selectedPaymentMethod,
          valor: total,
          troco: troco > 0 ? troco : undefined,
          createdAt: now,
        }
        await dataService.createPayment(payment)
      }

      // Baixar estoque (Já deve ser tratado pelo Backend/Trigger ou aqui)
      for (const item of items) {
        adjustStock(currentStore.id, item.produtoId, item.varianteId, -item.quantidade)
      }

      // Atualizar estoque na store
      loadStocks(currentStore.id)

      // Mostrar sucesso
      const trocoVal = selectedPaymentMethod === "dinheiro" && receivedAmount
        ? Math.max(0, parseFloat(receivedAmount) - total)
        : 0

      setLastSale({
        numero: saleNumber,
        total,
        troco: trocoVal,
      })
      setSaleComplete(true)
      clearCart()
    } catch (error) {
      console.error("Erro ao finalizar venda:", error)
      alert("Erro ao finalizar venda. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Fechar dialog de sucesso
  const handleCloseSaleComplete = () => {
    setSaleComplete(false)
    setIsPaymentDialogOpen(false)
    setReceivedAmount("")
    setSelectedPaymentMethod("dinheiro")
    setLastSale(null)
    searchInputRef.current?.focus()
  }

  // Calcular troco
  const change = selectedPaymentMethod === "dinheiro" && receivedAmount
    ? Math.max(0, parseFloat(receivedAmount) - total)
    : 0

  const getStock = (productId: string) => {
    if (!currentStore) return null
    return stocks.find((s) => s.produtoId === productId && s.lojaId === currentStore.id)
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-4">
      {/* Painel de produtos */}
      <div className="flex-1 flex flex-col">
        {/* Busca */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar produto ou ler código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleBarcodeSearch}
              className="pl-9 h-12 text-lg"
            />
          </div>
        </div>

        {/* Categorias */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>
          {categories.filter((c) => c.ativa).map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              style={selectedCategory === cat.id ? { backgroundColor: cat.cor } : {}}
            >
              {cat.nome}
            </Button>
          ))}
        </div>

        {/* Grid de produtos */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const stock = getStock(product.id)
              const isOutOfStock = stock && stock.quantidade <= 0

              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${isOutOfStock ? "opacity-50" : ""
                    }`}
                  onClick={() => !isOutOfStock && handleAddProduct(product)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-sm truncate">{product.nome}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(product.precoVenda)}
                      </span>
                      {stock && (
                        <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="text-xs">
                          {stock.quantidade} {product.unidadeMedida}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Carrinho */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrinho
            </span>
            {itemCount > 0 && (
              <Badge variant="secondary">{itemCount} itens</Badge>
            )}
          </CardTitle>
        </CardHeader>

        <Separator />

        {/* Lista de itens */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Carrinho vazio</p>
                <p className="text-sm">Adicione produtos para começar</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.produto.nome}</p>
                    {item.variante && (
                      <p className="text-xs text-muted-foreground">{item.variante.nome}</p>
                    )}
                    <p className="text-sm text-primary font-medium">
                      {formatCurrency(item.precoUnitario)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateItemQuantity(item.id, item.quantidade - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantidade}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateItemQuantity(item.id, item.quantidade + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(item.subtotal)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Totais e ações */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={items.length === 0}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
            <Button
              onClick={() => setIsPaymentDialogOpen(true)}
              disabled={items.length === 0}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Pagar
            </Button>
          </div>
        </div>
      </Card>

      {/* Dialog de pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          {saleComplete ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-success">
                  <Check className="h-6 w-6" />
                  Venda Finalizada!
                </DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {formatCurrency(lastSale?.total || 0)}
                  </p>
                  <p className="text-muted-foreground">Venda #{lastSale?.numero}</p>
                </div>
                {lastSale?.troco && lastSale.troco > 0 && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Troco</p>
                    <p className="text-2xl font-bold">{formatCurrency(lastSale.troco)}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCloseSaleComplete} className="w-full">
                  Nova Venda
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Finalizar Venda</DialogTitle>
                <DialogDescription>
                  Total: <span className="font-bold text-lg">{formatCurrency(total)}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* Forma de pagamento */}
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((pm) => (
                      <Button
                        key={pm.method}
                        variant={selectedPaymentMethod === pm.method ? "default" : "outline"}
                        className="h-16 flex-col gap-1"
                        onClick={() => setSelectedPaymentMethod(pm.method)}
                      >
                        {pm.icon}
                        <span className="text-xs">{pm.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Valor recebido (apenas dinheiro) */}
                {selectedPaymentMethod === "dinheiro" && (
                  <div className="space-y-2">
                    <Label htmlFor="received">Valor Recebido</Label>
                    <Input
                      id="received"
                      type="number"
                      step="0.01"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="0,00"
                      className="text-lg h-12"
                    />
                    {change > 0 && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Troco</p>
                        <p className="text-xl font-bold">{formatCurrency(change)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinishSale}
                  disabled={
                    isProcessing ||
                    (selectedPaymentMethod === "dinheiro" &&
                      !!receivedAmount &&
                      parseFloat(receivedAmount) < total)
                  }
                >
                  {isProcessing ? "Processando..." : "Confirmar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
