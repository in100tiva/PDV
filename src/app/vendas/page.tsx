"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function VendasPage() {
        return (
                <div className="space-y-6">
                        <div>
                                <h1 className="text-3xl font-bold">Vendas</h1>
                                <p className="text-muted-foreground underline">Histórico e gestão de vendas</p>
                        </div>

                        <Card>
                                <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                Lista de Vendas
                                        </CardTitle>
                                </CardHeader>
                                <CardContent>
                                        <div className="flex h-40 items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                Módulo de vendas em desenvolvimento...
                                        </div>
                                </CardContent>
                        </Card>
                </div>
        )
}
