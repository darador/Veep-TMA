"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Calendar, User } from "lucide-react"

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
        <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/supervisor">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Detalle de Inspección</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Badge variant="outline" className="font-normal gap-1">
                            <User className="w-3 h-3" />
                            {inspection.technician?.full_name}
                        </Badge>
                        <Badge variant="outline" className="font-normal gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(inspection.created_at).toLocaleString()}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inspection.items?.map((item: any) => (
                    <Card key={item.id} className={`overflow-hidden ${item.status !== 'ok' ? 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10' : ''
                        }`}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                        {item.epp?.category}
                                    </div>
                                    <CardTitle className="text-base font-medium mt-1">
                                        {item.epp?.name}
                                    </CardTitle>
                                </div>
                                {item.epp?.is_critical && (
                                    <Badge variant="destructive" className="text-[10px]">CRÍTICO</Badge>
                                )}
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
        </div>
    )
}
