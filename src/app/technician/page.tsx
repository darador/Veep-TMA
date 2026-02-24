"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PlusCircle, ClipboardList, Clock, AlertCircle } from "lucide-react"

import { Header } from "@/components/layout/Header"

export default function TechnicianPage() {
    const supabase = createClient()
    const [inspections, setInspections] = useState<any[]>([])
    const [pendingAudits, setPendingAudits] = useState<any[]>([])
    const [userName, setUserName] = useState<string>("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', user.id)
                .single()

            if (profile?.full_name) {
                setUserName(profile.full_name)
            } else {
                setUserName(user.email?.split('@')[0] || "Técnico")
            }

            // 1. Fetch COMPLETED history
            const { data, error } = await supabase
                .from('inspections')
                .select('*')
                .eq('technician_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setInspections(data)

            // 2. Fetch PENDING AUDITS
            const { data: pending } = await supabase
                .from('inspections')
                .select('*')
                .eq('technician_id', user.id)
                .eq('status', 'pending')
                .eq('type', 'audit')

            if (pending) setPendingAudits(pending)

            setLoading(false)
        }

        fetchHistory()
    }, [])

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header
                title={userName ? `Hola, ${userName}` : "Cargando..."}
                subtitle="Gestiona tus revisiones de EPP"
                icon={
                    <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 pointer-events-none overflow-hidden hidden sm:block">
                        <img
                            src="/tecnico.png"
                            alt="Técnico"
                            className="w-full h-full object-cover object-top -ml-4 -mt-2"
                        />
                    </div>
                }
            >
                <div className="ml-0 sm:ml-24 md:ml-40 z-10 relative">
                    <Link href="/technician/inspections/new">
                        <Button className="gap-2 shadow-lg bg-primary hover:bg-primary/90 text-white">
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Agregar Reporte</span>
                            <span className="sm:hidden">Agregar</span>
                        </Button>
                    </Link>
                </div>
            </Header>

            <main className="container max-w-4xl mx-auto p-6 space-y-8">

                {/* Pendientes Alert */}
                {pendingAudits.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full text-orange-600 dark:text-orange-400">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-orange-800 dark:text-orange-200">¡Auditoría Requerida!</h3>
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    Tu supervisor ha solicitado {pendingAudits.length} revisión(es).
                                </p>
                            </div>
                        </div>
                        <Link href={`/technician/inspections/new?inspectionId=${pendingAudits[0].id}`}>
                            <Button variant="default" className="bg-orange-600 hover:bg-orange-700 text-white border-none w-full sm:w-auto">
                                Realizar Auditoría
                            </Button>
                        </Link>
                    </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium">Total reportes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "..." : inspections.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Histórico</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5" />
                            Historial Reciente
                        </CardTitle>
                        <CardDescription>Tus últimos reportes enviados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-sm text-muted-foreground">Cargando...</div>
                        ) : inspections.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                No hay inspecciones registradas.
                                <br />
                                <Link href="/technician/inspections/new" className="text-primary hover:underline">
                                    ¡Inicia la primera!
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {inspections.map((insp) => (
                                    <div key={insp.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div>
                                            <div className="font-medium">
                                                {insp.type === 'audit' ? 'Reporte registrado' : 'Auto-Inspección'}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(insp.created_at).toLocaleDateString()} - {new Date(insp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${insp.status === 'completed'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {insp.status === 'completed' ? 'Completada' : 'Pendiente'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
