import type { Metadata } from "next"
import "./globals.css"
import { MainLayout } from "@/components/layout"

export const metadata: Metadata = {
  title: "PDV System - Sistema de Ponto de Venda",
  description: "Sistema completo de PDV com controle de estoque para pequenos comércios",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}
