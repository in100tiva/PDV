"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  FileText,
  Settings,
  Store,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAppStore } from "@/stores"

const menuItems = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pdv", label: "PDV", icon: ShoppingCart },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { href: "/produtos", label: "Produtos", icon: Package },
      { href: "/categorias", label: "Categorias", icon: Boxes },
      { href: "/clientes", label: "Clientes", icon: Users },
    ],
  },
  {
    title: "Operações",
    items: [
      { href: "/estoque", label: "Estoque", icon: Boxes },
      { href: "/vendas", label: "Vendas", icon: FileText },
      { href: "/fiado", label: "Fiado", icon: CreditCard },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    title: "Configurações",
    items: [
      { href: "/lojas", label: "Lojas", icon: Store },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, currentStore } = useAppStore()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {sidebarOpen && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              P
            </div>
            <span className="font-semibold">PDV System</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(!sidebarOpen && "mx-auto")}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <div className="p-2">
          {/* Loja atual */}
          {currentStore && sidebarOpen && (
            <div className="mb-4 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Loja atual</p>
              <p className="font-medium truncate">{currentStore.nome}</p>
            </div>
          )}

          {/* Menu */}
          <nav className="space-y-4">
            {menuItems.map((section) => (
              <div key={section.title}>
                {sidebarOpen && (
                  <h4 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                    {section.title}
                  </h4>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          !sidebarOpen && "justify-center px-2"
                        )}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    )
                  })}
                </div>
                {sidebarOpen && <Separator className="my-4" />}
              </div>
            ))}
          </nav>
        </div>
      </ScrollArea>
    </aside>
  )
}
