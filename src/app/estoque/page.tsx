"use client"

import { useEffect, useState } from "react"
import {
  Package,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  History,
  Plus,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProductStore, useAppStore } from "@/stores"
import { formatCurrency, formatDateTime, generateId } from "@/lib/utils"
// import { stockMovementsStorage } from "@/lib/storage" // Removed
import { dataService } from "@/services/data-service"
import type { Stock, StockMovement, StockMovementType } from "@/types"

export default function EstoquePage() {
  const { currentStore, currentUser } = useAppStore()
  const {
    products,
    categories,
    loadAll,
    stocks,
    loadStocks,
    updateStock,
  } = useProductStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "low" | "zero">("all")
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [movementType, setMovementType] = useState<"entrada" | "saida">("entrada")
  const [movementQuantity, setMovementQuantity] = useState("")
  const [movementReason, setMovementReason] = useState("")
  const [movements, setMovements] = useState<StockMovement[]>([])

  useEffect(() => {
    loadAll()
    if (currentStore) {
      loadStocks(currentStore.id)
      loadMovements()
    }
  }, [loadAll, loadStocks, currentStore])

  const loadMovements = async () => {
    if (!currentStore) return
    try {
      const storeMovements = await dataService.getStockMovements(currentStore.id)
      setMovements(storeMovements)
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error)
    }
  }

  // Combinar produtos com estoque
  const productsWithStock = products
    .filter((p) => p.ativo)
    .map((product) => {
      const stock = stocks.find((s) => s.produtoId === product.id && !s.varianteId)
      return {
        product,
        stock,
        isLowStock: stock && stock.quantidadeMinima && stock.quantidade <= stock.quantidadeMinima,
        isZero: stock ? stock.quantidade === 0 : true,
      }
    })
    .filter((item) => {
      // Filtro de busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        if (!item.product.nome.toLowerCase().includes(term)) {
          return false
        }
      }

      // Filtro por tipo
      if (filterType === "low" && !item.isLowStock) return false
      if (filterType === "zero" && !item.isZero) return false

      return true
    })

  const handleOpenMovement = (stock: Stock | undefined, product: typeof products[0]) => {
    if (!stock) {
      // Criar stock se não existir
      const newStock: Stock = {
        id: generateId(), // ID temporário, será criado pelo backend/store se necessário, mas updateStock deve lidar
        lojaId: currentStore!.id,
        produtoId: product.id,
        quantidade: 0,
        updatedAt: new Date().toISOString(),
      }
      setSelectedStock(newStock)
    } else {
      setSelectedStock(stock)
    }
    setMovementType("entrada")
    setMovementQuantity("")
    setMovementReason("")
    setIsMovementDialogOpen(true)
  }

  const handleSaveMovement = async () => {
    if (!selectedStock || !currentStore || !currentUser || !movementQuantity) return

    const quantity = parseFloat(movementQuantity)
    if (isNaN(quantity) || quantity <= 0) return

    const delta = movementType === "entrada" ? quantity : -quantity
    const newQuantity = Math.max(0, (selectedStock.quantidade || 0) + delta)

    try {
      // Atualizar estoque
      await updateStock(currentStore.id, selectedStock.produtoId, undefined, newQuantity)

      // Registrar movimentação
      const movement: Partial<StockMovement> = {
        lojaId: currentStore.id,
        produtoId: selectedStock.produtoId,
        usuarioId: currentUser.id,
        tipo: movementType,
        quantidade: quantity,
        quantidadeAnterior: selectedStock.quantidade || 0,
        quantidadePosterior: newQuantity,
        motivo: movementReason || undefined,
        referenciaTipo: "ajuste_manual",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await dataService.createStockMovement(movement)

      // Recarregar dados
      loadStocks(currentStore.id)
      loadMovements()
      setIsMovementDialogOpen(false)
    } catch (error) {
      console.error("Erro ao salvar movimentação:", error)
      alert("Erro ao salvar movimentação")
    }
  }

  const getProductName = (produtoId: string) => {
    const product = products.find((p) => p.id === produtoId)
    return product?.nome || "Produto desconhecido"
  }

  // Estatísticas
  const stats = {
    total: productsWithStock.length,
    lowStock: productsWithStock.filter((p) => p.isLowStock).length,
    zeroStock: productsWithStock.filter((p) => p.isZero).length,
    totalValue: productsWithStock.reduce((sum, item) => {
      const qty = item.stock?.quantidade || 0
      const cost = item.product.precoCusto || item.product.precoVenda
      return sum + qty * cost
    }, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        <p className="text-muted-foreground">
          Gerencie o estoque dos seus produtos
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-destructive" />
              Sem Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.zeroStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Estoque Atual</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={filterType}
                  onValueChange={(v) => setFilterType(v as typeof filterType)}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="low">Estoque Baixo</SelectItem>
                    <SelectItem value="zero">Sem Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de estoque */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos em Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsWithStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    productsWithStock.map(({ product, stock, isLowStock, isZero }) => {
                      const qty = stock?.quantidade || 0
                      const cost = product.precoCusto || product.precoVenda
                      const totalValue = qty * cost

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.codigoBarras || product.codigoInterno || "-"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">{qty}</span>
                            <span className="text-muted-foreground ml-1">{product.unidadeMedida}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {stock?.quantidadeMinima || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(cost)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(totalValue)}
                          </TableCell>
                          <TableCell className="text-center">
                            {isZero ? (
                              <Badge variant="destructive">Zerado</Badge>
                            ) : isLowStock ? (
                              <Badge variant="warning">Baixo</Badge>
                            ) : (
                              <Badge variant="success">Normal</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenMovement(stock, product)}
                              >
                                <Plus className="h-4 w-4 text-success" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setMovementType("saida")
                                  handleOpenMovement(stock, product)
                                }}
                                disabled={qty === 0}
                              >
                                <Minus className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Movimentações
              </CardTitle>
              <CardDescription>
                Últimas movimentações de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Anterior</TableHead>
                    <TableHead className="text-right">Posterior</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhuma movimentação registrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.slice(0, 50).map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-sm">
                          {formatDateTime(mov.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getProductName(mov.produtoId)}
                        </TableCell>
                        <TableCell>
                          {mov.tipo === "entrada" ? (
                            <Badge variant="success" className="gap-1">
                              <ArrowUpCircle className="h-3 w-3" />
                              Entrada
                            </Badge>
                          ) : mov.tipo === "saida" ? (
                            <Badge variant="destructive" className="gap-1">
                              <ArrowDownCircle className="h-3 w-3" />
                              Saída
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{mov.tipo}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {mov.tipo === "entrada" ? "+" : "-"}{mov.quantidade}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {mov.quantidadeAnterior}
                        </TableCell>
                        <TableCell className="text-right">
                          {mov.quantidadePosterior}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mov.motivo || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de movimentação */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === "entrada" ? "Entrada de Estoque" : "Saída de Estoque"}
            </DialogTitle>
            <DialogDescription>
              {selectedStock && getProductName(selectedStock.produtoId)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={movementType === "entrada" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setMovementType("entrada")}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Entrada
              </Button>
              <Button
                variant={movementType === "saida" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setMovementType("saida")}
              >
                <ArrowDownCircle className="h-4 w-4" />
                Saída
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Estoque Atual</Label>
              <div className="text-2xl font-bold">
                {selectedStock?.quantidade || 0} unidades
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                min="1"
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input
                id="reason"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="Ex: Compra de fornecedor, Perda, Ajuste..."
              />
            </div>

            {movementQuantity && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Novo estoque</p>
                <p className="text-xl font-bold">
                  {Math.max(
                    0,
                    (selectedStock?.quantidade || 0) +
                    (movementType === "entrada" ? 1 : -1) * parseFloat(movementQuantity || "0")
                  )}{" "}
                  unidades
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMovement}
              disabled={!movementQuantity || parseFloat(movementQuantity) <= 0}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
