"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function SetupPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState<'admin' | 'supervisor' | 'technician'>('admin')
    const [status, setStatus] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) throw authError
            if (!authData.user) throw new Error("No user returned from Auth")

            // 2. Insert into public.users with 'admin' role
            // Note: Triggers might handle this, but for MVP we ensure it here if RLS allows.
            // Based on schema: "INSERT INTO public.users ..."
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: email,
                    role: role,
                    full_name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`
                })
                .select() // Ensure we wait for completion

            if (dbError) {
                // If generic trigger exists, it might have already created it. 
                // Let's try updating if insert failed (duplicate key)
                if (dbError.code === '23505') { // Unique violation
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ role: role })
                        .eq('id', authData.user.id)

                    if (updateError) throw updateError
                    setStatus("User existed. Updated role to Admin.")
                } else {
                    throw dbError
                }
            } else {
                setStatus(`User created successfully with role: ${role}!`)
                toast.success(`Usuario creado: ${email}`)
            }

        } catch (err: any) {
            console.error(err)
            setStatus(`Error: ${err.message}`)
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSeedCatalog = async () => {
        setLoading(true)
        setStatus(null)
        try {
            const epps = [
                { name: "Casco de Seguridad", category: "Cabeza", is_critical: true },
                { name: "Gafas de Protección", category: "Ojos", is_critical: true },
                { name: "Guantes Dieléctricos", category: "Manos", is_critical: true },
                { name: "Arnés de Seguridad", category: "Altura", is_critical: true },
                { name: "Botas de Seguridad", category: "Pies", is_critical: false },
                { name: "Chaleco Reflectante", category: "Cuerpo", is_critical: false },
            ]

            const { error } = await supabase.from('epp_catalog').insert(epps)

            if (error) throw error
            setStatus("Catálogo EPP sembrado con éxito (" + epps.length + " ítems).")
            toast.success("Catálogo sembrado con éxito")
        } catch (err: any) {
            console.error(err)
            setStatus(`Error seeding catalog: ${err.message}`)
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Setup Tools</CardTitle>
                    <CardDescription>Herramientas de configuración inicial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-medium text-sm">1. Crear Usuario</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Rol</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="technician">Técnico</option>
                                </select>
                            </div>
                            <Input
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Procesando..." : "Crear Usuario"}
                            </Button>
                        </form>
                    </div>

                    <div className="space-y-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="font-medium text-sm">2. Sembrar Datos</h3>
                        <Button onClick={handleSeedCatalog} variant="outline" disabled={loading} className="w-full">
                            Sembrar Catálogo EPP (6 ítems)
                        </Button>
                    </div>

                    {status && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm font-medium border border-blue-200 dark:border-blue-900">
                            {status}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
