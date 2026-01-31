"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function ConfiguracoesPage() {
        return (
                <div className="space-y-6">
                        <div>
                                <h1 className="text-3xl font-bold">Configurações</h1>
                                <p className="text-muted-foreground">Ajustes gerais do sistema</p>
                        </div>

                        <Card>
                                <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                                <Settings className="h-5 w-5" />
                                                Configurações do Sistema
                                        </CardTitle>
                                </CardHeader>
                                <CardContent>
                                        <div className="flex h-40 items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                Módulo de configurações em desenvolvimento...
                                        </div>
                                </CardContent>
                        </Card>
                </div>
        )
}
