"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Edit, Trash2, MoreHorizontal, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useProductStore, useAppStore } from "@/stores"
import { formatCurrency } from "@/lib/utils"
import type { Product, UnitOfMeasure } from "@/types"

const unidadesMedida: { value: UnitOfMeasure; label: string }[] = [
  { value: "un", label: "Unidade" },
  { value: "kg", label: "Quilograma" },
  { value: "g", label: "Grama" },
  { value: "l", label: "Litro" },
  { value: "ml", label: "Mililitro" },
  { value: "cx", label: "Caixa" },
  { value: "pc", label: "Pacote" },
]

export default function ProdutosPage() {
  const { currentStore } = useAppStore()
  const {
    products,
    categories,
    loadAll,
    addProduct,
    updateProduct,
    deleteProduct,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    getFilteredProducts,
    stocks,
    loadStocks,
  } = useProductStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    codigoBarras: "",
    codigoInterno: "",
    categoriaId: "",
    unidadeMedida: "un" as UnitOfMeasure,
    precoCusto: "",
    precoVenda: "",
    descricao: "",
  })

  useEffect(() => {
    loadAll()
    if (currentStore) {
      loadStocks(currentStore.id)
    }
  }, [loadAll, loadStocks, currentStore])

  const filteredProducts = getFilteredProducts()

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        nome: product.nome,
        codigoBarras: product.codigoBarras || "",
        codigoInterno: product.codigoInterno || "",
        categoriaId: product.categoriaId || "",
        unidadeMedida: product.unidadeMedida,
        precoCusto: product.precoCusto?.toString() || "",
        precoVenda: product.precoVenda.toString(),
        descricao: product.descricao || "",
      })
    } else {
      setEditingProduct(null)
      setFormData({
        nome: "",
        codigoBarras: "",
        codigoInterno: "",
        categoriaId: "",
        unidadeMedida: "un",
        precoCusto: "",
        precoVenda: "",
        descricao: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    const { currentStore } = useAppStore.getState()
    if (!currentStore) return

    const productData = {
      empresaId: currentStore.empresaId,
      nome: formData.nome,
      codigoBarras: formData.codigoBarras || undefined,
      codigoInterno: formData.codigoInterno || undefined,
      categoriaId: formData.categoriaId || undefined,
      unidadeMedida: formData.unidadeMedida,
      precoCusto: formData.precoCusto ? parseFloat(formData.precoCusto) : undefined,
      precoVenda: parseFloat(formData.precoVenda),
      descricao: formData.descricao || undefined,
      ativo: true,
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, productData)
    } else {
      addProduct(productData)
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(id)
    }
  }

  const getStock = (productId: string) => {
    if (!currentStore) return null
    return stocks.find((s) => s.produtoId === productId && s.lojaId === currentStore.id)
  }

  const getCategory = (categoryId?: string) => {
    if (!categoryId) return null
    return categories.find((c) => c.id === categoryId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro de produtos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={selectedCategory || "all"}
              onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Produtos ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const category = getCategory(product.categoriaId)
                  const stock = getStock(product.id)
                  const isLowStock = stock && stock.quantidadeMinima && stock.quantidade <= stock.quantidadeMinima

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.nome}</p>
                          {product.descricao && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {product.descricao}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {product.codigoBarras || product.codigoInterno || "-"}
                        </code>
                      </TableCell>
                      <TableCell>
                        {category ? (
                          <Badge
                            variant="outline"
                            style={{ borderColor: category.cor, color: category.cor }}
                          >
                            {category.nome}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.precoCusto ? formatCurrency(product.precoCusto) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.precoVenda)}
                      </TableCell>
                      <TableCell className="text-right">
                        {stock ? (
                          <Badge variant={isLowStock ? "warning" : "secondary"}>
                            {stock.quantidade} {product.unidadeMedida}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.ativo ? "success" : "secondary"}>
                          {product.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Atualize as informações do produto"
                : "Preencha os dados para cadastrar um novo produto"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoriaId}
                  onValueChange={(v) => setFormData({ ...formData, categoriaId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigoBarras">Código de Barras</Label>
                <Input
                  id="codigoBarras"
                  value={formData.codigoBarras}
                  onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                  placeholder="EAN-13"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigoInterno">Código Interno</Label>
                <Input
                  id="codigoInterno"
                  value={formData.codigoInterno}
                  onChange={(e) => setFormData({ ...formData, codigoInterno: e.target.value })}
                  placeholder="SKU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade de Medida</Label>
                <Select
                  value={formData.unidadeMedida}
                  onValueChange={(v) => setFormData({ ...formData, unidadeMedida: v as UnitOfMeasure })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map((um) => (
                      <SelectItem key={um.value} value={um.value}>
                        {um.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precoCusto">Preço de Custo</Label>
                <Input
                  id="precoCusto"
                  type="number"
                  step="0.01"
                  value={formData.precoCusto}
                  onChange={(e) => setFormData({ ...formData, precoCusto: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoVenda">Preço de Venda *</Label>
                <Input
                  id="precoVenda"
                  type="number"
                  step="0.01"
                  value={formData.precoVenda}
                  onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do produto"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.nome || !formData.precoVenda}>
              {editingProduct ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
