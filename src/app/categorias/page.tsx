"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Boxes } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useProductStore, useAppStore } from "@/stores"
import type { Category } from "@/types"

const defaultColors = [
  "#3B82F6",
  "#22C55E",
  "#A855F7",
  "#F97316",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#6B7280",
]

export default function CategoriasPage() {
  const { currentStore } = useAppStore()
  const { categories, loadCategories, addCategory, updateCategory, deleteCategory, products } = useProductStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    cor: defaultColors[0],
  })

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        nome: category.nome,
        descricao: category.descricao || "",
        cor: category.cor || defaultColors[0],
      })
    } else {
      setEditingCategory(null)
      setFormData({
        nome: "",
        descricao: "",
        cor: defaultColors[Math.floor(Math.random() * defaultColors.length)],
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!currentStore) return

    const categoryData = {
      empresaId: currentStore.empresaId,
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      cor: formData.cor,
      ativa: true,
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData)
    } else {
      addCategory(categoryData)
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    const productsInCategory = products.filter((p) => p.categoriaId === id).length
    if (productsInCategory > 0) {
      alert(`Esta categoria possui ${productsInCategory} produto(s). Remova os produtos primeiro.`)
      return
    }
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      deleteCategory(id)
    }
  }

  const getProductCount = (categoryId: string) => {
    return products.filter((p) => p.categoriaId === categoryId && p.ativo).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            Organize seus produtos em categorias
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Grid de categorias */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.filter((c) => c.ativa).map((category) => {
          const productCount = getProductCount(category.id)

          return (
            <Card key={category.id} className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: category.cor }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.cor }}
                    >
                      <Boxes className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">{category.nome}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.descricao && (
                  <p className="text-sm text-muted-foreground mb-2">{category.descricao}</p>
                )}
                <p className="text-sm">
                  <span className="font-medium">{productCount}</span> produto(s)
                </p>
              </CardContent>
            </Card>
          )
        })}

        {categories.filter((c) => c.ativa).length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Atualize as informações da categoria"
                : "Preencha os dados para cadastrar uma nova categoria"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      formData.cor === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, cor: color })}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: formData.cor }}
                >
                  <Boxes className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">{formData.nome || "Nome da categoria"}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.nome}>
              {editingCategory ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
