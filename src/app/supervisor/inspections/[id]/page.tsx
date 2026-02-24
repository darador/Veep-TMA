"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Calendar, User, FileOutput } from "lucide-react"
import { Header } from "@/components/layout/Header"
import Image from "next/image"

export default function InspectionDetailPage() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string

    const supabase = createClient()
    const [inspection, setInspection] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDetail = async () => {
            const { data, error } = await supabase
                .from('inspections')
                .select(`
                    *,
                    technician:users!inspections_technician_id_fkey (
                        full_name,
                        email
                    ),
                    items:inspection_items (
                        id,
                        status,
                        photo_url,
                        observation,
                        epp:epp_catalog (
                            name,
                            category,
                            is_critical
                        )
                    )
                `)
                .eq('id', id)
                .single()

            if (error) {
                console.error("Error fetching detail:", error)
            } else {
                setInspection(data)
            }
            setLoading(false)
        }

        if (id) fetchDetail()
    }, [id])

    if (loading) return <div className="p-8 text-center bg-muted/20 min-h-screen">Cargando reporte...</div>
    if (!inspection) return <div className="p-8 text-center text-red-500">Inspección no encontrada.</div>

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header
                title="Detalle de Reporte"
                subtitle="Verificación de EPP"
                icon={
                    <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 mr-2 relative">
                        <Image
                            src="/tecnico.png"
                            alt="Supervisor"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                }
            />

            <main className="container max-w-5xl mx-auto p-6 space-y-8 pb-20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-xl border shadow-sm print:shadow-none print:border-none print:p-0">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Link href="/supervisor" className="print:hidden">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold">Reporte de {inspection.technician?.full_name}</h2>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Badge variant="secondary" className="font-normal gap-1">
                                    <User className="w-3 h-3" />
                                    {inspection.technician?.full_name}
                                </Badge>
                                <Badge variant="secondary" className="font-normal gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(inspection.created_at).toLocaleString()}
                                </Badge>
                                <Badge variant="outline" className={`font-medium ${inspection.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                    {inspection.status === 'completed' ? 'Completado' : 'Pendiente'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="gap-2 shrink-0 print:hidden w-full sm:w-auto"
                        onClick={() => window.print()}
                    >
                        <FileOutput className="w-4 h-4" />
                        Generar PDF
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {inspection.items?.map((item: any) => (
                        <Card key={item.id} className={`overflow-hidden ${item.status !== 'ok' ? 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10' : ''
                            }`}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base font-medium mt-1">
                                            {item.epp?.name}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-3">
                                {/* Status Badge */}
                                <div>
                                    {item.status === 'ok' && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> OK
                                        </Badge>
                                    )}
                                    {item.status === 'needs_replacement' && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Desgaste / Reemplazar
                                        </Badge>
                                    )}
                                    {item.status === 'missing' && (
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                                            <XCircle className="w-3 h-3" /> Faltante
                                        </Badge>
                                    )}
                                </div>

                                {/* Observations */}
                                {item.observation && (
                                    <div className="bg-muted/30 p-3 rounded-md text-sm text-slate-700 border border-muted/50 mt-4 mb-2">
                                        <p className="font-medium text-xs text-slate-500 mb-1 uppercase tracking-wider">Observaciones</p>
                                        <p className="whitespace-pre-wrap">{item.observation}</p>
                                    </div>
                                )}

                                {/* Photo Evidence */}
                                {item.photo_url ? (
                                    <div className="rounded-lg overflow-hidden border bg-black/5 relative group aspect-video">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.photo_url}
                                            alt="Evidencia"
                                            className="w-full h-full object-cover transition-transform hover:scale-105"
                                        />
                                        <a
                                            href={item.photo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Ver completa
                                        </a>
                                    </div>
                                ) : (
                                    <div className="h-24 bg-muted/10 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                                        Sin foto
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div >
    )
}
