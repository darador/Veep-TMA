"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Camera, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

type EppItem = {
    id: string
    name: string
    category: string
    is_critical: boolean
}

type InspectionItemStatus = 'ok' | 'damaged' | 'missing' | 'needs_replacement'

type InspectionData = {
    [key: string]: {
        status: InspectionItemStatus
        photo_url?: string
        observation?: string
    }
}

function InspectionFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const inspectionId = searchParams.get('inspectionId')

    const supabase = createClient()
    const [epps, setEpps] = useState<EppItem[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState<InspectionData>({})
    const [uploading, setUploading] = useState<string | null>(null)

    useEffect(() => {
        const fetchCatalog = async () => {
            const { data, error } = await supabase
                .from('epp_catalog')
                .select('*')
                .eq('is_active', true)
                .order('category')
                .order('name')

            if (data) {
                setEpps(data)
                // Initialize form data
                const initialData: InspectionData = {}
                data.forEach(item => {
                    initialData[item.id] = { status: 'ok' }
                })
                setFormData(initialData)
            }
            setLoading(false)
        }
        fetchCatalog()
    }, [])

    const handleStatusChange = (id: string, status: InspectionItemStatus) => {
        setFormData(prev => ({
            ...prev,
            [id]: { ...prev[id], status }
        }))
    }

    const handleObservationChange = (id: string, text: string) => {
        setFormData(prev => ({
            ...prev,
            [id]: { ...prev[id], observation: text }
        }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(itemId)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${itemId}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('inspections')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('inspections')
                .getPublicUrl(filePath)

            setFormData(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], photo_url: publicUrl }
            }))

        } catch (error) {
            console.error("Error uploading image:", error)
            toast.error("Error al subir la imagen. Intenta nuevamente.")
        } finally {
            setUploading(null)
        }
    }

    const handleSubmit = async () => {
        if (!confirm("¿Confirmas el envío del reporte?")) return
        setSubmitting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No authentifcated user")

            let finalInspectionId = inspectionId

            if (finalInspectionId) {
                // UPDATE existing inspection
                const { error: updateError } = await supabase
                    .from('inspections')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', finalInspectionId)

                if (updateError) throw updateError
            } else {
                // CREATE new inspection
                const { data: inspection, error: inspError } = await supabase
                    .from('inspections')
                    .insert({
                        technician_id: user.id,
                        type: 'voluntary', // Auto-inspección
                        status: 'completed'
                    })
                    .select()
                    .single()

                if (inspError) throw inspError
                finalInspectionId = inspection.id
            }

            // 2. Create Items
            // Note: If updating, we assume items weren't created yet or we append. 
            // For MVP strictness, we just insert.
            const itemsToInsert = epps.map(epp => ({
                inspection_id: finalInspectionId,
                epp_id: epp.id,
                status: formData[epp.id].status,
                photo_url: formData[epp.id].photo_url || null,
                observation: formData[epp.id].observation || null
            }))

            const { error: itemsError } = await supabase
                .from('inspection_items')
                .insert(itemsToInsert)

            if (itemsError) throw itemsError

            toast.success("¡Inspección enviada correctamente!")
            router.push('/technician')

        } catch (error) {
            console.error("Error submitting inspection:", error)
            toast.error("Error al enviar la inspección. Intenta nuevamente.")
        } finally {
            setSubmitting(false)
        }
    }

    // Group by category
    const groupedEpps = epps.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {} as Record<string, EppItem[]>)

    if (loading) return <div className="p-8 text-center">Cargando catálogo...</div>

    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-4 bg-movistar text-white p-6 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 rounded-b-3xl shadow-md mb-4 bg-cover bg-center" style={{ backgroundImage: "url('/comprometidos.png')", backgroundBlendMode: 'soft-light' }}>
                <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/20 hover:text-white rounded-full w-10 h-10 p-0">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight shadow-black/10 drop-shadow-sm">
                        {inspectionId ? "Completar Reporte" : "Nuevo reporte"}
                    </h1>
                    <p className="text-sm text-white/90 font-medium">
                        {inspectionId ? "Solicitado por tu líder" : "Revisión de Equipos"}
                    </p>
                </div>
            </div>

            {Object.entries(groupedEpps).map(([category, items]) => (
                <Card key={category} className="overflow-hidden border-none shadow-md">
                    {category !== 'General' && (
                        <CardHeader className="py-3 bg-zinc-100 dark:bg-zinc-900 border-b">
                            <CardTitle className="text-[15px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{category}</CardTitle>
                        </CardHeader>
                    )}
                    <CardContent className="divide-y p-0">
                        {items.map(item => (
                            <div key={item.id} className="py-4 flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-lg">{item.name}</span>
                                    </div>

                                    <div className="flex w-full sm:w-auto gap-2 self-start sm:self-auto flex-wrap">
                                        <button
                                            onClick={() => handleStatusChange(item.id, 'ok')}
                                            className={`flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 flex-1 sm:flex-none ${formData[item.id]?.status === 'ok'
                                                ? 'bg-movistar-green text-white shadow-md scale-[1.02] ring-2 ring-movistar-green/20'
                                                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            OK
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(item.id, 'needs_replacement')}
                                            className={`flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 flex-1 sm:flex-none ${formData[item.id]?.status === 'needs_replacement'
                                                ? 'bg-amber-500 text-white shadow-md scale-[1.02] ring-2 ring-amber-500/20'
                                                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            Desgaste
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(item.id, 'missing')}
                                            className={`flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 flex-1 sm:flex-none ${formData[item.id]?.status === 'missing'
                                                ? 'bg-red-500 text-white shadow-md scale-[1.02] ring-2 ring-red-500/20'
                                                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Falta
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 items-start bg-muted/20 p-3 rounded-lg border border-dashed">
                                    {/* Photo Preview & Control - Square Prominent */}
                                    <div className="shrink-0 self-center sm:self-start">
                                        {uploading === item.id ? (
                                            <div className="flex flex-col items-center justify-center gap-2 w-24 h-24 border-2 border-dashed rounded-md bg-muted/50 text-xs text-muted-foreground">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Subiendo
                                            </div>
                                        ) : formData[item.id]?.photo_url ? (
                                            <div className="relative group w-24 h-24">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={formData[item.id].photo_url}
                                                    alt="Evidence"
                                                    className="w-full h-full rounded-md object-cover border-2 border-primary/20 shadow-sm"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="w-6 h-6 absolute -top-2 -right-2 rounded-full shadow-md"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        [item.id]: { ...prev[item.id], photo_url: undefined }
                                                    }))}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    id={`file-${item.id}`}
                                                    onChange={(e) => handleImageUpload(e, item.id)}
                                                />
                                                <label
                                                    htmlFor={`file-${item.id}`}
                                                    className={`flex flex-col items-center justify-center gap-2 w-24 h-24 border-2 border-dashed rounded-md cursor-pointer transition-colors ${formData[item.id]?.status !== 'ok' ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    <Camera className="w-6 h-6" />
                                                    <span className="text-[10px] text-center px-1 font-medium leading-tight">
                                                        {formData[item.id]?.status !== 'ok' ? 'Foto Requerida' : 'Tomar Foto'}
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {/* Observation Textarea */}
                                    <div className="flex-1 w-full flex flex-col gap-1">
                                        <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                                            Observaciones <span className="text-[10px] font-normal lowercase">(Opcional)</span>
                                        </label>
                                        <textarea
                                            placeholder="Detalla cómo se encuentra el equipo, si nota alguna rotura, desgaste, marca, etc."
                                            value={formData[item.id]?.observation || ""}
                                            onChange={(e) => handleObservationChange(item.id, e.target.value)}
                                            className="w-full h-24 sm:h-[88px] text-sm p-3 rounded-md border border-input bg-background/50 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background transition-colors placeholder:text-muted-foreground/60 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                <div className="max-w-2xl mx-auto">
                    <Button
                        onClick={handleSubmit}
                        className="w-full h-12 text-lg shadow-lg"
                        disabled={submitting}
                    >
                        {submitting ? "Enviando..." : "Finalizar Reporte"}
                    </Button>
                </div>
            </div>
        </div>
    )
}


export default function NewInspectionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <InspectionFormContent />
        </Suspense>
    )
}
