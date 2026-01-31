"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

export default function FiadoPage() {
        return (
                <div className="space-y-6">
                        <div>
                                <h1 className="text-3xl font-bold">Fiado / Crediário</h1>
                                <p className="text-muted-foreground">Gestão de contas a receber e clientes</p>
                        </div>

                        <Card>
                                <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                                <CreditCard className="h-5 w-5" />
                                                Contas Pendentes
                                        </CardTitle>
                                </CardHeader>
                                <CardContent>
                                        <div className="flex h-40 items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                Módulo de fiado em desenvolvimento...
                                        </div>
                                </CardContent>
                        </Card>
                </div>
        )
}
