"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/stores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
        const router = useRouter()
        const login = useAppStore((state) => state.login)
        const [email, setEmail] = useState("")
        const [password, setPassword] = useState("")
        const [error, setError] = useState<string | null>(null)
        const [loading, setLoading] = useState(false)

        const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault()
                setError(null)
                setLoading(true)

                try {
                        const success = await login(email, password)
                        if (success) {
                                router.push("/")
                        } else {
                                setError("Email ou senha inválidos")
                        }
                } catch (err: any) {
                        setError(err.message || "Ocorreu um erro ao fazer login")
                } finally {
                        setLoading(false)
                }
        }

        return (
                <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
                        <Card className="w-full max-w-md">
                                <CardHeader className="space-y-1">
                                        <CardTitle className="text-2xl font-bold text-center">PDV System</CardTitle>
                                        <CardDescription className="text-center">
                                                Entre com suas credenciais para acessar o sistema
                                        </CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSubmit}>
                                        <CardContent className="space-y-4">
                                                {error && (
                                                        <Alert variant="destructive">
                                                                <AlertCircle className="h-4 w-4" />
                                                                <AlertTitle>Erro</AlertTitle>
                                                                <AlertDescription>{error}</AlertDescription>
                                                        </Alert>
                                                )}
                                                <div className="space-y-2">
                                                        <Label htmlFor="email">Email</Label>
                                                        <Input
                                                                id="email"
                                                                type="email"
                                                                placeholder="seu@email.com"
                                                                value={email}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                required
                                                                disabled={loading}
                                                        />
                                                </div>
                                                <div className="space-y-2">
                                                        <Label htmlFor="password">Senha</Label>
                                                        <Input
                                                                id="password"
                                                                type="password"
                                                                value={password}
                                                                onChange={(e) => setPassword(e.target.value)}
                                                                required
                                                                disabled={loading}
                                                        />
                                                </div>
                                        </CardContent>
                                        <CardFooter>
                                                <Button className="w-full" type="submit" disabled={loading}>
                                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Entrar
                                                </Button>
                                        </CardFooter>
                                </form>
                        </Card>
                </div>
        )
}
