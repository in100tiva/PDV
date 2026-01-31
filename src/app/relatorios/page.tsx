"use client"

import { useEffect, useState } from "react"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore, useProductStore } from "@/stores"
import { formatCurrency, formatDate } from "@/lib/utils"
import { salesStorage, saleItemsStorage, paymentsStorage } from "@/lib/storage"
import type { Sale, SaleItem, Payment, PaymentMethod } from "@/types"

type PeriodType = "today" | "week" | "month" | "year"

interface SalesData {
  sales: Sale[]
  items: SaleItem[]
  payments: Payment[]
}

interface DailySales {
  date: string
  total: number
  count: number
}

interface ProductSales {
  productId: string
  productName: string
  quantity: number
  total: number
}

interface PaymentSummary {
  method: PaymentMethod
  total: number
  count: number
}

export default function RelatoriosPage() {
  const { currentStore } = useAppStore()
  const { products, loadAll } = useProductStore()
  const [period, setPeriod] = useState<PeriodType>("month")
  const [salesData, setSalesData] = useState<SalesData>({ sales: [], items: [], payments: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!currentStore) return

    setIsLoading(true)

    // Calcular datas do período
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    // Carregar dados
    const allSales = salesStorage.getAll()
    const allItems = saleItemsStorage.getAll()
    const allPayments = paymentsStorage.getAll()

    const filteredSales = allSales.filter((s) => {
      if (s.lojaId !== currentStore.id) return false
      if (s.status !== "finalizada") return false
      const saleDate = new Date(s.createdAt)
      return saleDate >= startDate && saleDate <= now
    })

    const saleIds = new Set(filteredSales.map((s) => s.id))
    const filteredItems = allItems.filter((i) => saleIds.has(i.vendaId))
    const filteredPayments = allPayments.filter((p) => saleIds.has(p.vendaId))

    setSalesData({
      sales: filteredSales,
      items: filteredItems,
      payments: filteredPayments,
    })
    setIsLoading(false)
  }, [currentStore, period])

  // Calcular estatísticas
  const totalSales = salesData.sales.reduce((sum, s) => sum + s.total, 0)
  const totalCount = salesData.sales.length
  const averageTicket = totalCount > 0 ? totalSales / totalCount : 0

  // Calcular lucro (estimado)
  const totalProfit = salesData.items.reduce((sum, item) => {
    const cost = item.precoCusto || 0
    const profit = item.subtotal - cost * item.quantidade
    return sum + profit
  }, 0)

  // Vendas por dia
  const dailySales: DailySales[] = []
  const salesByDate = new Map<string, { total: number; count: number }>()

  salesData.sales.forEach((sale) => {
    const date = formatDate(sale.createdAt)
    const existing = salesByDate.get(date) || { total: 0, count: 0 }
    salesByDate.set(date, {
      total: existing.total + sale.total,
      count: existing.count + 1,
    })
  })

  salesByDate.forEach((value, date) => {
    dailySales.push({ date, ...value })
  })
  dailySales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Produtos mais vendidos
  const productSalesMap = new Map<string, { quantity: number; total: number }>()

  salesData.items.forEach((item) => {
    const existing = productSalesMap.get(item.produtoId) || { quantity: 0, total: 0 }
    productSalesMap.set(item.produtoId, {
      quantity: existing.quantity + item.quantidade,
      total: existing.total + item.subtotal,
    })
  })

  const topProducts: ProductSales[] = []
  productSalesMap.forEach((value, productId) => {
    const product = products.find((p) => p.id === productId)
    topProducts.push({
      productId,
      productName: product?.nome || "Produto desconhecido",
      ...value,
    })
  })
  topProducts.sort((a, b) => b.quantity - a.quantity)

  // Pagamentos por forma
  const paymentSummary: PaymentSummary[] = []
  const paymentMap = new Map<PaymentMethod, { total: number; count: number }>()

  salesData.payments.forEach((payment) => {
    const existing = paymentMap.get(payment.formaPagamento) || { total: 0, count: 0 }
    paymentMap.set(payment.formaPagamento, {
      total: existing.total + payment.valor,
      count: existing.count + 1,
    })
  })

  paymentMap.forEach((value, method) => {
    paymentSummary.push({ method, ...value })
  })
  paymentSummary.sort((a, b) => b.total - a.total)

  const getPaymentLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      dinheiro: "Dinheiro",
      pix: "PIX",
      credito: "Crédito",
      debito: "Débito",
      fiado: "Fiado",
    }
    return labels[method]
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return "Hoje"
      case "week":
        return "Últimos 7 dias"
      case "month":
        return "Este mês"
      case "year":
        return "Este ano"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise de vendas e desempenho
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Últimos 7 dias</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quantidade de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">vendas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
            <p className="text-xs text-muted-foreground">por venda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Estimado</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              margem: {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Vendas por Dia</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="payments">Formas de Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Dia</CardTitle>
              <CardDescription>Resumo diário de vendas no período</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhuma venda no período
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailySales.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">{day.date}</TableCell>
                        <TableCell className="text-right">{day.count}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(day.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(day.total / day.count)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Mais vendidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Mais Vendidos
                </CardTitle>
                <CardDescription>Produtos com maior volume de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          Nenhum produto vendido
                        </TableCell>
                      </TableRow>
                    ) : (
                      topProducts.slice(0, 10).map((product, index) => (
                        <TableRow key={product.productId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 justify-center">
                                {index + 1}
                              </Badge>
                              <span className="font-medium">{product.productName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(product.total)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Menos vendidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  Menos Vendidos
                </CardTitle>
                <CardDescription>Produtos com menor volume de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          Nenhum produto vendido
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...topProducts]
                        .sort((a, b) => a.quantity - b.quantity)
                        .slice(0, 10)
                        .map((product) => (
                          <TableRow key={product.productId}>
                            <TableCell className="font-medium">{product.productName}</TableCell>
                            <TableCell className="text-right">{product.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(product.total)}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
              <CardDescription>Distribuição por forma de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Forma</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentSummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum pagamento no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      paymentSummary.map((payment) => {
                        const percentage = totalSales > 0 ? (payment.total / totalSales) * 100 : 0
                        return (
                          <TableRow key={payment.method}>
                            <TableCell className="font-medium">
                              {getPaymentLabel(payment.method)}
                            </TableCell>
                            <TableCell className="text-right">{payment.count}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(payment.total)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Gráfico visual simples */}
                <div className="space-y-4">
                  <h4 className="font-medium">Distribuição</h4>
                  {paymentSummary.map((payment) => {
                    const percentage = totalSales > 0 ? (payment.total / totalSales) * 100 : 0
                    return (
                      <div key={payment.method} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{getPaymentLabel(payment.method)}</span>
                          <span className="font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
