"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Store } from "lucide-react"

export default function LojasPage() {
        return (
                <div className="space-y-6">
                        <div>
                                <h1 className="text-3xl font-bold">Minhas Lojas</h1>
                                <p className="text-muted-foreground">Gerencie as unidades do seu negócio</p>
                        </div>

                        <Card>
                                <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                                <Store className="h-5 w-5" />
                                                Unidades Cadastradas
                                        </CardTitle>
                                </CardHeader>
                                <CardContent>
                                        <div className="flex h-40 items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                Módulo de lojas em desenvolvimento...
                                        </div>
                                </CardContent>
                        </Card>
                </div>
        )
}
