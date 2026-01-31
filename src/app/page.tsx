"use client"

import { useEffect, useState } from "react"
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore, useProductStore } from "@/stores"
import { formatCurrency } from "@/lib/utils"
// import { salesStorage, customersStorage, stockStorage } from "@/lib/storage" // Removed
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface DashboardStats {
  vendasHoje: number
  vendasValor: number
  produtosAtivos: number
  produtosBaixoEstoque: number
  clientesTotal: number
  ticketMedio: number
}

export default function DashboardPage() {
  const { currentStore } = useAppStore()
  const { products, loadAll, stocks, loadStocks } = useProductStore()
  const [stats, setStats] = useState<DashboardStats>({
    vendasHoje: 0,
    vendasValor: 0,
    produtosAtivos: 0,
    produtosBaixoEstoque: 0,
    clientesTotal: 0,
    ticketMedio: 0,
  })
  const [lowStockProducts, setLowStockProducts] = useState<Array<{
    id: string
    nome: string
    quantidade: number
    minimo: number
  }>>([])

  useEffect(() => {
    loadAll()
    if (currentStore) {
      loadStocks(currentStore.id)
    }
  }, [loadAll, loadStocks, currentStore])

  useEffect(() => {
    async function loadDashboardStats() {
      if (!currentStore) return

      // Calcular estatísticas
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      // TODO: Criar métodos específicos no dataService para dashboard para evitar buscar TUDO
      // Por enquanto, vamos usar o que temos mas o ideal é filtrar no banco
      const { data: sales } = await supabase.from('sales').select('*').eq('loja_id', currentStore.id)
      const vendasHoje = (sales || []).filter((s: any) => {
        const saleDate = new Date(s.created_at)
        saleDate.setHours(0, 0, 0, 0)
        return saleDate.getTime() === hoje.getTime() && s.status === 'finalizada'
      })

      const vendasValor = vendasHoje.reduce((sum: number, s: any) => sum + Number(s.total), 0)

      const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('empresa_id', currentStore.empresaId)

      // Produtos com estoque baixo
      const { data: allStocks } = await supabase.from('stock').select('*, product:products(nome)').eq('loja_id', currentStore.id)

      const lowStock = (allStocks || [])
        .filter((s: any) => s.quantidade_minima && s.quantidade <= s.quantidade_minima)
        .map((s: any) => ({
          id: s.id,
          nome: s.product?.nome || 'Produto desconhecido',
          quantidade: s.quantidade,
          minimo: s.quantidade_minima || 0,
        }))

      setLowStockProducts(lowStock)

      setStats({
        vendasHoje: vendasHoje.length,
        vendasValor,
        produtosAtivos: products.filter((p) => p.ativo).length,
        produtosBaixoEstoque: lowStock.length,
        clientesTotal: customersCount || 0,
        ticketMedio: vendasHoje.length > 0 ? vendasValor / vendasHoje.length : 0,
      })
    }

    loadDashboardStats()
  }, [currentStore, products, stocks])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de controle
          </p>
        </div>
        <Link href="/pdv">
          <Button size="lg" className="gap-2">
            <ShoppingCart className="h-5 w-5" />
            Abrir PDV
          </Button>
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.vendasValor)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.vendasHoje} vendas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ticketMedio)}</div>
            <div className="flex items-center text-xs text-success">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12% em relação a ontem
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.produtosAtivos}</div>
            <p className="text-xs text-muted-foreground">
              produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesTotal}</div>
            <p className="text-xs text-muted-foreground">
              clientes cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e ações rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Estoque Baixo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Estoque Baixo
                </CardTitle>
                <CardDescription>
                  Produtos que precisam de reposição
                </CardDescription>
              </div>
              <Badge variant="warning">{stats.produtosBaixoEstoque}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum produto com estoque baixo
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Mínimo: {item.minimo} unidades
                      </p>
                    </div>
                    <Badge variant={item.quantidade === 0 ? "destructive" : "warning"}>
                      {item.quantidade} un
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <Link href="/estoque">
                    <Button variant="link" className="px-0">
                      Ver todos ({lowStockProducts.length})
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse as funções mais utilizadas</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/pdv">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <ShoppingCart className="h-6 w-6" />
                Nova Venda
              </Button>
            </Link>
            <Link href="/produtos">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Package className="h-6 w-6" />
                Produtos
              </Button>
            </Link>
            <Link href="/estoque">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <ArrowDownRight className="h-6 w-6" />
                Entrada Estoque
              </Button>
            </Link>
            <Link href="/relatorios">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                Relatórios
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
